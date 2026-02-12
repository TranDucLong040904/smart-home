# Hướng dẫn nạp code - Smart Door Phase 1

## 📋 Mô tả chức năng

### **Code này làm gì?**

Firmware test cơ bản cho Phase 1 - Task 1:

1. **Đọc phím từ Keypad 4x4:**
   - Nhấn phím 0-9, \*, # → Hiển thị lên LCD
   - Nhấn phím A (Delete) → Xóa buffer
   - Nhấn phím D (Enter) → Mở cửa 3 giây rồi tự động đóng
   - Giữ phím B 2 giây → Toggle cửa (mở ↔ đóng)

2. **Hiển thị lên LCD 16x2:**
   - Dòng 1: "Nhan phim:"
   - Dòng 2: Các phím đã nhấn (tối đa 16 ký tự)

3. **Beep Buzzer:**
   - Beep ngắn (100ms) khi nhấn phím
   - Beep dài (500ms) khi mở cửa

4. **Điều khiển Servo:**
   - Mở cửa: 90 độ
   - Đóng cửa: 0 độ
   - Auto-close: Mở 3 giây rồi tự động đóng

5. **Nút trong nhà (Phím B):**
   - Giữ phím B 2 giây → Toggle cửa
   - Đang đóng → Mở
   - Đang mở → Đóng ngay

---

## 🔧 Chuẩn bị

### **1. Cài đặt Arduino IDE**

- Tải Arduino IDE 1.8.x hoặc 2.x từ: https://www.arduino.cc/en/software
- Cài đặt và mở Arduino IDE

### **2. Cài đặt Board ESP8266**

1. Mở Arduino IDE
2. File → Preferences
3. Thêm URL vào "Additional Boards Manager URLs":
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Tools → Board → Boards Manager
5. Tìm "esp8266" → Cài đặt "esp8266 by ESP8266 Community"

### **3. Cài đặt thư viện**

Vào: **Sketch → Include Library → Manage Libraries**

Tìm và cài đặt các thư viện sau:

| Thư viện              | Tác giả                        | Version |
| --------------------- | ------------------------------ | ------- |
| **Keypad**            | Mark Stanley, Alexander Brevig | Latest  |
| **LiquidCrystal I2C** | Frank de Brabander             | Latest  |
| **Servo**             | (Built-in)                     | -       |

**Lưu ý:**

- `Wire` và `Servo` là thư viện built-in, không cần cài
- Nếu không tìm thấy "LiquidCrystal I2C", tìm "LiquidCrystal_I2C" (có dấu gạch dưới)

---

## 📂 Cấu trúc file

```
backend/
├── smart_door_firmware.ino  ← File chính (mở file này)
└── config.h                 ← File cấu hình (tự động load)
```

**Lưu ý:** Arduino IDE yêu cầu file `.ino` phải nằm trong thư mục cùng tên. Nếu bạn mở `smart_door_firmware.ino` từ thư mục `backend/`, Arduino IDE sẽ tự động tạo thư mục `backend/smart_door_firmware/` và copy file vào đó.

---

## 🚀 Hướng dẫn nạp code

### **Bước 1: Mở code trong Arduino IDE**

**Cách 1: Mở trực tiếp**

1. Mở Arduino IDE
2. File → Open
3. Chọn file: `backend/smart_door_firmware.ino`
4. Arduino IDE sẽ hỏi "The file ... needs to be inside a sketch folder..." → Click **OK**
5. Arduino IDE sẽ tự động tạo thư mục và copy file

**Cách 2: Copy thủ công**

1. Tạo thư mục: `backend/smart_door_firmware/`
2. Copy 2 file vào:
   - `smart_door_firmware.ino`
   - `config.h`
3. Mở file `smart_door_firmware.ino` bằng Arduino IDE

---

### **Bước 2: Cấu hình Board**

1. **Chọn Board:**
   - Tools → Board → ESP8266 Boards → **LOLIN(WEMOS) D1 R2 & mini**

2. **Chọn Port:**
   - Cắm USB vào ESP8266
   - Tools → Port → Chọn COM port (ví dụ: COM3, COM4)
   - Nếu không thấy port → Cài driver CH340/CP2102

3. **Cấu hình khác:**
   - Upload Speed: **115200**
   - CPU Frequency: **80 MHz**
   - Flash Size: **4MB (FS:2MB OTA:~1019KB)**

---

### **Bước 3: Kiểm tra địa chỉ I2C LCD**

**Quan trọng:** LCD I2C có thể có địa chỉ **0x27** hoặc **0x3F**

**Cách kiểm tra:**

1. Mở Serial Monitor: Tools → Serial Monitor
2. Set baud rate: **115200**
3. Nạp code (Bước 4)
4. Xem Serial Monitor:
   - Nếu LCD sáng và hiển thị text → Địa chỉ đúng (0x27)
   - Nếu LCD sáng nhưng KHÔNG hiển thị text → Địa chỉ sai

**Nếu địa chỉ sai:**

1. Mở file `config.h`
2. Tìm dòng: `#define LCD_ADDRESS 0x27`
3. Đổi thành: `#define LCD_ADDRESS 0x3F`
4. Save và nạp lại code

---

### **Bước 4: Nạp code**

1. Click nút **Upload** (mũi tên →) hoặc nhấn **Ctrl+U**
2. Chờ compile và upload (khoảng 30-60 giây)
3. Xem output:
   ```
   Compiling...
   Uploading...
   Hard resetting via RTS pin...
   ```
4. Nếu thành công → ESP8266 sẽ tự động reset và chạy code

**Nếu lỗi upload:**

- Kiểm tra Port đã chọn đúng chưa
- Thử nhấn nút RESET trên ESP8266 trước khi upload
- Thử giảm Upload Speed xuống 9600

---

## 🧪 Test chức năng

### **Test 1: LCD hiển thị**

```
Khi bật nguồn:
  Dòng 1: "Smart Door v1.0"
  Dòng 2: "Initializing..."

Sau 2 giây:
  Dòng 1: "Nhan phim:"
  Dòng 2: ""
```

**Nếu LCD không hiển thị:**

- Xoay biến trở xanh trên module I2C để điều chỉnh độ tương phản
- Kiểm tra địa chỉ I2C (0x27 hoặc 0x3F)

---

### **Test 2: Keypad**

```
Nhấn phím 1:
  → LCD dòng 2 hiển thị: "1"
  → Buzzer beep ngắn
  → Serial Monitor: "Key pressed: 1"

Nhấn phím 2, 3, 4:
  → LCD dòng 2 hiển thị: "1234"
  → Mỗi lần nhấn, buzzer beep

Nhấn phím A (Delete):
  → LCD dòng 2 xóa trắng
  → Buzzer beep
```

---

### **Test 3: Servo mở cửa**

```
Nhấn phím D (Enter):
  → LCD hiển thị: "Mo cua..."
  → Buzzer beep dài
  → Servo quay 90 độ (mở cửa)
  → LCD hiển thị: "Dong sau: 3s"
  → Countdown 3 → 2 → 1
  → Servo quay về 0 độ (đóng cửa)
  → LCD quay về: "Nhan phim:"
```

**Nếu servo không quay:**

- Kiểm tra nguồn servo (5V + tụ 470µF)
- Kiểm tra dây Signal nối đúng D5 chưa

---

### **Test 4: Nút trong nhà (Phím B)**

```
Giữ phím B 2 giây:
  → LCD hiển thị: "Mo cua..."
  → Servo quay 90 độ (mở cửa)
  → Buzzer beep dài
  → Cửa MỞ và GIỮ NGUYÊN (không tự đóng)

Giữ phím B 2 giây lần nữa:
  → LCD hiển thị: "Dong cua..."
  → Servo quay về 0 độ (đóng cửa)
  → Buzzer beep ngắn
```

---

## 🐛 Troubleshooting

### **Vấn đề 1: Compile error - "Keypad.h not found"**

**Giải pháp:** Cài thư viện Keypad (Sketch → Include Library → Manage Libraries)

---

### **Vấn đề 2: LCD sáng nhưng không hiển thị text**

**Nguyên nhân:** Địa chỉ I2C sai

**Giải pháp:**

1. Mở `config.h`
2. Đổi `#define LCD_ADDRESS 0x27` thành `0x3F`
3. Nạp lại code

---

### **Vấn đề 3: Keypad không đọc được phím**

**Nguyên nhân:**

- Thiếu resistor pull-up/pull-down
- A0 analog không hoạt động

**Giải pháp:**

1. Kiểm tra resistor 10kΩ trên D3 (pull-up) và D8 (pull-down)
2. Mở Serial Monitor, xem có log "Key pressed" không
3. Nếu chỉ thiếu 1 cột → Kiểm tra dây cột đó

---

### **Vấn đề 4: Servo rung hoặc reset ESP8266**

**Nguyên nhân:** Sụt áp

**Giải pháp:**

1. Thêm tụ điện ≥470µF song song với servo
2. Dùng nguồn riêng cho servo (Pin 6V)
3. Dùng adapter USB mạnh hơn (≥2A)

---

### **Vấn đề 5: ESP8266 không boot (LED nhấp nháy)**

**Nguyên nhân:** GPIO0 hoặc GPIO15 không đúng trạng thái

**Giải pháp:**

1. Kiểm tra resistor pull-up trên D3 (GPIO0)
2. Kiểm tra resistor pull-down trên D8 (GPIO15)
3. Tạm rút dây keypad R2 (D3) và R3 (D8), boot lại

---

## 📊 Serial Monitor Output

Khi code chạy đúng, Serial Monitor sẽ hiển thị:

```
=== SMART DOOR - Phase 1 Task 1 ===
Board: ESP8266 Wemos D1 Mini
LCD initialized
Buzzer initialized
Servo initialized (door closed)
Setup complete!
Waiting for key press...

Key pressed: 1
Input buffer: 1
Key pressed: 2
Input buffer: 12
Key pressed: D
Action: Open door
Door opened
Door closed

Key pressed: B
Button B held for 2s - Toggle door
Door opened (toggle)
```

---

## ✅ Checklist hoàn thành

Sau khi nạp code và test, bạn phải có:

- [ ] LCD hiển thị "Smart Door v1.0" khi bật nguồn
- [ ] LCD hiển thị "Nhan phim:" sau 2 giây
- [ ] Nhấn phím 0-9 → Hiển thị lên LCD
- [ ] Nhấn phím A → Xóa buffer
- [ ] Nhấn phím D → Servo mở 3s rồi tự động đóng
- [ ] Giữ phím B 2s → Toggle cửa (mở ↔ đóng)
- [ ] Buzzer beep khi nhấn phím
- [ ] Serial Monitor hiển thị log đúng

**Nếu tất cả OK → Hoàn thành Phase 1 Task 1!** 🎉

---

## 📝 Ghi chú

- Code này chỉ là test cơ bản, chưa có verify PIN, EEPROM, Wi-Fi
- Phase tiếp theo sẽ thêm state machine, PIN verification, lockout
- Nếu có vấn đề, check Serial Monitor để debug

---

**Ngày tạo:** 2026-01-24  
**Phase:** 1 - Task 1  
**Status:** Ready to upload
