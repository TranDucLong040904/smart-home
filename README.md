# Smart Home Door System (ESP32 + Firebase)

He thong khoa cua thong minh su dung ESP32 CP2102, keypad, LCD, servo, buzzer, va web app dieu khien qua Firebase.

## Highlights
- Xac thuc PIN tren keypad, lockout sau 3 lan sai.
- Quan ly admin/user, dong bo cloud - thiet bi.
- OTP 6 so one-time co thoi han.
- Dieu khien cua tu web (cloud) va local web server (ESP32).
- Smart light WS2813: ON/OFF/RGB, dong bo 2 chieu.
- Voice commands tren web: mo/dong cua, bat/tat den.
- Dang nhap Firebase Auth cho frontend pages.

## Tech stack
- Firmware: Arduino C++ (ESP32).
- Cloud: Firebase Realtime Database, Firebase Auth.
- Frontend: HTML + CSS + Vanilla JavaScript.

## Repository layout
- `backend/esp32_cp2102`: firmware module cho ESP32.
- `frontend`: giao dien web (login/index/history/admin/settings).
- `docs`: schema, danh sach tinh nang, tai lieu bo sung.

Chi tiet cay file xem tai [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Firmware modules
Trong `backend/esp32_cp2102`:
- `esp32_cp2102.ino`: setup/loop va state machine chinh.
- `wifi_functions.ino`: WiFiManager non-blocking.
- `webserver_functions.ino`: endpoint local HTTP.
- `firebase_functions.ino`: dong bo cloud + nhan lenh.
- `access_control_functions.ino`: admin/user + policy.
- `otp_functions.ino`: OTP one-time flow.
- `light_led_functions.ino`: WS2813 light module.
- `config.h`, `wifi_config.h`, `firebase_config.h`: cau hinh.

## Quick start

### 1) Hardware
- ESP32 CP2102
- Keypad 4x4
- LCD I2C 16x2
- Servo (nguon rieng khuyen nghi)
- Buzzer
- WS2813 LED strip + nut dieu khien den
- Day noi + nguon on dinh, chung GND

### 2) Arduino IDE
- Cai board package ESP32.
- Mo `backend/esp32_cp2102/esp32_cp2102.ino`.
- Cai cac thu vien can thiet (theo `backend/README.md`).
- Dien thong tin WiFi/Firebase trong file config.
- Chon board/COM, build va upload.

### 3) Frontend
- Cau hinh Firebase trong `frontend/js/firebase-config.js`.
- Mo `frontend/login.html` de dang nhap.
- Sau dang nhap, vao `frontend/index.html` de dieu khien.

## Main features

### Door and access
- Nhap PIN tren keypad.
- Admin doi mat khau tren keypad.
- Lockout 10s khi sai 3 lan.
- Mo/dong cua tu web cloud va local web.

### Cloud sync
- Dong bo trang thai cua, WiFi, den.
- Nhan lenh cloud cho cua va den.
- Ghi lich su su kien co timestamp.

### Smart light
- Bat/tat nhanh.
- Dat mau RGB qua web.
- Dong bo realtime trang thai den.

### Settings and account
- Login bao ve bang Firebase Auth.
- Quan ly admin/user realtime.
- Chan trung username/password trong admin UI.
- Settings page co theme + doi mat khau.
- WiFi card tren settings la display-only (khong scan/connect).

## Runtime stability notes
Ban hien tai da co mot so toi uu de giam lag khi online:
- Han che so tac vu mang moi vong loop.
- Gop request status Firebase thanh 1 JSON write.
- Dieu chinh timeout mang theo huong fail-fast.
- Tang do on dinh LCD I2C (timeout + bus speed conservative).

## Suggested test flow after flashing
1. Online idle 3-5 phut, theo doi treo/lag.
2. Bam keypad lien tuc, kiem tra do tre va buzzer.
3. Gui lenh cloud dong thoi bam keypad.
4. Kiem tra LCD co con loi ky tu ngau nhien hay khong.

## Notes
- Du an dang toi uu theo huong: it chinh luong nghiep vu cu, de trien khai, de bao tri.
- Neu can thong tin chi tiet tinh nang, xem [docs/FEATURES.md](docs/FEATURES.md).
