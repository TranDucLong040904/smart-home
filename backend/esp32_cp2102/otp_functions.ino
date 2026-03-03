/*
 * OTP_FUNCTIONS.INO - One-time OTP handling (Firebase)
 * Tách riêng để tránh xung đột với luồng keypad/state machine hiện có.
 * Logic: cache OTP từ Firebase, kiểm tra khi người dùng nhập, đánh dấu dùng/expired.
 */

#include <time.h>

struct OtpState {
  String code;
  uint64_t expireAtMs = 0; // Epoch millis tính từ TTL (nếu có server time)
  uint32_t durationMs = 0; // TTL hiện tại (ms)
  bool used = false;
  bool hasOtp = false;
  unsigned long lastSync = 0;
  unsigned long syncedAt = 0; // millis() tại thời điểm đồng bộ OTP
  bool lastTimeFromServer = false;
};

static OtpState otpState;
static uint32_t otpTtlMs = 300000; // TTL mặc định 5 phút
static unsigned long lastTtlFetch = 0;
#define OTP_TTL_FETCH_INTERVAL 10000UL // 10s kiểm tra TTL một lần

// ===== Internal helpers =====
static uint64_t nowMsFallback(bool &isServerTime) {
  time_t now = Firebase.getCurrentTime();
  // Ignore invalid RTC values (e.g., 1970/epoch ~0) — require >= 1e9s (~2001)
  if (now >= 1000000000) {
    isServerTime = true;
    return (uint64_t)now * 1000ULL;
  }
  // Fallback: dùng millis nếu chưa có NTP
  isServerTime = false;
  return (uint64_t)millis();
}

static void markOtpStatus(const char *status, bool usedFlag) {
  otpState.used = usedFlag;
  FirebaseJson update;
  update.set("status", status);
  update.set("used", usedFlag);
  update.set("lastUpdate/.sv", "timestamp");
  Firebase.RTDB.updateNode(&fbdo, String(FB_PATH_COMMANDS) + "/otp", &update);
}

static void refreshOtpTtl() {
  if (!Firebase.ready())
    return;

  unsigned long nowTick = millis();
  if (nowTick - lastTtlFetch < OTP_TTL_FETCH_INTERVAL)
    return;
  lastTtlFetch = nowTick;

  String path = String(FB_PATH_CONFIG) + "/otpTtlMs";
  if (Firebase.RTDB.getInt(&fbdo, path)) {
    int val = fbdo.intData();
    // Giới hạn an toàn: 1s - 24h
    if (val >= 1000 && val <= 86400000) {
      otpTtlMs = (uint32_t)val;
    }
  }
}

static bool isOtpExpired() {
  if (!otpState.hasOtp)
    return true;
  if (otpState.used)
    return true;
  if (otpState.durationMs == 0 && otpState.expireAtMs == 0)
    return false; // Không cấu hình hạn -> coi như còn hiệu lực

  bool isServerTime = false;
  uint64_t now = nowMsFallback(isServerTime);
  otpState.lastTimeFromServer = isServerTime;

  // Nếu có thời gian server và có expireAtMs -> so sánh epoch
  if (isServerTime && otpState.expireAtMs > 0) {
    if (now >= otpState.expireAtMs) {
      markOtpStatus("expired", true);
      return true;
    }
    return false;
  }

  // Fallback: không có thời gian server, dùng duration + syncedAt
  if (otpState.durationMs > 0 && otpState.syncedAt > 0) {
    unsigned long elapsed = millis() - otpState.syncedAt;
    if (elapsed >= otpState.durationMs) {
      markOtpStatus("expired", true);
      return true;
    }
    return false;
  }

  return false;
}

// ===== Public API =====
// Đồng bộ OTP từ Firebase (non-blocking, gọi định kỳ từ checkCloudCommand)
void syncOtpFromCloud() {
  if (!firebaseReady || !Firebase.ready())
    return;

  // OTP sync interval điều khiển từ firebase_functions (OTP_SYNC_INTERVAL)
  unsigned long nowTick = millis();
  otpState.lastSync = nowTick;

  refreshOtpTtl();

  String path = String(FB_PATH_COMMANDS) + "/otp";
  if (!Firebase.RTDB.getJSON(&fbdo, path)) {
    return;
  }

  FirebaseJson json = fbdo.to<FirebaseJson>();
  FirebaseJsonData data;

  String code;
  bool used = false;

  if (json.get(data, "code") && data.success) {
    code = data.to<String>();
  }

  if (json.get(data, "used") && data.success) {
    used = data.to<bool>();
  }

  if (code.length() == 0) {
    otpState.hasOtp = false;
    otpState.code = "";
    otpState.used = false;
    otpState.expireAtMs = 0;
    otpState.durationMs = 0;
    otpState.syncedAt = 0;
    return;
  }

  bool isNewOtp = (!otpState.hasOtp) || (otpState.code != code) || (otpState.used != used);

  // Nếu OTP mới hoặc trạng thái used thay đổi -> reset bộ đếm TTL
  if (isNewOtp) {
    otpState.code = code;
    otpState.used = used;
    otpState.durationMs = otpTtlMs;
    otpState.syncedAt = millis();

    bool isServerTime = false;
    uint64_t base = nowMsFallback(isServerTime);
    otpState.lastTimeFromServer = isServerTime;

    if (isServerTime) {
      otpState.expireAtMs = base + otpTtlMs;
    } else {
      otpState.expireAtMs = 0; // sẽ dùng fallback millis
    }
  } else {
    // Giữ nguyên thời điểm hết hạn hiện tại để tránh reset TTL mỗi lần sync
    // (chỉ cập nhật nếu cần thay đổi flag used theo cloud)
    otpState.used = used;
  }

  otpState.hasOtp = true;
}

// Kiểm tra OTP one-time; nếu đúng -> đánh dấu used trên cloud
bool verifyOtpAndConsume(const char *input, byte len) {
  if (!otpState.hasOtp)
    return false;

  if (isOtpExpired())
    return false;

  if (otpState.code.length() != len)
    return false;

  if (otpState.code != String(input))
    return false;

  // Đánh dấu đã dùng
  markOtpStatus("used", true);
  logEvent("otp_success", "OTP accepted");

  // Xóa cache để tránh dùng lại tại thiết bị
  otpState.used = true;
  return true;
}
