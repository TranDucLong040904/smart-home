/*
 * OTP_FUNCTIONS.INO - One-time OTP handling (Firebase)
 * Tách riêng để tránh xung đột với luồng keypad/state machine hiện có.
 * Logic: cache OTP từ Firebase, kiểm tra khi người dùng nhập, đánh dấu dùng/expired.
 */

#include <time.h>

struct OtpState {
  String code;
  uint64_t expireAtMs = 0; // Epoch millis do frontend ghi xuống
  bool used = false;
  bool hasOtp = false;
  unsigned long lastSync = 0;
  bool lastTimeFromServer = false;
};

static OtpState otpState;

// ===== Internal helpers =====
static uint64_t nowMsFallback(bool &isServerTime) {
  time_t now = Firebase.getCurrentTime();
  if (now > 0) {
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

static bool isOtpExpired() {
  if (!otpState.hasOtp)
    return true;
  if (otpState.used)
    return true;
  if (otpState.expireAtMs == 0)
    return false; // Không có hạn -> coi như còn hiệu lực

  bool isServerTime = false;
  uint64_t now = nowMsFallback(isServerTime);

  // Nếu không có thời gian server nhưng expireAtMs là epoch ms rất lớn -> để an toàn, coi như hết hạn
  if (!isServerTime && otpState.expireAtMs > 100000000000ULL) { // ~1973 in ms
    return true;
  }

  otpState.lastTimeFromServer = isServerTime;

  if (now > otpState.expireAtMs) {
    markOtpStatus("expired", true);
    return true;
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

  String path = String(FB_PATH_COMMANDS) + "/otp";
  if (!Firebase.RTDB.getJSON(&fbdo, path)) {
    return;
  }

  FirebaseJson json = fbdo.to<FirebaseJson>();
  FirebaseJsonData data;

  String code;
  bool used = false;
  double expireAt = 0;
  double expires = 0;
  double durationSec = 0;
  double tsCreated = 0;

  if (json.get(data, "code") && data.success) {
    code = data.to<String>();
  }

  if (json.get(data, "used") && data.success) {
    used = data.to<bool>();
  }

  // chấp nhận cả expireAt (ms hoặc s) và expires (ms hoặc s)
  if (json.get(data, "expireAt") && data.success) {
    expireAt = data.to<double>();
  }
  if (json.get(data, "expires") && data.success) {
    expires = data.to<double>();
  }

  // fallback: durationSeconds + timestamp
  if (json.get(data, "durationSeconds") && data.success) {
    durationSec = data.to<double>();
  }
  if (json.get(data, "timestamp") && data.success) {
    tsCreated = data.to<double>();
  }

  if (code.length() == 0) {
    otpState.hasOtp = false;
    otpState.code = "";
    otpState.used = false;
    otpState.expireAtMs = 0;
    return;
  }

  otpState.code = code;
  otpState.used = used;
  // Frontend có thể gửi epoch giây hoặc milli; nếu nhỏ hơn 2e9 coi là giây, nhân 1000
  auto toMs = [](double v) -> uint64_t {
    if (v <= 0)
      return 0;
    if (v < 2000000000.0) // epoch giây
      return (uint64_t)(v * 1000.0);
    return (uint64_t)v; // epoch milli
  };

  uint64_t expireMs = toMs(expires);
  if (expireMs == 0)
    expireMs = toMs(expireAt);

  // fallback: timestamp + durationSeconds
  if (expireMs == 0 && durationSec > 0 && tsCreated > 0) {
    expireMs = toMs(tsCreated) + (uint64_t)(durationSec * 1000.0);
  }

  // Nếu vẫn không có hạn, coi như OTP không hợp lệ -> xoá cache
  if (expireMs == 0) {
    otpState.hasOtp = false;
    otpState.code = "";
    otpState.used = false;
    otpState.expireAtMs = 0;
    return;
  }

  otpState.expireAtMs = expireMs;
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
