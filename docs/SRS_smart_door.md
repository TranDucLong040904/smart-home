# SRS – Hệ thống cửa thông minh (ESP8266 + keypad + LCD + servo)

## 1. Mục tiêu
- Mở cửa an toàn bằng mật khẩu/OTP, hỗ trợ đổi mật khẩu, chống dò mật khẩu, log sự kiện, điều khiển qua cloud.

## 2. Thiết bị (hardware)
- MCU chính: ESP8266 (NodeMCU/Wemos D1 mini).
- Arduino Uno: cấp nguồn riêng cho servo/LCD nếu cần dòng ổn, chung GND.
- Servo 5–6V (nguồn riêng + tụ >=470µF để giảm sụt áp).
- Keypad 4x4: layout {{1,2,3,A},{4,5,6,B},{7,8,9,C},{*,0,#,D}}; D=Enter, A=Delete, C=Đổi MK, B=Cancel/Lock (dự phòng).
- LCD 16x2 + I2C module (lưu ý mức logic 3.3V; cần level shifter nếu module chỉ 5V).
- Buzzer 2 chân.
- Nút bấm 4 chân trong nhà: debounce HW/SW, toggle mở/đóng (đang mở ấn để đóng khi vừa vào, đang đóng ấn để mở khi cần ra ngoài; có thể thoát báo động nếu dùng chế độ này).
- Tuỳ chọn: reed switch trạng thái cửa; LED trạng thái; cảm biến chống phá.

## 3. Chức năng bắt buộc (firmware)
- Nhập mật khẩu qua keypad, hiển thị "******".
- Trạng thái LCD: "Nhập mật khẩu", "Xin mời vào", "Mật khẩu sai", "Khoá tạm thời", "Nhập MK mới", "Nhập lại MK".
- Điều khiển servo: mặc định đóng; đúng MK/OTP thì mở 3s rồi tự động đóng; nút bấm 4 chân trong nhà debounce và toggle mở/đóng (đang mở ấn để đóng, đang đóng ấn để mở từ trong nhà).
- Âm thanh: 1 beep đúng/mở; 3 beep sai; beep dài khi bị khoá tạm.
- Giới hạn sai: mặc định 3 lần; vượt ngưỡng -> khoá tạm (thời gian cấu hình), không nhận MK trong thời gian khoá.
- Đổi mật khẩu: chỉ sau khi xác thực; nhập MK mới + nhập lại; kiểm tra độ mạnh (không lặp, không liên tiếp).
- OTP khách vãng lai: lưu mã + thời gian hết hạn; kiểm tra hạn bằng NTP; có thể thu hồi sớm từ cloud.
- Lưu trữ MK/OTP cấu hình trong EEPROM (flash ESP8266); nếu EEPROM trống -> khởi tạo MK mặc định.
- Log sự kiện cục bộ (RAM/EEPROM tạm): mở cửa thành công, sai MK, khoá tạm, đổi MK, dùng OTP, nút trong nhà (method=button, action=open/close).
- Buffer log để gửi lên cloud khi online lại.
- State machine rõ ràng: Idle -> Input -> Verify -> (Open | Error) -> AutoClose; ChangePIN (step 1/2); Lockout.
- Watchdog + reconnect Wi-Fi; OTA firmware.

## 4. Cloud/Web/Backend
- Giao tiếp: MQTT (TLS) hoặc REST/Firebase (Realtime DB/Firestore).
- Xác thực: Firebase Auth hoặc token HMAC; rate-limit lệnh điều khiển.
- Chức năng: sinh/thu hồi OTP, xem log, gửi lệnh mở/lock, cấu hình tham số (số lần sai, thời gian khoá, thời gian mở servo, tone beep).
- Đồng bộ thời gian: NTP để kiểm tra hạn OTP và ghi log đúng giờ.
- UI: web/app hiển thị OTP, log, trạng thái cửa, nút bật/tắt báo động.

## 5. Bảo mật
- Lưu mật khẩu/OTP dạng mã hoá hoặc hash (tùy hạn chế bộ nhớ: có thể lưu hash PIN + salt nhỏ).
- Giao tiếp cloud bắt buộc TLS; không để API key trong firmware build prod (dùng biến môi trường/flash config riêng).
- Hạn chế số lần sai; bộ đếm sai reset sau khi mở đúng.
- Tuỳ chọn: mã khách tạm thời có độ dài >=6 số, thời gian sống ngắn.

## 6. Ghi log
- Trường log: ts (epoch), type (success/fail/lock/change/otp/local-button), method (pin/otp/button/cloud), result, note (ví dụ: "wrong_pin" hoặc "otp_expired").
- Gửi log lên cloud theo lô batch, retry khi mất mạng.

## 7. Cấu hình & tham số
- PIN mặc định (nếu EEPROM trống): 123456 (có thể đổi).
- Số lần sai tối đa: 3 (cấu hình được qua cloud/local).
- Thời gian khoá: 30–300s (cấu hình được).
- Thời gian mở servo: 3s (cấu hình được).
- Thời gian hết hạn OTP: mặc định 15 phút (cấu hình được).

## 8. Deploy
- Flash USB lần đầu; nhập Wi-Fi + endpoint qua serial hoặc file config; bật OTA cho các lần sau.
- Firebase: tạo project, bật Auth, thiết lập rules chỉ user auth mới được ghi lệnh; tách dev/prod.
- MQTT: dùng broker TLS, user/pass riêng; topic riêng cho từng thiết bị; rate-limit lệnh mở khoá.

## 9. Test
- Case đúng/sai MK; vượt ngưỡng sai -> khoá; hết thời gian khoá -> nhập lại được.
- Đổi MK: step1/step2 khớp/không khớp; check mẫu lặp/liên tiếp.
- OTP: đúng/hết hạn/thu hồi; nhiều OTP, chỉ OTP hợp lệ được chấp nhận; mất mạng -> xử lý cache.
- Servo: mở 3s tự động đóng; nút trong nhà debounce và toggle mở/đóng, ưu tiên khi đang thao tác.
- Log: sinh đúng sự kiện; đẩy lên cloud khi có mạng; check time stamp NTP.
- Wi-Fi mất/hồi; OTA thành công/thất bại.

## 10. Mở rộng tương lai
- Thêm reed switch để biết trạng thái cửa thật; thêm cảm biến chống phá và thông báo.
- Push notification/email khi có alarm hoặc nhiều lần sai.
- Mode khách: tự động vô hiệu OTP sau số lần dùng nhất định.
