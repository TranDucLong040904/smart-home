# Sơ đồ chân nối - Smart Door System

## 📋 Tổng quan

Dự án sử dụng **ESP8266 (NodeMCU/Wemos D1 Mini)** với các linh kiện sau:

- Keypad 4x4
- LCD 16x2 + I2C Module (PCF8574)
- Servo Motor
- Buzzer
- Nút trong nhà (dùng phím B trên keypad)

**Phương án:** Giữ Serial Debug (TX/RX) cho troubleshooting, sử dụng time-multiplexing cho Servo/Buzzer.

---

## 🔌 Sơ đồ chân đầy đủ

### **ESP8266 Pin Assignments**

| Linh kiện             | Chân ESP8266 | GPIO   | Loại         | Ghi chú                             |
| --------------------- | ------------ | ------ | ------------ | ----------------------------------- |
| **LCD I2C - SDA**     | D2           | GPIO4  | I2C          | Địa chỉ 0x27 hoặc 0x3F              |
| **LCD I2C - SCL**     | D1           | GPIO5  | I2C          | Chung bus với SDA                   |
| **Keypad L1 (Row 0)** | D5           | GPIO14 | Output       | Safe GPIO, dùng chung Servo         |
| **Keypad L2 (Row 1)** | D6           | GPIO12 | Output       | Safe GPIO                           |
| **Keypad L3 (Row 2)** | D7           | GPIO13 | Output       | Safe GPIO                           |
| **Keypad L4 (Row 3)** | D4           | GPIO2  | Output       | LED onboard, dùng chung Buzzer      |
| **Keypad R1 (Col 0)** | D0           | GPIO16 | Input        | No interrupt, OK cho scan           |
| **Keypad R2 (Col 1)** | D3           | GPIO0  | Input        | **Pull-up 10kΩ** (boot safe)        |
| **Keypad R3 (Col 2)** | D8           | GPIO15 | Input        | **Pull-down 10kΩ** (boot safe)      |
| **Keypad R4 (Col 3)** | A0           | ADC    | Analog Input | Đọc > 512 = HIGH                    |
| **Servo**             | D5           | GPIO14 | PWM          | **Time-multiplexing** với Keypad L1 |
| **Buzzer**            | D4           | GPIO2  | Output       | **Time-multiplexing** với Keypad L4 |
| **Serial TX**         | TX           | GPIO1  | UART         | Debug output                        |
| **Serial RX**         | RX           | GPIO3  | UART         | Debug input                         |
| **Nút trong nhà**     | -            | -      | Virtual      | Dùng phím **B** trên keypad         |

---

## 🔧 Chi tiết kết nối từng linh kiện

### **1. LCD 16x2 + I2C Module**

```
LCD I2C Module (PCF8574)     ESP8266
┌─────────────────┐          ┌──────────┐
│ GND             │─────────→│ GND      │
│ VCC             │─────────→│ 5V/3.3V  │ (Tùy module, thường 5V OK)
│ SDA             │─────────→│ D2 (GPIO4) │
│ SCL             │─────────→│ D1 (GPIO5) │
└─────────────────┘          └──────────┘
```

**Lưu ý:**

- Module I2C thường hoạt động ở 5V nhưng tương thích logic 3.3V
- Địa chỉ I2C mặc định: **0x27** hoặc **0x3F** (kiểm tra bằng I2C Scanner)
- Điều chỉnh độ tương phản bằng biến trở xanh trên module

---

### **2. Keypad 4x4**

```
Keypad Layout:
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ A │  A = Delete
├───┼───┼───┼───┤
│ 4 │ 5 │ 6 │ B │  B = Nút trong nhà (giữ 2s)
├───┼───┼───┼───┤
│ 7 │ 8 │ 9 │ C │  C = Đổi mật khẩu
├───┼───┼───┼───┤
│ * │ 0 │ # │ D │  D = Enter
└───┴───┴───┴───┘
```

**Kết nối:**

```
Keypad Pin     ESP8266 Pin    GPIO    Loại        Lưu ý
──────────────────────────────────────────────────────────────
L1 (Row 0)  →  D5          →  14   →  Output   →  Safe, dùng chung Servo
L2 (Row 1)  →  D6          →  12   →  Output   →  Safe
L3 (Row 2)  →  D7          →  13   →  Output   →  Safe
L4 (Row 3)  →  D4          →  2    →  Output   →  LED onboard, dùng chung Buzzer

R1 (Col 0)  →  D0          →  16   →  Input    →  No interrupt (OK)
R2 (Col 1)  →  D3          →  0    →  Input    →  PULL-UP 10kΩ bắt buộc
R3 (Col 2)  →  D8          →  15   →  Input    →  PULL-DOWN 10kΩ bắt buộc
R4 (Col 3)  →  A0          →  ADC  →  Analog   →  Đọc > 512 = HIGH
```

**Sơ đồ kết nối:**

```
Keypad          ESP8266          Resistor
┌──────┐        ┌──────┐
│ L1   │───────→│ D5   │
│ L2   │───────→│ D6   │
│ L3   │───────→│ D7   │
│ L4   │───────→│ D4   │
│      │        │      │
│ R1   │───────→│ D0   │
│ R2   │───┬───→│ D3   │
│      │   └───→│ 3.3V │ (Pull-up 10kΩ)
│ R3   │───┬───→│ D8   │
│      │   └───→│ GND  │ (Pull-down 10kΩ)
│ R4   │───────→│ A0   │
└──────┘        └──────┘
```

**⚠️ QUAN TRỌNG:**

- **GPIO0 (D3):** Phải pull-up 10kΩ lên 3.3V, nếu không ESP8266 sẽ vào Flash Mode khi boot
- **GPIO15 (D8):** Phải pull-down 10kΩ xuống GND, nếu không ESP8266 không boot được
- **A0 (ADC):** Đọc giá trị analog, nếu > 512 (3.3V/2) = phím được nhấn

---

### **3. Servo Motor**

```
Servo SG90/MG90S     ESP8266          Power Supply
┌──────────┐         ┌──────┐         ┌──────┐
│ Signal   │────────→│ D5   │         │      │
│ VCC (5V) │────────→│      │←───────→│ 5V   │ (Nguồn riêng)
│ GND      │────────→│ GND  │←───────→│ GND  │ (Chung GND)
└──────────┘         └──────┘         └──────┘
                                       │      │
                                       │ Tụ   │ 470µF-1000µF
                                       └──────┘
```

**⚠️ QUAN TRỌNG:**

- **Nguồn riêng 5-6V** cho servo (không dùng nguồn ESP8266)
- **Chung GND** giữa ESP8266 và nguồn servo
- **Tụ điện ≥470µF** song song với servo để chống sụt áp
- **Time-multiplexing:** GPIO14 (D5) dùng chung với Keypad Row 0
  - Khi scan keypad: GPIO14 = OUTPUT (quét row)
  - Khi điều khiển servo: GPIO14 = PWM (mở cửa 3 giây)

**Code logic:**

```cpp
// Khi cần mở cửa:
1. Tạm dừng keypad scan
2. Chuyển GPIO14 sang PWM mode
3. Điều khiển servo (0-180 độ)
4. Delay 3 giây
5. Đóng servo
6. Chuyển GPIO14 về OUTPUT mode
7. Tiếp tục keypad scan
```

---

### **4. Buzzer (Active/Passive)**

```
Buzzer          ESP8266
┌──────┐        ┌──────┐
│ +    │───────→│ D4   │ (GPIO2)
│ -    │───────→│ GND  │
└──────┘        └──────┘
```

**Lưu ý:**

- **Active Buzzer:** Chỉ cần HIGH/LOW để beep
- **Passive Buzzer:** Cần PWM với tần số (tone)
- **Time-multiplexing:** GPIO2 (D4) dùng chung với Keypad Row 3
  - Beep ngắn (100-500ms) không ảnh hưởng keypad scan

**Code logic:**

```cpp
// Khi cần beep:
1. Set GPIO2 = HIGH (beep)
2. Delay 100-500ms
3. Set GPIO2 = LOW
4. Tiếp tục keypad scan bình thường
```

---

### **5. Nút trong nhà (Virtual Button)**

**Không cần GPIO riêng**, sử dụng **phím B** trên keypad:

```
Chức năng:
- Nhấn B 1 lần: Không làm gì (tránh nhầm)
- Giữ B 2 giây: Toggle cửa (mở ↔ đóng)
  + Đang đóng → Mở cửa
  + Đang mở → Đóng cửa ngay lập tức
```

**Ưu điểm:**

- Tiết kiệm 1 GPIO
- Dễ sử dụng (phím B ở vị trí thuận tiện)
- Tránh nhấn nhầm (phải giữ 2 giây)

---

## ⚡ Nguồn cấp điện

### **Phương án 1: Nguồn USB 5V (Đơn giản)**

```
USB 5V Adapter (2A)
    │
    ├──→ ESP8266 VIN (5V) hoặc 3.3V
    ├──→ LCD I2C VCC (5V)
    ├──→ Servo VCC (5V) + Tụ 470µF
    └──→ GND chung
```

**Yêu cầu:**

- Adapter ≥2A (ESP8266 ~300mA, Servo ~500mA, LCD ~100mA)
- Tụ điện lớn (470µF-1000µF) cho servo

---

### **Phương án 2: Nguồn riêng cho Servo (Ổn định hơn)**

```
USB 5V (1A) ──→ ESP8266 + LCD
                   │
                  GND ←─── Chung GND
                   │
Battery 6V (4xAA) ──→ Servo + Tụ 1000µF
```

**Ưu điểm:**

- Servo không ảnh hưởng nguồn ESP8266
- Ổn định hơn, tránh reset ESP8266 khi servo hoạt động

---

## 🧪 Kiểm tra kết nối

### **Bước 1: Test I2C Scanner**

```cpp
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(4, 5); // SDA=GPIO4, SCL=GPIO5
  Serial.println("I2C Scanner");
}

void loop() {
  for(byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if(Wire.endTransmission() == 0) {
      Serial.print("Found I2C: 0x");
      Serial.println(addr, HEX);
    }
  }
  delay(5000);
}
```

**Kết quả mong đợi:** `Found I2C: 0x27` (hoặc 0x3F)

---

### **Bước 2: Test Keypad**

```cpp
#include <Keypad.h>

const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte rowPins[ROWS] = {14, 12, 13, 2};  // D5, D6, D7, D4
byte colPins[COLS] = {16, 0, 15, A0};  // D0, D3, D8, A0

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void setup() {
  Serial.begin(115200);
  pinMode(0, INPUT_PULLUP);   // D3 pull-up
  pinMode(15, INPUT_PULLDOWN); // D8 pull-down (cần thư viện hoặc hardware)
}

void loop() {
  char key = keypad.getKey();
  if (key) {
    Serial.println(key);
  }
}
```

**Lưu ý:** GPIO15 cần pull-down bằng resistor vật lý (10kΩ xuống GND)

---

### **Bước 3: Test Servo**

```cpp
#include <Servo.h>

Servo doorServo;

void setup() {
  doorServo.attach(14); // D5
  doorServo.write(0);   // Đóng cửa
}

void loop() {
  doorServo.write(90);  // Mở cửa
  delay(3000);
  doorServo.write(0);   // Đóng cửa
  delay(3000);
}
```

---

## 📊 Bảng tổng hợp GPIO

| GPIO | Chân | Chức năng chính   | Chức năng phụ | Boot Safe? | Lưu ý                   |
| ---- | ---- | ----------------- | ------------- | ---------- | ----------------------- |
| 0    | D3   | Keypad R2 (Col 1) | -             | ⚠️         | Pull-up 10kΩ bắt buộc   |
| 1    | TX   | Serial Debug TX   | -             | ⚠️         | Giữ cho debug           |
| 2    | D4   | Keypad L4 (Row 3) | Buzzer        | ⚠️         | LED onboard, time-mux   |
| 3    | RX   | Serial Debug RX   | -             | ⚠️         | Giữ cho debug           |
| 4    | D2   | LCD SDA           | -             | ✅         | I2C                     |
| 5    | D1   | LCD SCL           | -             | ✅         | I2C                     |
| 12   | D6   | Keypad L2 (Row 1) | -             | ✅         | Safe                    |
| 13   | D7   | Keypad L3 (Row 2) | -             | ✅         | Safe                    |
| 14   | D5   | Keypad L1 (Row 0) | Servo         | ✅         | Safe, time-mux          |
| 15   | D8   | Keypad R3 (Col 2) | -             | ⚠️         | Pull-down 10kΩ bắt buộc |
| 16   | D0   | Keypad R1 (Col 0) | -             | ⚠️         | No interrupt            |
| ADC  | A0   | Keypad R4 (Col 3) | -             | ✅         | Analog read             |

---

## 🔮 Dự phòng mở rộng tương lai

Nếu cần thêm linh kiện, có 2 phương án:

### **Phương án 1: Dùng TX/RX (mất debug)**

- TX (GPIO1) → Reed Switch
- RX (GPIO3) → LED Status

### **Phương án 2: Mua PCF8574 I2C Expander**

- Giải phóng 8 GPIO từ keypad
- Còn 8 GPIO ESP8266 cho mở rộng

---

## ✅ Checklist trước khi bắt đầu code

- [ ] Hàn pull-up 10kΩ cho GPIO0 (D3)
- [ ] Hàn pull-down 10kΩ cho GPIO15 (D8)
- [ ] Chuẩn bị tụ điện ≥470µF cho servo
- [ ] Kiểm tra địa chỉ I2C LCD (0x27 hoặc 0x3F)
- [ ] Test từng module riêng lẻ (LCD, Keypad, Servo)
- [ ] Chung GND giữa ESP8266 và nguồn servo

---

**Ngày tạo:** 2026-01-24  
**Phiên bản:** 1.0  
**Phương án:** A - Giữ Serial Debug với Time-Multiplexing
