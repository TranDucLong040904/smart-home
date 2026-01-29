# Smart Door - Công việc cần hoàn thiện

> **Cập nhật lần cuối:** 2026-01-29  
> **Mục đích:** Liệt kê các tính năng chưa hoàn thiện và cần phát triển thêm

---

## 🔴 CẦN HOÀN THIỆN GẤP

### 1. OTP Verification trên Backend

**Vấn đề:** Frontend có tính năng tạo mã OTP cho khách, nhưng Backend (ESP8266) chưa có code xử lý verify OTP.

**Cần làm:**

- [ ] Thêm logic đọc OTP từ Firebase path `/commands/otp`
- [ ] Cho phép nhập OTP bằng keypad để mở cửa
- [ ] Kiểm tra thời hạn OTP (expires timestamp)
- [ ] Xóa OTP sau khi sử dụng hoặc hết hạn
- [ ] Ghi log khi OTP được sử dụng

**File cần sửa:** `backend/firebase_functions.ino`

---

### 2. WiFi Status Sync

**Vấn đề:** Frontend hiển thị SSID, IP của ESP nhưng đang dùng mock data, chưa lấy từ ESP thực tế.

**Cần làm:**

- [ ] Backend: Upload WiFi info lên Firebase (`/devices/wifi`)
  ```
  /devices/wifi/ssid: "TenMang"
  /devices/wifi/ip: "192.168.1.100"
  /devices/wifi/rssi: -65
  ```
- [ ] Frontend: Lắng nghe và hiển thị thông tin WiFi thực

**File cần sửa:**

- `backend/firebase_functions.ino` - thêm upload WiFi info
- `frontend/js/app.js` - thêm listener cho WiFi status

---

### 3. Scan Networks từ ESP

**Vấn đề:** Frontend có nút "Quét mạng có sẵn" nhưng đang dùng danh sách giả lập, không scan từ ESP thực.

**Cần làm:**

- [ ] Backend: Thêm API `/scan` để WiFi.scanNetworks()
- [ ] Backend: Trả về JSON danh sách mạng (ssid, rssi, secure)
- [ ] Frontend: Gọi API scan qua IP local của ESP (không qua Firebase)
- [ ] Hoặc: Upload kết quả scan lên Firebase để Frontend đọc

**Khó khăn:** Frontend deploy trên cloud không thể gọi API local của ESP trực tiếp (CORS, network). Giải pháp: scan khi ESP khởi động → upload lên Firebase.

---

## 🟡 CHỨC NĂNG UI CÓ NHƯNG BACKEND CHƯA HỖ TRỢ

### 1. Thay đổi WiFi từ Frontend

| UI                                      | Backend                 |
| --------------------------------------- | ----------------------- |
| ✅ Form chọn mạng + nhập password       | ❌ Chưa đọc từ Firebase |
| ✅ Gửi credentials lên `/commands/wifi` | ❌ Chưa xử lý           |

**Cần làm:**

- [ ] Backend: Đọc `/commands/wifi` khi có thay đổi
- [ ] Backend: Kết nối đến mạng mới
- [ ] Backend: Lưu credentials mới vào WiFiManager
- [ ] Backend: Feedback kết quả (thành công/thất bại)

---

### 2. Reset WiFi từ Frontend

| UI                        | Backend                             |
| ------------------------- | ----------------------------------- |
| ❌ Chưa có nút Reset WiFi | ✅ Web Server local có `/resetwifi` |

**Cần làm:**

- [ ] Frontend: Thêm nút "Reset WiFi" trong phần Cài đặt WiFi
- [ ] Frontend: Gửi command `/commands/action: "resetwifi"`
- [ ] Backend: Xử lý command resetwifi từ Firebase

---

### 3. History Page

| UI                        | Backend                              |
| ------------------------- | ------------------------------------ |
| ✅ Có file `history.html` | ✅ Backend đã push logs lên Firebase |

**Cần làm:**

- [ ] Frontend: Hoàn thiện giao diện trang History
- [ ] Frontend: Query và hiển thị logs từ `/logs`
- [ ] Frontend: Phân trang, lọc theo ngày/loại sự kiện
- [ ] Frontend: Export logs (CSV/JSON)

---

## 🟢 NÂNG CẤP TƯƠNG LAI

### 1. Bảo mật

- [ ] Thêm Authentication cho Firebase (Email/Password hoặc Anonymous)
- [ ] Mã hóa mật khẩu WiFi khi lưu/truyền
- [ ] Rate limiting cho API commands
- [ ] Thêm 2FA (xác thực 2 yếu tố) cho mở cửa từ xa

### 2. Thông báo

- [ ] Push notification khi có người mở cửa
- [ ] Email alert khi lockout
- [ ] Telegram/Zalo bot thông báo

### 3. Nâng cao

- [ ] OTA Update firmware qua WiFi
- [ ] NTP đồng bộ thời gian thực
- [ ] Lịch mở cửa tự động (schedule)
- [ ] Nhiều user với quyền khác nhau
- [ ] Camera tích hợp (ESP32-CAM)

---

## 📋 DANH SÁCH TASK THEO ĐỘ ƯU TIÊN

| #   | Task                     | Độ khó     | Ưu tiên       | Estimate |
| --- | ------------------------ | ---------- | ------------- | -------- |
| 1   | OTP Verification Backend | Trung bình | 🔴 Cao        | 2-3h     |
| 2   | WiFi Status Sync         | Dễ         | 🔴 Cao        | 1h       |
| 3   | Reset WiFi từ Frontend   | Dễ         | 🟡 Trung bình | 30m      |
| 4   | Change WiFi từ Frontend  | Trung bình | 🟡 Trung bình | 2h       |
| 5   | Scan Networks thực       | Khó        | 🟡 Trung bình | 3h       |
| 6   | History Page             | Trung bình | 🟢 Thấp       | 3h       |
| 7   | Push Notifications       | Khó        | 🟢 Thấp       | 4h+      |

---

## 📁 FILES CẦN CẬP NHẬT

### Backend

```
backend/
├── firebase_functions.ino  ← Thêm OTP verify, WiFi status upload, change WiFi
└── wifi_functions.ino      ← Thêm scan networks, change WiFi handler
```

### Frontend

```
frontend/
├── js/app.js              ← Thêm WiFi status listener, reset WiFi button
├── index.html             ← Thêm nút Reset WiFi
└── history.html           ← Hoàn thiện giao diện và logic
```

---

## ✅ ĐÃ HOÀN THÀNH GẦN ĐÂY

- [x] WiFi Module non-blocking (2026-01-27)
- [x] Web Server local với giao diện đẹp (2026-01-27)
- [x] Firebase Realtime Database integration (2026-01-28)
- [x] Reset WiFi từ Web Server local (2026-01-28)
- [x] Tạo OTP từ Frontend (2026-01-28)
- [x] Voice Control (2026-01-28)
