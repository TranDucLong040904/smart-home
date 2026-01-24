# Project Structure - Smart Door System

Cấu trúc thư mục và file của dự án Smart Door.

---

## 📁 Tổng quan cấu trúc

```
smart door/
├── .git/                         # Git repo
├── .gitignore
├── README.md                     # Hướng dẫn nhanh
├── plan.md                       # Kế hoạch
├── PROJECT_STRUCTURE.md          # File này
├── sketch_dec29a.ino             # Sketch cũ (không dùng chính)
│
├── docs/                         # Tài liệu
│   ├── SRS_smart_door.md         # Yêu cầu hệ thống
│   ├── hardware_wiring.md        # Sơ đồ chân chi tiết
│   ├── PIN_MAPPING.md            # Bảng mapping chân
│   ├── wiring_guide.md           # Hướng dẫn đi dây
│   ├── checklist.md              # Checklist tiến độ
│   ├── CHANGELOG.md              # Lịch sử thay đổi
│   └── testing_log.md            # Nhật ký test
│
├── backend/                      # Firmware ESP8266
│   ├── backend.ino               # Firmware chính (state machine, EEPROM, lockout)
│   ├── config.h                  # Chân GPIO, hằng số
│   └── README.md                 # Hướng dẫn nạp
│
└── frontend/                     # Web UI (chưa triển khai mã)
    └── (trống)
```

---

## 📚 Chi tiết từng thư mục

### **1. Root Directory**

| File                   | Mục đích                        | Cập nhật          |
| ---------------------- | ------------------------------- | ----------------- |
| `README.md`            | Hướng dẫn nhanh, overview dự án | Hiếm              |
| `plan.md`              | Kế hoạch tổng quan, lộ trình    | Hiếm              |
| `PROJECT_STRUCTURE.md` | Mô tả cấu trúc dự án (file này) | Khi thêm/xóa file |
| `.gitignore`           | Ignore file cho Git             | Khi cần           |

---

### **2. `docs/` - Tài liệu**

Chứa tất cả tài liệu kỹ thuật, yêu cầu, và tracking.

| File               | Loại        | Mục đích                      | Cập nhật              |
| ------------------ | ----------- | ----------------------------- | --------------------- |
| `SRS_smart_door.md`| ✅ Cố định  | Đặc tả yêu cầu hệ thống       | Khi thay đổi yêu cầu  |
| `hardware_wiring.md`| ✅ Cố định | Sơ đồ chân nối chi tiết       | Khi thay đổi hardware |
| `PIN_MAPPING.md`   | ✅ Cố định  | Bảng mapping chân keypad/LCD/servo | Khi đổi chân nối |
| `wiring_guide.md`  | ✅ Cố định  | Hướng dẫn đi dây thực tế      | Khi đổi phương án dây |
| `checklist.md`     | 🔄 Cập nhật | Tiến độ công việc             | Sau mỗi task          |
| `CHANGELOG.md`     | 🔄 Cập nhật | Lịch sử thay đổi              | Mỗi version           |
| `testing_log.md`   | 🔄 Cập nhật | Nhật ký test                  | Sau mỗi test          |

**Workflow:**

1. Đọc `SRS_smart_door.md` để hiểu yêu cầu
2. Đọc `hardware_wiring.md` trước khi lắp mạch
3. Check `checklist.md` để biết task cần làm
4. Sau khi code xong → Cập nhật `checklist.md`, `testing_log.md`
5. Khi release version → Cập nhật `CHANGELOG.md`

---

### **3. `backend/` - Firmware ESP8266**

Hiện tại dùng một sketch chính `backend.ino` (đã có state machine, EEPROM, lockout, đổi mật khẩu, nút trong nhà). Tham số chân nằm ở `config.h`.

| File          | Mục đích                                      |
| ------------- | --------------------------------------------- |
| `backend.ino` | Firmware chính cho ESP8266 (Wemos D1 Mini)    |
| `config.h`    | Cấu hình GPIO, hằng số, thời gian             |
| `README.md`   | Hướng dẫn nạp, thư viện cần cài               |

---

### **4. `frontend/` - Web UI**

Hiện chưa có mã nguồn. Sẽ dựng ở Phase 3 (dashboard trạng thái, log, OTP, cấu hình, mở từ xa). Khi bắt đầu, tạo `index.html`, `css/`, `js/`, `assets/`, `README.md` theo nhu cầu.

---

## 🔄 Workflow phát triển

### **Phase 1: Hardware + Firmware cục bộ (Hiện tại)**

```
1. Đọc docs/hardware_wiring.md
2. Lắp mạch theo sơ đồ
3. Nạp backend/backend.ino, kiểm tra keypad/LCD/servo/buzzer theo checklist
4. Ghi kết quả vào docs/testing_log.md
5. Điều chỉnh cấu hình trong backend/config.h khi đổi chân/thời gian
6. Cập nhật docs/checklist.md
```

---

### **Phase 2: Kết nối mạng & Cloud**

```
1. Thêm WiFiManager vào firmware
2. Thêm NTP, OTA
3. Thiết lập Firebase project
4. Thêm Firebase client vào firmware
5. Test đồng bộ cloud
6. Cập nhật docs/CHANGELOG.md
```

---

### **Phase 3: Frontend**

```
1. Tạo mock API trong frontend/
2. Dựng UI dashboard
3. Tích hợp Firebase
4. Test với firmware
5. Deploy lên hosting (Netlify/Vercel)
```

---

## 📊 Quy ước đặt tên

### **Files:**

- Markdown: `lowercase_with_underscores.md`
- C++ Header: `lowercase_with_underscores.h`
- Arduino Sketch: `lowercase_with_underscores.ino`
- HTML/CSS/JS: `lowercase.html`, `style.css`, `app.js`

### **Folders:**

- Thư mục chính: `lowercase with spaces` (theo yêu cầu Windows)
- Thư mục con: `lowercase_with_underscores`

### **Git Commits:**

- Format: `[TYPE] Short description`
- Types: `[DOCS]`, `[FIRMWARE]`, `[FRONTEND]`, `[TEST]`, `[FIX]`
- Example: `[FIRMWARE] Add keypad handler with A0 analog hack`

---

## 🔧 Thư viện cần cài (Arduino IDE)

### **Bắt buộc:**

- `Keypad` by Mark Stanley, Alexander Brevig
- `LiquidCrystal_I2C` by Frank de Brabander
- `Servo` (built-in)
- `EEPROM` (built-in)
- `Wire` (built-in)

### **Phase 2 (Cloud):**

- `WiFiManager` by tzapu
- `NTPClient` by Fabrice Weinberg
- `ArduinoOTA` (built-in)
- `Firebase ESP8266 Client` by Mobizt

---

## 📝 Checklist setup môi trường

### **Hardware:**

- [ ] ESP8266 (NodeMCU/Wemos D1 Mini)
- [ ] Keypad 4x4
- [ ] LCD 16x2 + I2C Module (PCF8574)
- [ ] Servo SG90/MG90S
- [ ] Buzzer (active hoặc passive)
- [ ] Resistor 10kΩ x2 (pull-up, pull-down)
- [ ] Tụ điện ≥470µF
- [ ] Breadboard + Jumper wires
- [ ] Nguồn 5V ≥2A

### **Software:**

- [ ] Arduino IDE 1.8.x hoặc 2.x
- [ ] Board ESP8266 đã cài (Tools > Board > Boards Manager > esp8266)
- [ ] Driver CH340/CP2102 (nếu cần)
- [ ] Thư viện đã cài (xem danh sách trên)
- [ ] Git (để clone/pull project)

### **Tài liệu:**

- [ ] Đã đọc `README.md`
- [ ] Đã đọc `docs/SRS_smart_door.md`
- [ ] Đã đọc `docs/hardware_wiring.md`
- [ ] Đã đọc `docs/checklist.md`

---

## 🎯 Trạng thái hiện tại

**Version:** 0.1.1  
**Phase:** 1 - Hardware + Firmware cục bộ  
**Status:** Đã có firmware chính (backend.ino), tiếp tục hoàn thiện/test

**Đã hoàn thành:**

- ✅ Tài liệu dự án (SRS, plan, checklist)
- ✅ Sơ đồ chân tối ưu
- ✅ Firmware backend.ino: state machine, EEPROM, lockout, đổi MK, nút trong nhà

**Tiếp theo:**

- [ ] Test thực tế keypad/LCD/servo/buzzer và ghi vào testing_log.md
- [ ] Điều chỉnh cấu hình/giao diện LCD nếu cần
- [ ] Chuẩn bị Phase 2: WiFiManager, NTP, OTA

---

## 📞 Liên hệ & Handover

**Khi handover cho developer khác:**

1. **Đọc file này** để hiểu cấu trúc project
2. **Đọc `README.md`** để biết overview
3. **Đọc `docs/SRS_smart_door.md`** để hiểu yêu cầu
4. **Đọc `docs/hardware_wiring.md`** trước khi lắp mạch
5. **Check `docs/checklist.md`** để biết tiến độ
6. **Đọc `docs/CHANGELOG.md`** để biết lịch sử thay đổi

**Quy trình code:**

1. Tạo branch mới từ `main`
2. Code trong `backend/` hoặc `frontend/`
3. Test kỹ, ghi kết quả vào `docs/testing_log.md`
4. Cập nhật `docs/checklist.md`
5. Commit với message rõ ràng
6. Merge vào `main`
7. Cập nhật `docs/CHANGELOG.md` khi release version

---

**Ngày tạo:** 2026-01-24  
**Phiên bản:** 1.0  
**Tác giả:** Smart Door Team
