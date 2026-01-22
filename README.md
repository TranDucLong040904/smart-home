# Cửa thông minh – hướng dẫn nhanh

## Mục tiêu
- Hệ thống khóa cửa thông minh: PIN/OTP, đổi mật khẩu, chống dò, log sự kiện, điều khiển qua cloud (Firebase hoặc MQTT), OTA.

## Cấu trúc thư mục
- backend/: mã C++ cho ESP8266 (Arduino IDE) – sẽ chứa firmware.
- frontend/: web UI điều khiển (sẽ xây sau).
- docs/: tài liệu ([SRS_smart_door.md](docs/SRS_smart_door.md), checklist).
- plan.md: kế hoạch tổng quan.

## Thiết lập nhanh (firmware)
- Công cụ: Arduino IDE (hoặc PlatformIO), board ESP8266 đã cài trong Boards Manager.
- Thư viện cần cài (dự kiến): Keypad, LiquidCrystal_I2C, Servo, EEPROM, WiFi, WiFiManager (provisioning), NTP (time), ArduinoOTA, MQTT/Firebase client.
- Nguồn: servo cấp riêng 5–6V, chung GND với ESP8266; thêm tụ >=470µF để chống sụt áp.
- Keypad layout 4x4: { {1,2,3,A}, {4,5,6,B}, {7,8,9,C}, {*,0,#,D} }; D=Enter, A=Delete, C=Đổi MK, B=Cancel/Lock.

## Tài liệu liên quan
- Yêu cầu chi tiết: docs/SRS_smart_door.md
- Kế hoạch thực hiện: plan.md
- Checklist tiến độ: docs/checklist.md

## Handover cho coder khác
- Đọc SRS và plan để nắm yêu cầu và lộ trình.
- Xem checklist để biết trạng thái việc đã làm/chưa làm.
- Khi bắt đầu code firmware: chuẩn bị thư viện trên, giữ cấu hình Wi-Fi/cloud ngoài mã (provisioning, file config).