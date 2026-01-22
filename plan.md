# Kế hoạch dự án cửa thông minh

## 0. Chuẩn bị
- Cố định sơ đồ chân ESP8266 (keypad, LCD I2C, servo, buzzer, nút trong nhà bằng nút bấm 4 chân).
- Chọn thư viện: Keypad, LiquidCrystal_I2C, Servo, EEPROM, WiFi, WiFiManager (provisioning), NTP, ArduinoOTA, MQTT/Firebase (tùy chọn backend cloud).
- Xác định format PIN/OTP, cấu trúc log, topic/API cloud.

## 1. Phần cứng + Firmware cục bộ (Ưu tiên làm trước)
- Kiểm tra từng phần: keypad đọc phím, LCD hiển thị, servo đóng/mở với nguồn riêng + tụ, buzzer beep.
- Implement state machine cơ bản: Idle -> Nhập PIN -> Verify -> (Mở/ Sai) -> Auto-close; Lockout khi sai quá số lần; nút bấm 4 chân trong nhà debounce và toggle mở/đóng (đang mở ấn để đóng, đang đóng ấn để mở từ trong nhà).
- Đổi PIN tại chỗ: sau khi mở thành công, cho phép nhập PIN mới + nhập lại, kiểm tra mạnh (không lặp, không liên tiếp), lưu EEPROM.
- Lưu/đọc PIN/ cấu hình trong EEPROM (flash); khởi tạo PIN mặc định nếu trống.
- OTP local (tùy chọn bước đầu): nhận OTP qua serial để test luồng, kiểm tra hạn (dùng NTP nếu đã có Wi-Fi, nếu chưa thì giả định còn hạn trong phiên).
- Âm báo: 1 beep đúng, 3 beep sai, beep dài khi lockout.
- Auto-close: mở 3s rồi đóng; ưu tiên nút trong nhà.

## 2. Kết nối mạng & Cloud (Firebase)
- Provisioning Wi-Fi không hardcode: WiFiManager (AP + captive portal) lưu SSID/password vào flash.
- NTP: đồng bộ thời gian cho log và kiểm tra hạn OTP.
- OTA: bật ArduinoOTA để cập nhật firmware qua Wi-Fi.
- Cloud: Firebase (Auth + Realtime DB hoặc Firestore). Thiết kế cấu trúc DB: /devices/{id}/state, /logs, /otp, /config.
- Đồng bộ: nhận lệnh mở khoá/thu hồi OTP/cập nhật tham số; đẩy log sự kiện theo lô khi online.
- Cache log/OTP khi mất mạng, gửi lại khi kết nối.

## 3. Frontend (web điều khiển)
- Mock API Firebase để dựng UI: dashboard trạng thái cửa, log, tạo/thu hồi OTP, cấu hình tham số (số lần sai, thời gian khoá, thời gian mở servo), bật/tắt báo động.
- Responsive cho laptop/mobile/tablet.
- Tích hợp thật với Firebase sau khi firmware đẩy/nhận đúng schema.
- Quản lý môi trường: .env.example cho endpoint, api key; tách dev/prod.

## 4. Hoàn thiện & Deploy
- Kiểm thử: case đúng/sai PIN, lockout, đổi PIN, auto-close, nút trong nhà (ấn đóng khi vừa vào, ấn mở khi muốn ra), beep; OTP đúng/hết hạn/thu hồi; mất/khôi phục Wi-Fi; OTA; log đẩy lên cloud.
- Bảo mật: bắt buộc TLS, rate-limit lệnh mở khoá, hash PIN/OTP nếu đủ tài nguyên, không commit khóa bí mật.
- Đóng gói: hướng dẫn flash lần đầu, hướng dẫn vào portal để nhập Wi-Fi/endpoint, quy trình OTA.
- Theo dõi: thêm push/email cho alarm hoặc nhiều lần sai (tùy chọn phase sau).

## 5. Lộ trình ưu tiên (ngắn gọn)
1) Hoàn thiện firmware cục bộ + phần cứng (không mạng) đến mức ổn định.
2) Thêm provisioning Wi-Fi + NTP + OTA.
3) Kết nối cloud (Firebase/MQTT), thống nhất schema/topic.
4) Dựng frontend mock -> tích hợp thật.
5) Kiểm thử tổng thể -> tài liệu deploy.
