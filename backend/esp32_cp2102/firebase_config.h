/*
 * FIREBASE_CONFIG.H - Cấu hình Firebase cho Smart Door
 * Smart Door Project
 * Date: 2026-01-28
 *
 * QUAN TRỌNG: File này chứa credentials nhạy cảm
 * Thêm vào .gitignore để không push lên GitHub!
 */

#ifndef FIREBASE_CONFIG_H
#define FIREBASE_CONFIG_H

// Firebase Realtime Database URL (không có / ở cuối)
#define FIREBASE_HOST                                                          \
  "smart-home-v1-0-24872-default-rtdb.asia-southeast1.firebasedatabase.app"

// Firebase Database Secret (Legacy Token - đơn giản hơn API Key)
#define FIREBASE_DATABASE_SECRET "XekO6Q7jVtsG8pwm4L2hJCcnl7sgbSqUR0XJc3lC"

// Device ID (dùng để phân biệt các thiết bị khác nhau)
// Khớp với frontend và schema: esp32_cp2102
#define DEVICE_ID "esp32_cp2102"

// Firebase paths
#define FB_PATH_DEVICES "/devices/" DEVICE_ID
#define FB_PATH_COMMANDS "/commands/" DEVICE_ID
#define FB_PATH_CONFIG "/config/" DEVICE_ID
#define FB_PATH_LOGS "/logs"

#endif // FIREBASE_CONFIG_H
