# Smart Door - Tính năng

## Phạm vi
- Tổng hợp tính năng hệ thống.
- Hiện tại: hoàn tất phần cứng/firmware cơ bản.
- Sẽ bổ sung frontend/web sau khi hoàn thành.

## Firmware / Phần cứng (đã xong)
- [*] Nhập PIN keypad 4x4; lockout 3 lần sai (10s) + đếm ngược LCD + siren.
- [*] EEPROM lưu/nạp PIN; khởi tạo mặc định 123456 nếu chưa có.
- [*] Quy tắc PIN: >=6 ký tự, chặn ngày sinh (ddMM, ddMMyy), chặn lặp, chặn tăng/giảm.
- [*] Đổi PIN: yêu cầu xác thực, nhập mới + nhập lại, kiểm tra độ mạnh, lưu EEPROM.
- [*] LCD 16x2 I2C hiển thị trạng thái (nhập MK, mở khóa, lockout, đổi MK...).
- [*] Buzzer: beep phím, beep sai (3 beep), siren lockout, nhạc mở, nhạc đổi MK thành công.
- [*] Servo: mở/đóng, giữ trạng thái mở; detach/attach để giảm nhiễu khi dùng buzzer.
- [*] Nút trong nhà: toggle mở/đóng; bị bỏ qua khi lockout.
- [*] Keypad D: cửa đang mở -> đóng ngay không cần PIN; cửa đóng -> Enter để xác thực PIN.
- [*] Timeout phiên đã mở (5s), reset về màn hình nhập sau khi đóng.

## Frontend / Web (kế hoạch)
- Dashboard trạng thái, log sự kiện, tạo/thu hồi OTP, cấu hình, mở từ xa.
- Kết nối cloud (Firebase/MQTT), NTP, OTA sẽ cập nhật khi làm xong.

## Lịch sử cập nhật
- 2026-01-25: Tạo FEATURES.md; thêm nút trong nhà toggle, D đóng khi cửa đang mở.
