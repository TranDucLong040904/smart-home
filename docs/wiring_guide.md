# Hướng dẫn lắp mạch - Smart Door Phase 1

**Mục tiêu:** Lắp mạch để test Task 1 - Đọc keypad, hiển thị LCD, beep buzzer, điều khiển servo

---

## 📌 ESP8266 Wemos D1 Mini Pinout

**Board của bạn: ESP8266 Wemos D1 Mini (không phải NodeMCU V3)**

```
Bên TRÁI (từ trên xuống):        Bên PHẢI (từ trên xuống):
┌─────────────┐                  ┌─────────────┐
│ A0          │ ← Analog         │ D0          │ ← GPIO16
│ GND         │                  │ D1          │ ← GPIO5 (SCL)
│ W           │ ← Wake           │ D2          │ ← GPIO4 (SDA)
│ S3          │ ← GPIO10         │ D3          │ ← GPIO0
│ S2          │ ← GPIO9          │ D4          │ ← GPIO2
│ S1          │ ← GPIO8          │ 3V3         │
│ SC          │ ← GPIO11 (SCLK)  │ GND         │
│ S0          │ ← GPIO7          │ D5          │ ← GPIO14
│ SK          │ ← GPIO6          │ D6          │ ← GPIO12
│ GND         │                  │ D7          │ ← GPIO13
│ 3V3         │                  │ D8          │ ← GPIO15
│ EN          │                  │ RX          │ ← GPIO3
│ RST         │                  │ TX          │ ← GPIO1
│ GND         │                  │ GND         │
│ VIN         │ ← 5V Input       │ 3V3         │
└─────────────┘                  └─────────────┘
```

**⚠️ QUAN TRỌNG - Mapping GPIO:**

| Ký hiệu board | GPIO thực | Arduino IDE | Chức năng         |
| ------------- | --------- | ----------- | ----------------- |
| **D0**        | GPIO16    | D0          | No interrupt      |
| **D1**        | GPIO5     | D1          | I2C SCL           |
| **D2**        | GPIO4     | D2          | I2C SDA           |
| **D3**        | GPIO0     | D3          | ⚠️ Pull-up boot   |
| **D4**        | GPIO2     | D4          | LED onboard       |
| **D5**        | GPIO14    | D5          | Safe              |
| **D6**        | GPIO12    | D6          | Safe              |
| **D7**        | GPIO13    | D7          | Safe              |
| **D8**        | GPIO15    | D8          | ⚠️ Pull-down boot |
| **A0**        | ADC       | A0          | Analog input      |

**Chân bên TRÁI (S0-S3, SC, SK):**

- ⚠️ **KHÔNG DÙNG** các chân S0, S1, S2, S3, SC, SK (GPIO6-11)
- Đây là chân kết nối với Flash memory, dùng sẽ làm hỏng board!
- **CHỈ DÙNG:** A0 (analog input)

**Chân bên PHẢI (D0-D8, RX, TX):**

- ✅ **AN TOÀN** để dùng: D0-D8, RX, TX
- ✅ **Đây là các chân chúng ta sẽ dùng**

---

## 🧰 Linh kiện cần chuẩn bị

### **Linh kiện chính:**

- [ ] ESP8266 NodeMCU V3 LoLin (1 cái) ✅ Bạn đã có
- [ ] Keypad 4x4 (1 cái)
- [ ] LCD 16x2 + I2C Module PCF8574 (1 bộ)
- [ ] Servo SG90 hoặc MG90S (1 cái)
- [ ] Buzzer active 2 chân (1 cái)

### **Linh kiện phụ:**

- [ ] Resistor 10kΩ (2 cái) - cho pull-up và pull-down
- [ ] Tụ điện 470µF hoặc 1000µF (1 cái) - cho servo
- [ ] Breadboard lớn (1 cái) ✅ Bạn đã có
- [ ] Jumper wires (nam-nam, nam-nữ) - nhiều màu
- [ ] USB cable (để nạp code và cấp nguồn)

### **Nguồn điện:**

- [ ] USB 5V adapter ≥2A (cho ESP8266 + LCD + Servo)
- [ ] Hoặc: USB 5V 1A (ESP8266) + Pin 6V/4xAA (Servo riêng)

---

## 📋 Bảng kết nối chi tiết

### **1. LCD I2C Module → ESP8266**

| LCD I2C Pin | ESP8266 Pin    | Màu dây đề xuất |
| ----------- | -------------- | --------------- |
| GND         | GND            | Đen             |
| VCC         | 5V (hoặc 3.3V) | Đỏ              |
| SDA         | D2 (GPIO4)     | Xanh dương      |
| SCL         | D1 (GPIO5)     | Xanh lá         |

**Lưu ý:**

- Module I2C thường hoạt động ở 5V nhưng tương thích logic 3.3V
- Điều chỉnh độ tương phản bằng biến trở xanh trên module

---

### **2. Keypad 4x4 → ESP8266**

#### **Rows (Hàng) - Output:**

| Keypad Pin | ESP8266 Pin | GPIO | Màu dây | Lưu ý                     |
| ---------- | ----------- | ---- | ------- | ------------------------- |
| L1 (Row 0) | D5          | 14   | Đỏ      | **Dùng chung với Servo**  |
| L2 (Row 1) | D6          | 12   | Cam     | Safe GPIO                 |
| L3 (Row 2) | D7          | 13   | Vàng    | Safe GPIO                 |
| L4 (Row 3) | D4          | 2    | Xanh lá | **Dùng chung với Buzzer** |

#### **Columns (Cột) - Input:**

| Keypad Pin | ESP8266 Pin | GPIO | Màu dây    | Resistor                     | Lưu ý        |
| ---------- | ----------- | ---- | ---------- | ---------------------------- | ------------ |
| R1 (Col 0) | D0          | 16   | Xanh dương | Không                        | No interrupt |
| R2 (Col 1) | D3          | 0    | Tím        | **10kΩ pull-up lên 3.3V**    | ⚠️ BẮT BUỘC  |
| R3 (Col 2) | D8          | 15   | Xám        | **10kΩ pull-down xuống GND** | ⚠️ BẮT BUỘC  |
| R4 (Col 3) | A0          | ADC  | Trắng      | Không                        | Analog hack  |

**⚠️ QUAN TRỌNG:**

- **GPIO0 (D3):** Phải có resistor 10kΩ pull-up lên 3.3V, nếu không ESP8266 sẽ vào Flash Mode khi boot
- **GPIO15 (D8):** Phải có resistor 10kΩ pull-down xuống GND, nếu không ESP8266 không boot được

---

### **3. Servo Motor → ESP8266 + Nguồn riêng**

| Servo Pin | Kết nối        | Màu dây servo | Lưu ý                        |
| --------- | -------------- | ------------- | ---------------------------- |
| Signal    | D5 (GPIO14)    | Cam/Vàng      | **Dùng chung với Keypad L1** |
| VCC       | Nguồn 5V riêng | Đỏ            | **KHÔNG dùng 3.3V ESP8266**  |
| GND       | GND chung      | Nâu/Đen       | Chung GND với ESP8266        |

**Nguồn cho Servo:**

**Option 1: Dùng chung USB 5V (Đơn giản nhưng cần adapter mạnh)**

```
USB 5V (≥2A) → ESP8266 VIN (5V)
             → Servo VCC (5V)
             → GND chung

⚠️ Phải thêm tụ điện 470µF-1000µF song song với servo!
```

**Option 2: Nguồn riêng cho Servo (Ổn định hơn - Khuyến nghị)**

```
USB 5V (1A) → ESP8266 VIN
Pin 6V (4xAA) → Servo VCC + Tụ 1000µF
Chung GND giữa ESP8266 và Pin
```

**Lắp tụ điện:**

```
Tụ 470µF-1000µF:
  Chân dương (+) → Servo VCC
  Chân âm (-) → Servo GND

Mục đích: Chống sụt áp khi servo hoạt động
```

---

### **4. Buzzer → ESP8266**

| Buzzer Pin   | ESP8266 Pin | Lưu ý                        |
| ------------ | ----------- | ---------------------------- |
| + (dài hơn)  | D4 (GPIO2)  | **Dùng chung với Keypad L4** |
| - (ngắn hơn) | GND         | Chung GND                    |

**Lưu ý:**

- Active Buzzer: Chỉ cần HIGH/LOW để beep
- Passive Buzzer: Cần PWM với tần số (code sẽ xử lý)

---

## 🔧 Hướng dẫn lắp từng bước

### **Bước 1: Chuẩn bị Breadboard**

1. Đặt ESP8266 NodeMCU vào giữa breadboard
2. Kéo dây nguồn:
   - Rail (+) breadboard → ESP8266 3.3V
   - Rail (-) breadboard → ESP8266 GND

---

### **Bước 2: Lắp LCD I2C (Dễ nhất)**

1. Cắm LCD I2C vào breadboard (hoặc dùng jumper nữ)
2. Kết nối 4 dây:
   - GND → GND
   - VCC → 5V (hoặc 3.3V)
   - SDA → D2
   - SCL → D1

**Test:** Sau khi nạp code, LCD sẽ sáng và hiển thị text

---

### **Bước 3: Lắp Keypad 4x4**

#### **3.1. Lắp Rows (4 dây đơn giản):**

```
L1 → D5 (đỏ)
L2 → D6 (cam)
L3 → D7 (vàng)
L4 → D4 (xanh lá)
```

#### **3.2. Lắp Columns (CẦN RESISTOR!):**

**R1 (Col 0) → D0:** Dây xanh dương, không cần resistor

**R2 (Col 1) → D3 + Pull-up 10kΩ:**

```
Keypad R2 ──┬──→ D3 (GPIO0)
            │
            └──→ [Resistor 10kΩ] ──→ 3.3V
```

**R3 (Col 2) → D8 + Pull-down 10kΩ:**

```
Keypad R3 ──┬──→ D8 (GPIO15)
            │
            └──→ [Resistor 10kΩ] ──→ GND
```

**R4 (Col 3) → A0:** Dây trắng, không cần resistor

**⚠️ Lưu ý:** Nếu không hàn resistor, có thể dùng breadboard:

```
Breadboard:
  Row A: 3.3V ── [10kΩ] ── Row B (nối với D3 và Keypad R2)
  Row C: D8 và Keypad R3 ── [10kΩ] ── Row D (nối GND)
```

---

### **Bước 4: Lắp Servo (CẦN TỤ ĐIỆN!)**

#### **4.1. Lắp tụ điện 470µF:**

```
Breadboard:
  Row X: Servo VCC (5V) ── [Tụ +]
  Row Y: Servo GND      ── [Tụ -]
```

#### **4.2. Kết nối servo:**

```
Servo Signal (cam) → D5 (GPIO14) - dùng chung với Keypad L1
Servo VCC (đỏ)     → 5V (từ USB hoặc nguồn riêng)
Servo GND (nâu)    → GND chung
```

**⚠️ Quan trọng:** Chung GND giữa ESP8266 và nguồn servo!

---

### **Bước 5: Lắp Buzzer (Dễ nhất)**

```
Buzzer + (chân dài) → D4 (GPIO2) - dùng chung với Keypad L4
Buzzer - (chân ngắn) → GND
```

---

### **Bước 6: Kiểm tra kết nối**

**Checklist trước khi cấp nguồn:**

- [ ] LCD I2C: 4 dây đúng (GND, VCC, SDA, SCL)
- [ ] Keypad Rows: 4 dây đúng (L1-L4 → D5, D6, D7, D4)
- [ ] Keypad Cols: 4 dây + 2 resistor (R1-R4 → D0, D3, D8, A0)
- [ ] Resistor 10kΩ pull-up: D3 → 3.3V ✅
- [ ] Resistor 10kΩ pull-down: D8 → GND ✅
- [ ] Servo: Signal → D5, VCC → 5V, GND → GND
- [ ] Tụ 470µF: Song song với servo VCC-GND ✅
- [ ] Buzzer: + → D4, - → GND
- [ ] Chung GND: Tất cả GND nối với nhau ✅

---

## ⚡ Cấp nguồn

### **Cách 1: USB 5V đơn giản**

```
1. Cắm USB cable vào ESP8266
2. Cắm USB vào adapter 5V ≥2A
3. Kiểm tra:
   - LED trên ESP8266 sáng
   - LCD sáng (có thể chưa hiển thị text)
   - Servo không rung (nếu rung → thiếu tụ)
```

### **Cách 2: Nguồn riêng cho Servo**

```
1. USB 5V → ESP8266 VIN
2. Pin 6V (4xAA) → Servo VCC + Tụ
3. Nối GND chung giữa USB và Pin
```

---

## 🧪 Test trước khi nạp code

### **Test 1: ESP8266 boot được không?**

```
1. Cắm USB
2. Mở Arduino IDE > Tools > Serial Monitor (115200 baud)
3. Nhấn nút RST trên ESP8266
4. Phải thấy boot message (nếu không → kiểm tra GPIO0, GPIO15)
```

### **Test 2: LCD sáng không?**

```
1. Cắm USB
2. LCD phải sáng (backlight)
3. Xoay biến trở xanh để điều chỉnh độ tương phản
4. Nếu không sáng → kiểm tra VCC, GND
```

### **Test 3: Servo có rung/nóng không?**

```
1. Cắm USB
2. Servo không được rung hoặc nóng
3. Nếu rung → Thiếu tụ điện hoặc nguồn yếu
4. Nếu nóng → Ngắt nguồn ngay, kiểm tra lại kết nối
```

---

## ⚠️ Troubleshooting

### **Vấn đề 1: ESP8266 không boot (LED nhấp nháy liên tục)**

**Nguyên nhân:** GPIO0 hoặc GPIO15 không đúng trạng thái

**Giải pháp:**

- Kiểm tra resistor 10kΩ pull-up trên GPIO0 (D3)
- Kiểm tra resistor 10kΩ pull-down trên GPIO15 (D8)
- Tạm thời rút dây keypad R2 (D3) và R3 (D8), boot lại

---

### **Vấn đề 2: LCD không sáng**

**Nguyên nhân:** Kết nối sai hoặc địa chỉ I2C sai

**Giải pháp:**

- Kiểm tra 4 dây: GND, VCC, SDA (D2), SCL (D1)
- Thử đổi VCC từ 5V sang 3.3V (hoặc ngược lại)
- Chạy I2C Scanner để tìm địa chỉ (0x27 hoặc 0x3F)

---

### **Vấn đề 3: Servo rung hoặc reset ESP8266**

**Nguyên nhân:** Sụt áp khi servo hoạt động

**Giải pháp:**

- Thêm tụ điện ≥470µF song song với servo
- Dùng nguồn riêng cho servo (Pin 6V)
- Dùng adapter USB mạnh hơn (≥2A)

---

### **Vấn đề 4: Keypad không đọc được phím**

**Nguyên nhân:** Kết nối sai hoặc A0 analog không hoạt động

**Giải pháp:**

- Kiểm tra 8 dây keypad (L1-L4, R1-R4)
- Kiểm tra resistor pull-up/pull-down
- Test từng phím bằng Serial Monitor

---

## ✅ Checklist hoàn thành

Sau khi lắp xong, bạn phải có:

- [ ] ESP8266 boot được (không nhấp nháy liên tục)
- [ ] LCD sáng, có thể điều chỉnh độ tương phản
- [ ] Servo không rung, không nóng
- [ ] Tất cả dây đã cắm đúng theo bảng
- [ ] Resistor 10kΩ đã hàn/cắm đúng vị trí
- [ ] Tụ điện 470µF đã gắn cho servo
- [ ] Chung GND giữa tất cả linh kiện

**Nếu tất cả OK → Báo cho tôi, tôi sẽ đưa code để nạp!** 🚀

---

**Ngày tạo:** 2026-01-24  
**Phase:** 1 - Task 1  
**Mục tiêu:** Test keypad, LCD, buzzer, servo
