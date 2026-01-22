# Checklist tiến độ

Trạng thái: todo / doing / done

## Firmware (backend ESP8266)
- [ ] Đọc keypad, hiển thị LCD, beep buzzer, điều khiển servo
- [ ] State machine: Idle → Verify → Open/Error → Auto-close; lockout khi sai quá số lần
- [ ] Đổi PIN (kiểm tra mạnh, lưu EEPROM); khởi tạo PIN mặc định nếu trống
- [ ] Lưu/đọc EEPROM, hạn chế sai, âm báo các trường hợp
- [ ] Provisioning Wi-Fi (WiFiManager), NTP đồng bộ thời gian
- [ ] OTA firmware
- [ ] Kênh cloud (Firebase/MQTT), nhận lệnh mở/OTP, đẩy log theo lô
- [ ] Buffer log/OTP khi mất mạng, gửi lại khi online

## Frontend (web)
- [ ] Mock API để dựng UI dashboard, log, tạo/thu hồi OTP, cấu hình tham số
- [ ] Responsive cho laptop/mobile/tablet
- [ ] Tích hợp thật với Firebase/MQTT
- [ ] Quản lý môi trường .env (dev/prod)

## Cloud/Deploy
- [ ] Thiết kế schema DB/topic (state, log, otp, config)
- [ ] Thiết lập Firebase/MQTT broker (TLS), auth/rate-limit
- [ ] Hướng dẫn flash lần đầu + nhập Wi-Fi/endpoint; quy trình OTA
- [ ] Kiểm thử tổng thể (PIN/OTP, lockout, auto-close, mất mạng, OTA, log)

## Tài liệu/bổ sung
- [ ] Sơ đồ chân nối (ESP8266 với keypad/LCD/servo/buzzer)
- [ ] README bổ sung hướng dẫn build/run
- [ ] Ghi chú linh kiện, nguồn, lưu ý an toàn