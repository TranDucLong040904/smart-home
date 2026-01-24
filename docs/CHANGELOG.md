# CHANGELOG - Smart Door Project

Tất cả thay đổi quan trọng của dự án sẽ được ghi lại ở đây.

---

## [v0.2.0] - 2026-01-24

### ✅ HOÀN THÀNH PHASE 1 - TASK 1

**Chức năng:**

- Đọc keypad 4x4 (16 phím)
- Hiển thị LCD 16x2
- Buzzer beep khi nhấn phím
- Servo mở/đóng cửa (180°)
- Nút trong nhà đóng cửa

**Thay đổi kỹ thuật:**

### Added

- ✅ Nút trong nhà (công tắc 4 chân) nối với D0
- ✅ Time-multiplexing D8 (Servo + Buzzer)
- ✅ Time-multiplexing D0 (Keypad Column 0 + Nút trong nhà)
- ✅ Edge detection cho nút trong nhà (HIGH → LOW)
- ✅ Bỏ auto-close 3 giây, cửa giữ nguyên sau khi mở
- ✅ Debug log Serial Monitor (500ms interval)

### Changed

- 🔄 Đổi nút trong nhà từ A0 → D0 (A0 bị lỗi phần cứng)
- 🔄 Servo chỉ attach khi cần, detach khi không dùng
- 🔄 Buzzer detach servo tạm thời khi beep (nếu cửa đang mở)
- 🔄 Góc servo: 0° (đóng) → 180° (mở)

### Fixed

- 🐛 LCD I2C xung đột với buzzer (đổi buzzer từ D2 → D8)
- 🐛 Buzzer kêu rè rè khi servo hoạt động (chấp nhận, chỉ 3 giây)
- 🐛 pinMode A0 bị set sai cho keypad (sửa thành D5)
- 🐛 Cửa tự đóng ngay sau khi mở (sửa logic edge detection)

### Technical Details

**GPIO Allocation:**

```
D0 (GPIO16): Keypad Col 0 + Nút trong nhà
D1 (GPIO5):  LCD SCL
D2 (GPIO4):  LCD SDA
D3 (GPIO0):  Keypad Col 1
D4 (GPIO2):  Keypad Col 2
D5 (GPIO14): Keypad Col 3
D6 (GPIO12): Keypad Row 0
D7 (GPIO13): Keypad Row 1
D8 (GPIO15): Servo + Buzzer (time-multiplexing)
TX (GPIO1):  Keypad Row 2 (rút khi nạp code)
RX (GPIO3):  Keypad Row 3 (rút khi nạp code)
A0:          KHÔNG DÙNG (bị lỗi)
```

**Nguồn điện:**

- ESP8266: USB 5V
- LCD: 3.3V từ ESP8266
- Servo: 5V nguồn ngoài (adapter ≥2A)
- Buzzer: 5V nguồn ngoài
- GND chung: Tất cả thiết bị

---

## [v0.1.0] - 2026-01-23

### Added

- 📄 Tài liệu dự án ban đầu
- 📄 `docs/hardware_wiring.md` - Hướng dẫn đấu dây
- 📄 `docs/wiring_guide.md` - Sơ đồ chân chi tiết
- 📄 `docs/testing_log.md` - Template test
- 📄 `PROJECT_STRUCTURE.md` - Cấu trúc dự án
- 📄 `plan.md` - Kế hoạch phát triển
- 📄 `docs/SRS_smart_door.md` - Yêu cầu phần mềm

### Technical Decisions

- Board: ESP8266 Wemos D1 Mini
- Keypad: 4x4 matrix (sơ đồ Gemini cũ, đã test OK)
- LCD: I2C 16x2 (địa chỉ 0x27)
- Servo: SG90 (0-180°)
- Buzzer: Module v1.2 (có transistor tích hợp)

---

## 🚀 NEXT STEPS (Phase 2)

### Planned Features

- [ ] WiFi provisioning (SmartConfig hoặc AP mode)
- [ ] Firebase integration
- [ ] State machine (verify PIN)
- [ ] EEPROM (lưu PIN, logs)
- [ ] OTP generation
- [ ] OTA update
- [ ] Web app điều khiển từ xa

### Hardware Expansion (Future)

- [ ] ESP32 cho Smart Light
- [ ] PCF8574 I2C Expander (thêm 8 GPIO)
- [ ] Cảm biến cửa (reed switch)
- [ ] LED status
- [ ] Nút bấm vật lý thêm

---

## 📝 NOTES

### Known Issues

- ⚠️ Buzzer rè nhẹ khi servo hoạt động (3 giây) - Chấp nhận được
- ⚠️ Khi nhấn nút trong nhà, có thể nhận nhầm phím 1, 4, 7, \* - Không ảnh hưởng
- ⚠️ A0 bị lỗi phần cứng - Không dùng được

### Lessons Learned

- ✅ Time-multiplexing hiệu quả cho GPIO hạn chế
- ✅ Edge detection quan trọng cho nút bấm
- ✅ Servo cần nguồn riêng để tránh sụt áp
- ✅ Buzzer module tốt hơn buzzer thường (có transistor)
- ✅ Serial debug log rất quan trọng cho troubleshooting

---

**Tác giả:** Trần Đức Long  
**Dự án:** Smart Door - Cửa thông minh  
**Repository:** TranDucLong040904/smart-door
