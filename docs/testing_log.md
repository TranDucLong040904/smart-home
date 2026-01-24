# Testing Log - Smart Door System

Ghi lại kết quả test sau mỗi lần code/thay đổi phần cứng.

Format: `## YYYY-MM-DD - Tên Test`

---

## 2026-01-24 - Thiết kế sơ đồ chân

### Mục tiêu

Xác định sơ đồ chân tối ưu cho toàn bộ dự án với linh kiện hiện có.

### Quyết định

- ✅ Chọn Phương án A: Giữ Serial Debug (TX/RX)
- ✅ Keypad: 8 GPIO (D5, D6, D7, D4, D0, D3, D8, A0)
- ✅ Servo: Time-multiplexing với GPIO14 (D5)
- ✅ Buzzer: Time-multiplexing với GPIO2 (D4)
- ✅ Nút trong nhà: Virtual button (phím B)

### Lưu ý

- ⚠️ Cần hàn pull-up 10kΩ cho GPIO0 (D3)
- ⚠️ Cần hàn pull-down 10kΩ cho GPIO15 (D8)
- ⚠️ A0 (ADC) dùng analog hack: đọc > 512 = HIGH

### Action Items

- [ ] Hàn resistor pull-up/pull-down
- [ ] Chuẩn bị tụ điện ≥470µF cho servo
- [ ] Test I2C Scanner để tìm địa chỉ LCD
- [ ] Test keypad riêng lẻ
- [ ] Test servo với nguồn riêng
- [ ] Test buzzer

---

## Template cho các test tiếp theo

```markdown
## YYYY-MM-DD - Tên Test

### Mục tiêu

Mô tả ngắn gọn mục đích của test.

### Setup

- Hardware: Linh kiện nào được test
- Software: Code/library nào được dùng
- Điều kiện: Nguồn, kết nối, v.v.

### Kết quả

- ✅ Pass: Tính năng hoạt động đúng
- ⚠️ Warning: Hoạt động nhưng có vấn đề nhỏ
- ❌ Fail: Không hoạt động

### Chi tiết

Mô tả chi tiết kết quả test, số liệu đo được, screenshot, v.v.

### Issues Found

- Issue 1: Mô tả vấn đề
- Issue 2: Mô tả vấn đề

### Action Items

- [ ] Việc cần làm 1
- [ ] Việc cần làm 2

### Notes

Ghi chú bổ sung, quan sát, ý tưởng cải tiến.
```

---

## Checklist Test cho Phase 1 (Firmware cục bộ)

### Hardware Test (Từng module riêng lẻ)

#### Test 1: I2C LCD

- [ ] Kết nối LCD I2C (SDA=D2, SCL=D1)
- [ ] Chạy I2C Scanner, tìm địa chỉ (0x27 hoặc 0x3F)
- [ ] Hiển thị text "Hello World"
- [ ] Điều chỉnh độ tương phản (biến trở xanh)
- [ ] Test backlight ON/OFF

#### Test 2: Keypad 4x4

- [ ] Kết nối keypad theo sơ đồ mới
- [ ] Hàn pull-up 10kΩ cho GPIO0 (D3)
- [ ] Hàn pull-down 10kΩ cho GPIO15 (D8)
- [ ] Test đọc từng phím 0-9, A-D, \*, #
- [ ] Test phím giữ (long press)
- [ ] Test A0 analog hack (Col 3)
- [ ] Kiểm tra debounce

#### Test 3: Servo Motor

- [ ] Kết nối servo với nguồn riêng 5V
- [ ] Thêm tụ điện ≥470µF
- [ ] Chung GND giữa ESP8266 và nguồn servo
- [ ] Test góc 0° (đóng cửa)
- [ ] Test góc 90° (mở cửa)
- [ ] Test góc 180° (mở tối đa)
- [ ] Kiểm tra sụt áp khi servo hoạt động
- [ ] Test time-multiplexing với keypad

#### Test 4: Buzzer

- [ ] Kết nối buzzer (+ = D4, - = GND)
- [ ] Test beep đơn (HIGH/LOW)
- [ ] Test beep 3 lần liên tiếp
- [ ] Test beep dài (lockout)
- [ ] Test tone() nếu dùng passive buzzer
- [ ] Test time-multiplexing với keypad

#### Test 5: Nút trong nhà (Virtual Button)

- [ ] Test phím B nhấn 1 lần (không làm gì)
- [ ] Test phím B giữ 2 giây (toggle cửa)
- [ ] Test logic: Đang đóng → Mở
- [ ] Test logic: Đang mở → Đóng ngay

---

### Software Test (State Machine)

#### Test 6: State Machine cơ bản

- [ ] Idle state: Hiển thị "Nhập mật khẩu"
- [ ] Input state: Hiển thị "**\*\***" khi nhập
- [ ] Verify state: Kiểm tra PIN đúng/sai
- [ ] Open state: Mở servo 3s, beep 1 lần
- [ ] Error state: Beep 3 lần, hiển thị "Sai MK"
- [ ] AutoClose: Đóng servo sau 3s

#### Test 7: Lockout

- [ ] Nhập sai 3 lần → Lockout
- [ ] Hiển thị "Khoá tạm thời"
- [ ] Beep dài khi lockout
- [ ] Không nhận input trong thời gian lockout
- [ ] Hết thời gian lockout → Reset về Idle

#### Test 8: Đổi PIN

- [ ] Nhấn phím C sau khi mở cửa thành công
- [ ] Nhập PIN mới (6 số)
- [ ] Nhập lại PIN mới (khớp)
- [ ] Kiểm tra độ mạnh (không lặp: 111111, 123456)
- [ ] Lưu PIN mới vào EEPROM
- [ ] Test mở cửa bằng PIN mới

#### Test 9: EEPROM

- [ ] Lưu PIN vào EEPROM
- [ ] Reset ESP8266
- [ ] Đọc PIN từ EEPROM
- [ ] Test PIN mặc định (123456) khi EEPROM trống

---

### Integration Test

#### Test 10: Tổng hợp

- [ ] Nhập PIN đúng → Mở cửa → Auto-close
- [ ] Nhập PIN sai 3 lần → Lockout → Hết hạn → Nhập lại
- [ ] Đổi PIN → Lưu EEPROM → Reset → Dùng PIN mới
- [ ] Phím B giữ 2s → Toggle cửa
- [ ] Servo hoạt động không ảnh hưởng keypad scan
- [ ] Buzzer beep không ảnh hưởng keypad scan

---

**Ghi chú:**

- Đánh dấu `[x]` khi test pass
- Ghi chi tiết kết quả vào các section phía trên
- Nếu fail, ghi rõ lý do và action items
