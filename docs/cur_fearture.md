# Báo cáo tính năng hiện tại (13-02-2026)

## Chức năng phần cứng (ESP32 CP2102 firmware)
- Keypad 4x4 với state machine 4 trạng thái, hỗ trợ nhập/đổi mật khẩu, xoá ký tự, phím D đóng nhanh khi cửa đang mở.
- Lưu mật khẩu EEPROM, mật khẩu mặc định 123456, kiểm tra độ mạnh (tối thiểu 6 ký tự, chặn ngày sinh/lặp/liên tiếp, không trùng mật khẩu cũ), khoá tạm 10s sau 3 lần sai, hết hạn phiên 5s.
- Servo điều khiển cửa (mở 90°, đóng 0°), giữ trạng thái, detach sau khởi tạo; nút trong nhà riêng (GPIO32) debounce 200ms để toggle mở/đóng.
- Buzzer riêng (GPIO33) với nhiều mẫu âm: bíp phím, thành công, sai, khoá tạm, đổi mật khẩu.
- LCD I2C 16x2 hiển thị màn hình nhập/mở khoá/đổi mật khẩu/lỗi/khoá tạm; quản lý con trỏ nhập.
- WiFiManager non-blocking: AP `SmartDoor_Config` (12345678), portal timeout 3 phút, connect timeout 10s; web server cục bộ (/, /open, /close, /status, /resetwifi) hoạt động khi đã kết nối WiFi.
- Firebase Realtime Database (Database Secret): cập nhật trạng thái cửa/khoá/online/WiFi mỗi 2s, nhận lệnh `open`/`close` mỗi 500ms, ghi log sự kiện lên `/logs`, đặt trạng thái offline khi cần.

## Chức năng phần mềm (Frontend web app)
- Xác thực Firebase Auth Email/Password, bảo vệ trang; đồng bộ clock thời gian thực.
- Điều khiển cửa: nút mở/đóng gửi lệnh lên `/commands`, cập nhật icon và trạng thái real-time từ `/devices`.
- Điều khiển giọng nói (Web Speech API, vi/eng) nhận lệnh mở/đóng, phản hồi thông báo.
- OTP UI: sinh mã 6 số, đếm ngược, lưu/xoá vào `/commands/otp` trên Firebase.
- Cài đặt WiFi UI: xem SSID/IP hiện tại từ `/devices/wifi`, quét mạng (mock), gửi thông tin kết nối mới lên `/commands`.
- Thông báo toast, hiệu ứng glassmorphism, dark/light theme (settings), đồng bộ trạng thái kết nối.
- Trang Settings: hiển thị user, đổi mật khẩu Firebase (reauth), logout; đồng bộ trạng thái thiết bị.
- Trang Admin/User demo: CRUD bảng tài khoản mock trên client, show/hide mật khẩu, đồng hồ header.

## Phần mềm đã có UI nhưng chưa gắn với phần cứng/firmware
- OTP: ESP32 firmware chưa đọc/thi hành `commands/otp` (chỉ nhận `action=open/close`), nên mã OTP chỉ tồn tại trên Firebase/UI.
- WiFi scan/change: UI gửi `scan_wifi`/`change_wifi` qua `/commands` và mock danh sách mạng; firmware hiện chỉ dùng WiFiManager cục bộ, chưa đọc/áp dụng lệnh này, cũng chưa trả danh sách mạng về `/devices/networks`.
- Trang Admin/User: dữ liệu mock tại client, chưa lưu Firebase hay áp dụng cho thiết bị.

## Chức năng dự kiến tương lai
- Mở rộng Dashboard đa thiết bị (cửa, đèn, điều hoà, cảm biến DHT11/DHT22), quick actions, lịch sử gần.
- Thêm thiết bị điều khiển: relay đèn/quạt, dimmer, LED RGB, IR điều hoà; cảm biến cửa (reed), chống phá; mở rộng GPIO qua PCF8574 nếu cần.
- Push notification/email cho cảnh báo (nhiều lần sai, alarm), chế độ khách/OTP dùng số lần giới hạn.
- Nâng cấp bảo mật: TLS cho cloud (MQTT/HTTPS), token HMAC, rules Firebase, hash mật khẩu/OTP thay vì lưu plain.
- Tự động hoá: kịch bản theo nhiệt độ/độ ẩm/thời gian; dashboard responsive mới theo tài liệu UI_FUTURE_PLAN.
