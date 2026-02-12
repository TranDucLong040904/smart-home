# SƠ ĐỒ CHÂN KẾT NỐI - SMART DOOR FINAL

**Board:** ESP8266 Wemos D1 Mini  
**Ngày cập nhật:** 2026-01-24  
**Trạng thái:** ✅ ĐÃ TEST HOẠT ĐỘNG - PHIÊN BẢN CUỐI CÙNG

---

## 📌 BẢNG CHÂN KẾT NỐI

| Linh kiện         | Chân linh kiện | ESP8266 Pin | GPIO   | Ghi chú                          |
| ----------------- | -------------- | ----------- | ------ | -------------------------------- |
| **LCD I2C**       | SDA            | D2          | GPIO4  | I2C Data                         |
| **LCD I2C**       | SCL            | D1          | GPIO5  | I2C Clock                        |
| **LCD I2C**       | VCC            | 3.3V        | -      | Nguồn                            |
| **LCD I2C**       | GND            | GND         | -      | Ground                           |
| **Keypad**        | L1 (Row 0)     | D6          | GPIO12 | Output                           |
| **Keypad**        | L2 (Row 1)     | D7          | GPIO13 | Output                           |
| **Keypad**        | L3 (Row 2)     | TX          | GPIO1  | Output (RÚT KHI NẠP CODE!)       |
| **Keypad**        | L4 (Row 3)     | RX          | GPIO3  | Output (RÚT KHI NẠP CODE!)       |
| **Keypad**        | R1 (Col 0)     | D0          | GPIO16 | Input (DÙNG CHUNG NÚT TRONG NHÀ) |
| **Keypad**        | R2 (Col 1)     | D3          | GPIO0  | Input                            |
| **Keypad**        | R3 (Col 2)     | D4          | GPIO2  | Input                            |
| **Keypad**        | R4 (Col 3)     | D5          | GPIO14 | Input                            |
| **Servo**         | Signal (Cam)   | D8          | GPIO15 | PWM (DÙNG CHUNG BUZZER)          |
| **Servo**         | VCC (Đỏ)       | 5V          | -      | Nguồn ngoài                      |
| **Servo**         | GND (Nâu)      | GND         | -      | Ground chung                     |
| **Buzzer Module** | I/O            | D8          | GPIO15 | Signal (DÙNG CHUNG SERVO)        |
| **Buzzer Module** | VCC            | 5V          | -      | Nguồn ngoài                      |
| **Buzzer Module** | GND            | GND         | -      | Ground chung                     |
| **Nút trong nhà** | Chân 1         | D0          | GPIO16 | DÙNG CHUNG KEYPAD COL 0          |
| **Nút trong nhà** | Chân 2         | GND         | -      | Ground                           |

---

## ⚠️ QUAN TRỌNG

### **1. Khi nạp code (Upload):**

- ✅ **RÚT DÂY:** Keypad L3 (TX) và L4 (RX)
- ✅ **Upload code**
- ✅ **CẮM LẠI:** TX và RX
- ✅ **Nhấn RESET** trên ESP8266

### **2. Nguồn điện:**

- **ESP8266:** USB 5V
- **LCD:** 3.3V từ ESP8266
- **Servo:** 5V từ nguồn ngoài (adapter ≥2A hoặc Arduino)
- **Buzzer:** 5V từ nguồn ngoài
- **⚠️ GND CHUNG:** Tất cả GND phải nối với nhau!

### **3. Chân dùng chung (Time-Multiplexing):**

- **D8:** Servo + Buzzer
  - Servo attach khi cần mở/đóng cửa
  - Servo detach khi không dùng → Buzzer hoạt động
  - ⚠️ Buzzer có thể rè nhẹ khi servo hoạt động (~3 giây)
  - ⚠️ Servo có thể giật nhẹ khi buzzer beep
  - ✅ Chấp nhận được cho dự án gia đình
- **D0:** Keypad Column 0 + Nút trong nhà
  - Khi nhấn nút đóng cửa, có thể nhận nhầm phím 1, 4, 7, \* (không ảnh hưởng)

---

## 🔌 SƠ ĐỒ ĐẤU NỐI CHI TIẾT

### **LCD I2C (16x2)**

```
LCD Module → ESP8266
├─ GND → GND
├─ VCC → 3.3V
├─ SDA → D2 (GPIO4)
└─ SCL → D1 (GPIO5)

Địa chỉ I2C: 0x27
```

### **Keypad 4x4**

```
Keypad → ESP8266
Rows (Output):
├─ L1 → D6 (GPIO12)
├─ L2 → D7 (GPIO13)
├─ L3 → TX (GPIO1)  ⚠️ RÚT KHI NẠP CODE
└─ L4 → RX (GPIO3)  ⚠️ RÚT KHI NẠP CODE

Columns (Input):
├─ R1 → D0 (GPIO16) - DÙNG CHUNG NÚT TRONG NHÀ
├─ R2 → D3 (GPIO0)
├─ R3 → D4 (GPIO2)
└─ R4 → D5 (GPIO14)
```

### **Servo SG90**

```
Servo → Nguồn/ESP8266
├─ Signal (Cam) → D8 (ESP8266) - DÙNG CHUNG BUZZER
├─ VCC (Đỏ) → 5V (nguồn ngoài)
└─ GND (Nâu) → GND chung
```

### **Buzzer Module v1.2**

```
Buzzer Module → Nguồn/ESP8266
├─ I/O → D8 (ESP8266) - DÙNG CHUNG SERVO
├─ VCC → 5V (nguồn ngoài)
├─ GND → GND chung
└─ NC → Không nối
```

### **Nút trong nhà (Công tắc 4 chân)**

```
Nút → ESP8266
├─ Chân 1 → D0 (GPIO16)
└─ Chân 2 → GND

Chỉ dùng 2 chân!
```

---

## 🎮 CHỨC NĂNG KEYPAD

```
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ A │  A = Xóa (Delete)
├───┼───┼───┼───┤
│ 4 │ 5 │ 6 │ B │  B = (không dùng)
├───┼───┼───┼───┤
│ 7 │ 8 │ 9 │ C │  C = Đổi mật khẩu
├───┼───┼───┼───┤
│ * │ 0 │ # │ D │  D = OK/Enter (Mở cửa)
└───┴───┴───┴───┘
```

---

## 🚀 CÁCH HOẠT ĐỘNG

### **Mở cửa:**

1. Nhập mật khẩu (mặc định: `123456`)
2. Nhấn phím **D** (Enter)
3. Nếu đúng:
   - Buzzer kêu giai điệu thành công
   - Servo quay 180° (mở cửa)
   - LCD hiển thị "Da mo khoa" + "C: Doi MK"
   - Cửa **GIỮ NGUYÊN** (không tự đóng)

### **Đóng cửa:**

1. Nhấn **nút trong nhà** (công tắc 4 chân: D0 → GND)
2. Servo quay 0° (đóng cửa)
3. Buzzer beep ngắn
4. LCD hiển thị "Nhap mat khau:"

### **Đổi mật khẩu:**

1. Nhập mật khẩu cũ → Nhấn D
2. Nhấn **C** (Đổi MK)
3. Nhập mật khẩu mới (≥6 ký tự)
4. Nhấn **D**
5. Nhập lại mật khẩu mới
6. Nhấn **D** → Lưu vào EEPROM

### **Bảo mật:**

- **Lockout:** 3 lần sai → Khóa 10s (siren báo động)
- **Password rules:**
  - ≥6 ký tự
  - Không phải ngày sinh (ddmmyyyy)
  - Không giống nhau (111111)
  - Không tăng/giảm dần (123456, 654321)

---

## 📝 QUY TẮC MẬT KHẨU

| Quy tắc                  | Mô tả                   | Ví dụ bị chặn         |
| ------------------------ | ----------------------- | --------------------- |
| **Min 6 ký tự**          | Độ dài tối thiểu        | `12345` ❌            |
| **Không phải ngày sinh** | ddmmyyyy hoặc ddmmyy    | `010199` ❌           |
| **Không giống nhau**     | Tất cả ký tự giống nhau | `111111` ❌           |
| **Không tăng/giảm**      | Chuỗi liên tục          | `123456`, `654321` ❌ |

**Ví dụ mật khẩu tốt:** `192837`, `135792`, `246810`

---

## 🎵 ÂM THANH

| Tình huống              | Âm thanh           | Mô tả         |
| ----------------------- | ------------------ | ------------- |
| Nhấn phím               | Beep ngắn (30ms)   | Phản hồi      |
| Mở khóa thành công      | Beep dài (300ms)   | Thành công    |
| Sai mật khẩu            | 3 beep ngắn        | Cảnh báo      |
| **Bị khóa (3 lần sai)** | **Beep 2 lần dài** | **Báo động!** |
| Đổi MK thành công       | 2 beep             | Hoàn thành    |

---

## 📝 TROUBLESHOOTING

### **LCD không hiển thị:**

- Kiểm tra địa chỉ I2C (0x27 hoặc 0x3F)
- Kiểm tra kết nối SDA, SCL
- Điều chỉnh biến trở trên LCD (độ tương phản)

### **Keypad không hoạt động:**

- Kiểm tra kết nối 8 dây (4 rows + 4 columns)
- Nhớ rút TX/RX khi nạp code, cắm lại sau đó

### **Servo không quay:**

- Kiểm tra nguồn 5V riêng
- Kiểm tra GND chung
- Kiểm tra dây signal (D8)

### **Buzzer rè rè:**

- Bình thường khi servo đang hoạt động (~3 giây mở cửa)
- Nếu kêu liên tục → Kiểm tra code hoặc đấu dây

### **Nút trong nhà không hoạt động:**

- Kiểm tra nối D0 → GND
- Chỉ hoạt động khi cửa đang MỞ
- Thử chập dây D0 → GND bằng tay

### **Servo giật khi buzzer beep:**

- Bình thường (dùng chung D8)
- Chấp nhận được

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] LCD hiển thị
- [x] Keypad đọc 16 phím
- [x] Buzzer beep khi nhấn phím
- [x] Servo mở/đóng cửa (0° ↔ 180°)
- [x] Nút trong nhà đóng cửa
- [x] Time-multiplexing D8 (Servo + Buzzer)
- [x] Time-multiplexing D0 (Keypad + Nút)
- [x] EEPROM lưu mật khẩu
- [x] State machine (4 trạng thái)
- [x] Lockout (3 lần sai → khóa 10s)
- [x] Password rules (≥6, không sinh nhật, không giống nhau, không tăng/giảm)
- [x] Auth timeout (5s không dùng → logout)

---

## 🎯 TÍNH NĂNG ĐẦY ĐỦ

### **Đã hoàn thành:**

1. ✅ Nhập mật khẩu từ keypad
2. ✅ Hiển thị LCD 16x2
3. ✅ Mở/đóng cửa bằng servo
4. ✅ Buzzer phản hồi
5. ✅ Nút trong nhà đóng cửa
6. ✅ Đổi mật khẩu
7. ✅ Lưu mật khẩu vào EEPROM
8. ✅ Lockout sau 3 lần sai
9. ✅ Password rules (bảo mật cao)
10. ✅ Auth timeout

### **Chưa làm (Phase 2):**

- [ ] WiFi + Firebase
- [ ] OTP (mật khẩu tạm thời)
- [ ] Web app điều khiển từ xa
- [ ] OTA update
- [ ] Log ra/vào

---

**Phase 1 - HOÀN THÀNH!** 🎉  
**Ngày:** 2026-01-24  
**Tác giả:** Trần Đức Long
