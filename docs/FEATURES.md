# Smart Door - Tính năng đã hoàn thành

> **Cập nhật lần cuối:** 2026-01-29  
> **Trạng thái:** ~90% hoàn thành

---

## 🔧 PHẦN CỨNG (Backend - ESP8266 Wemos D1 Mini)

### 1. Keypad & Xác thực PIN

| Tính năng           | Mô tả                                                     |
| ------------------- | --------------------------------------------------------- |
| ✅ Keypad 4x4       | Nhập PIN bằng phím 0-9, A (Xóa), C (Đổi MK), D (OK/Enter) |
| ✅ Xác thực PIN     | So sánh với PIN lưu trong EEPROM                          |
| ✅ Khóa tạm 10s     | Sau 3 lần nhập sai, khóa hệ thống 10 giây                 |
| ✅ Countdown LCD    | Hiển thị đếm ngược thời gian khóa trên màn hình LCD       |
| ✅ Timeout xác thực | Phiên đăng nhập hết hạn sau 5 giây, quay về màn hình nhập |

### 2. Quản lý mật khẩu (EEPROM)

| Tính năng                  | Mô tả                                   |
| -------------------------- | --------------------------------------- |
| ✅ Lưu mật khẩu            | Lưu vào EEPROM, không mất khi tắt nguồn |
| ✅ Mật khẩu mặc định       | `123456` khi khởi tạo lần đầu           |
| ✅ Đổi mật khẩu            | Nhập MK mới → Xác nhận → Lưu EEPROM     |
| ✅ Quy tắc độ mạnh         | Tối thiểu 6 ký tự                       |
| ✅ Chặn MK yếu - Ngày sinh | Chặn ddMM, ddMMyy, ddMMyyyy             |
| ✅ Chặn MK yếu - Lặp lại   | Chặn 111111, 000000, ...                |
| ✅ Chặn MK yếu - Liên tiếp | Chặn 123456, 654321, ...                |
| ✅ Chặn MK trùng cũ        | Không cho phép đặt lại mật khẩu cũ      |

### 3. Servo & Điều khiển cửa

| Tính năng         | Mô tả                                                    |
| ----------------- | -------------------------------------------------------- |
| ✅ Mở cửa         | Servo quay đến góc 180°                                  |
| ✅ Đóng cửa       | Servo quay về góc 0°                                     |
| ✅ Giữ trạng thái | Servo giữ vị trí khi cửa đang mở                         |
| ✅ Detach/Attach  | Tự động detach khi dùng buzzer để tránh nhiễu            |
| ✅ Phím D đa năng | Cửa đang mở → bấm D đóng ngay; Cửa đóng → Enter xác thực |

### 4. Nút trong nhà (Indoor Button)

| Tính năng             | Mô tả                                  |
| --------------------- | -------------------------------------- |
| ✅ Toggle mở/đóng     | Bấm 1 lần để mở, bấm lần nữa để đóng   |
| ✅ Debounce 200ms     | Chống nhấn liên tục gây lỗi            |
| ✅ Bỏ qua khi lockout | Không hoạt động khi hệ thống đang khóa |
| ✅ Dùng chung D0      | Time-multiplexing với Keypad Column 0  |

### 5. LCD 16x2 (I2C)

| Tính năng            | Mô tả                                                   |
| -------------------- | ------------------------------------------------------- |
| ✅ Màn hình nhập PIN | "Nhap mat khau:" + hiển thị ký tự nhập                  |
| ✅ Màn hình mở khóa  | "Da mo khoa", "C: Doi MK"                               |
| ✅ Màn hình đổi MK   | "Nhap MK moi:", "Nhap lai MK"                           |
| ✅ Màn hình lockout  | "Khoa tam thoi", countdown                              |
| ✅ Thông báo lỗi     | Hiển thị lý do MK yếu (ngắn, ngày sinh, lặp, liên tiếp) |

### 6. Buzzer (Audio Feedback)

| Tính năng             | Âm thanh                                          |
| --------------------- | ------------------------------------------------- |
| ✅ Bấm phím           | Tiếng "bíp" ngắn 30ms                             |
| ✅ Mở khóa thành công | 🎵 Do-Mi-Sol (C-E-G)                              |
| ✅ Nhập sai           | 3 tiếng "bíp" liên tiếp                           |
| ✅ Lockout/Cảnh báo   | 🔊 Siren lên xuống 2 chu kỳ                       |
| ✅ Đổi MK thành công  | 🎵 Sol-Do cao (G-C)                               |
| ✅ Đóng cửa           | Tiếng "bíp" 100ms                                 |
| ✅ Time-multiplexing  | Dùng chung D8 với Servo, tự quản lý attach/detach |

### 7. WiFi Module (Non-Blocking)

| Tính năng                | Mô tả                                               |
| ------------------------ | --------------------------------------------------- |
| ✅ WiFiManager           | Captive Portal cấu hình WiFi qua AP                 |
| ✅ AP Mode               | Tên: `SmartDoor_Config`, Pass: `12345678`           |
| ✅ Non-blocking          | Keypad hoạt động bình thường trong khi WiFi kết nối |
| ✅ Config Portal Timeout | 3 phút tự động tắt portal                           |
| ✅ Connect Timeout       | 10 giây timeout khi đang kết nối                    |
| ✅ Auto-reconnect        | Tự kết nối lại khi mất sóng                         |
| ✅ Status check          | Kiểm tra trạng thái WiFi mỗi 5 giây                 |

### 8. Web Server Local (ESP8266)

| Endpoint        | Method | Chức năng                                 |
| --------------- | ------ | ----------------------------------------- |
| ✅ `/`          | GET    | Trang HTML điều khiển với giao diện đẹp   |
| ✅ `/open`      | GET    | Mở cửa                                    |
| ✅ `/close`     | GET    | Đóng cửa                                  |
| ✅ `/status`    | GET    | JSON trạng thái: door, locked, wifi       |
| ✅ `/resetwifi` | GET    | Xóa WiFi credentials, restart vào AP mode |

### 9. Firebase Realtime Database

| Tính năng               | Mô tả                                                     |
| ----------------------- | --------------------------------------------------------- |
| ✅ Database Secret Auth | Sử dụng Legacy Token (đơn giản, không cần Authentication) |
| ✅ Upload trạng thái    | Cập nhật door/locked/online mỗi 2 giây                    |
| ✅ Nhận lệnh từ cloud   | Check commands/action mỗi 500ms                           |
| ✅ Thực thi lệnh        | Mở/đóng cửa từ lệnh Firebase                              |
| ✅ Ghi log sự kiện      | Push log với server timestamp                             |
| ✅ Non-blocking         | Không ảnh hưởng hoạt động keypad                          |

---

## 💻 PHẦN MỀM (Frontend - Web App)

### 1. Giao diện tổng thể

| Tính năng             | Mô tả                                          |
| --------------------- | ---------------------------------------------- |
| ✅ Dark Glassmorphism | Thiết kế hiện đại với hiệu ứng mờ kính         |
| ✅ Responsive Design  | Tương thích desktop, tablet, mobile            |
| ✅ Header             | Logo, Navigation, Clock realtime, Status badge |
| ✅ Bottom Navigation  | Menu dưới cho mobile                           |
| ✅ Background Effects | Glow effects động                              |
| ✅ Google Fonts       | Space Grotesk, Material Symbols                |

### 2. Điều khiển cửa chính

| Tính năng        | Mô tả                                   |
| ---------------- | --------------------------------------- |
| ✅ Nút Mở Cửa    | Gửi lệnh `open` lên Firebase            |
| ✅ Nút Đóng Cửa  | Gửi lệnh `close` lên Firebase           |
| ✅ Icon realtime | Thay đổi lock/lock_open theo trạng thái |
| ✅ Status text   | Hiển thị "MỞ" (xanh) / "ĐÓNG" (đỏ)      |
| ✅ Glow effect   | Hiệu ứng phát sáng theo trạng thái      |

### 3. Điều khiển giọng nói

| Tính năng         | Mô tả                                  |
| ----------------- | -------------------------------------- |
| ✅ Web Speech API | Sử dụng SpeechRecognition              |
| ✅ Tiếng Việt     | Nhận dạng "Mở cửa", "Đóng cửa"         |
| ✅ Tiếng Anh      | Nhận dạng "Open", "Close"              |
| ✅ Status display | Hiển thị trạng thái nghe và transcript |
| ✅ Gợi ý lệnh     | Hiển thị các lệnh có thể nói           |

### 4. Tạo mã OTP cho khách (UI)

| Tính năng          | Mô tả                        |
| ------------------ | ---------------------------- |
| ✅ Chọn thời hạn   | Nhập giờ, phút, giây         |
| ✅ Generate mã     | Tạo mã 6 số ngẫu nhiên       |
| ✅ Countdown timer | Đếm ngược realtime           |
| ✅ Lưu Firebase    | Gửi OTP lên cloud để ESP đọc |
| ✅ Xóa OTP         | Nút xóa mã hiện tại          |

### 5. Cài đặt WiFi (UI)

| Tính năng                 | Mô tả                                     |
| ------------------------- | ----------------------------------------- |
| ✅ Hiển thị mạng hiện tại | SSID, IP thực từ ESP (Update realtime)    |
| ✅ Toggle password        | Hiển/ẩn mật khẩu                          |
| ✅ Quét mạng              | Nút scan với animation                    |
| ✅ Danh sách mạng         | Hiển thị SSID, signal strength, lock icon |
| ✅ Chọn mạng              | Click để chọn, hiện form nhập password    |
| ✅ Kết nối                | Gửi credentials qua Firebase              |

### 6. Firebase Integration

| Tính năng             | Mô tả                                 |
| --------------------- | ------------------------------------- |
| ✅ Realtime listeners | Lắng nghe thay đổi từ `/devices`      |
| ✅ Connection status  | Hiển thị "Đã kết nối" / "Mất kết nối" |
| ✅ Send commands      | Gửi action lên `/commands`            |
| ✅ Timestamp          | Sử dụng server timestamp              |

### 7. Notification System

| Tính năng              | Mô tả                                                         |
| ---------------------- | ------------------------------------------------------------- |
| ✅ Toast notifications | Popup góc phải dưới                                           |
| ✅ 4 loại              | success (xanh), error (đỏ), warning (vàng), info (xanh dương) |
| ✅ Icon động           | Icon tương ứng với loại thông báo                             |
| ✅ Animation           | Slide-in/slide-out                                            |
| ✅ Auto-dismiss        | Tự đóng sau 3 giây                                            |

### 8. Clock

| Tính năng          | Mô tả                             |
| ------------------ | --------------------------------- |
| ✅ Realtime clock  | Cập nhật mỗi giây                 |
| ✅ Format Việt Nam | Giờ:Phút:Giây, Thứ ngày/tháng/năm |

### 9. Quản lý tài khoản (UI demo)

| Tính năng                | Mô tả                                                           |
| ------------------------ | --------------------------------------------------------------- |
| ✅ Bảng Admin/User (UI)  | Danh sách, thêm/sửa/xóa trên giao diện, show/hide mật khẩu demo |
| ⚠️ Lưu trữ tạm thời      | Dữ liệu mock trên client; reload trang sẽ quay lại dữ liệu mẫu  |
| ⚠️ Chưa kết nối Firebase | Chưa đọc/ghi Firestore/Realtime DB, chưa áp dụng Auth/Rules     |

### 10. Đăng nhập & Bảo mật (Firebase Auth)

| Tính năng              | Mô tả                                            |
| ---------------------- | ------------------------------------------------ |
| ✅ Trang đăng nhập     | Giao diện glassmorphism đẹp, responsive          |
| ✅ Firebase Auth       | Xác thực Email/Password                          |
| ✅ Bảo vệ trang        | Redirect về login nếu chưa đăng nhập             |
| ✅ Session persistence | Nhớ đăng nhập, không cần login lại mỗi lần vào   |
| ✅ Show/hide password  | Toggle hiển thị mật khẩu                         |
| ✅ Error handling      | Thông báo lỗi khi sai email/password             |
| ✅ Loading state       | Hiển thị spinner khi đang đăng nhập              |
| ✅ Security Rules      | Chỉ user đã đăng nhập mới truy cập được Firebase |

### 11. Trang Cài Đặt

| Tính năng            | Mô tả                                      |
| -------------------- | ------------------------------------------ |
| ✅ Trang Settings    | Trang riêng cho cấu hình hệ thống          |
| ✅ Cài đặt WiFi      | Chuyển từ trang Điều khiển sang Settings   |
| ✅ Dark/Light mode   | Toggle giao diện tối/sáng với localStorage |
| ✅ Light theme       | Giao diện trắng - xanh da trời trẻ trung   |
| ✅ Theme persistence | Lưu lựa chọn theme vào localStorage        |
| ✅ Thông tin user    | Hiển thị email đang đăng nhập              |
| ✅ Đổi mật khẩu      | Form đổi MK với validation đầy đủ          |
| ✅ Re-authentication | Xác thực lại trước khi đổi MK              |
| ✅ Nút đăng xuất     | Logout khỏi Firebase Auth                  |
| ✅ Thông tin app     | Version, Developer, Year                   |

---

## 📊 Thống kê

| Hạng mục                  | Số tính năng      |
| ------------------------- | ----------------- |
| Phần cứng - Keypad        | 5                 |
| Phần cứng - EEPROM        | 8                 |
| Phần cứng - Servo         | 5                 |
| Phần cứng - Indoor Button | 4                 |
| Phần cứng - LCD           | 5                 |
| Phần cứng - Buzzer        | 7                 |
| Phần cứng - WiFi          | 7                 |
| Phần cứng - Web Server    | 5                 |
| Phần cứng - Firebase      | 6                 |
| **Tổng phần cứng**        | **52**            |
| Phần mềm - UI             | 6                 |
| Phần mềm - Door Control   | 5                 |
| Phần mềm - Voice          | 5                 |
| Phần mềm - OTP            | 5                 |
| Phần mềm - WiFi UI        | 6                 |
| Phần mềm - Firebase       | 4                 |
| Phần mềm - Notification   | 5                 |
| Phần mềm - Clock          | 2                 |
| Phần mềm - Login & Auth   | 8                 |
| Phần mềm - Settings Page  | 10                |
| **Tổng phần mềm**         | **56**            |
| **TỔNG CỘNG**             | **108 tính năng** |

---

## 📝 Lịch sử cập nhật

| Ngày       | Nội dung                                                           |
| ---------- | ------------------------------------------------------------------ |
| 2026-01-25 | Tạo FEATURES.md; thêm nút trong nhà toggle, D đóng khi cửa đang mở |
| 2026-01-27 | Thêm WiFi Module non-blocking, Web Server local                    |
| 2026-01-28 | Tích hợp Firebase Realtime Database, Reset WiFi                    |
| 2026-01-29 | Cập nhật đầy đủ 90 tính năng phần cứng + phần mềm                  |
| 2026-02-02 | Thêm tính năng Đăng nhập & Bảo mật với Firebase Auth (8 tính năng) |
| 2026-02-02 | Thêm trang Cài Đặt với WiFi, Dark mode UI, Logout, Đổi MK          |
| 2026-02-02 | Hoàn thiện Light mode với theme trắng - xanh da trời               |
| 2026-02-02 | Tinh chỉnh Date Picker light-mode (màu sáng + shadow)              |
