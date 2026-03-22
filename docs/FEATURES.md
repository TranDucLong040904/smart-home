# Smart Door - Features (Current)

> Last updated: 2026-03-22
> Status: Core flow stable, cloud + web + smart light integrated

## 1) Backend (ESP32 CP2102)

### 1.1 Access control and keypad
- Keypad 4x4: `A` xoa, `D` enter, `C` doi mat khau (admin).
- PIN xac thuc tu EEPROM.
- Lockout 10s sau 3 lan sai.
- Countdown lockout hien thi tren LCD.
- Session auth timeout 5s.
- Phan quyen keypad: admin + user cloud.

### 1.2 Password policy
- Luu mat khau trong EEPROM.
- Mat khau toi thieu 6 ky tu.
- Chan mat khau yeu: ngay sinh, lap lai, lien tiep.
- Khong cho dat lai mat khau trung mat khau cu.

### 1.3 Door control
- Servo mo/dong cua.
- Nut trong nha toggle mo/dong.
- Debounce cho nut trong nha.
- Tu dong dong cua sau 10s voi lenh mo tu web/cloud.

### 1.4 LCD + buzzer
- LCD I2C 16x2 hien thi trang thai theo state machine.
- Buzzer giu pattern am thanh cu:
  - Bam phim: bip ngan 30ms
  - Thanh cong: Do-Mi-Sol
  - Sai mat khau: 3 bip
  - Lockout: siren ngan
  - Doi MK thanh cong: Sol-Do cao
- Bo sung on dinh:
  - Giai phong `tone()` truoc beep digital de tranh mat tieng.
  - I2C timeout + toc do bus 40kHz de giam loi ky tu LCD.

### 1.5 WiFi and local web server
- WiFiManager non-blocking.
- AP config mode khi can cai lai WiFi.
- Auto reconnect WiFi.
- Web server local tach file rieng (`webserver_functions.ino`).
- Endpoints local:
  - `/`, `/open`, `/close`, `/status`, `/resetwifi`
  - `/light/on`, `/light/off`, `/light/toggle`, `/light/set?r=&g=&b=`

### 1.6 Firebase Realtime Database
- Auth bang Legacy Database Secret.
- Dong bo trang thai cua + WiFi + den.
- Nhan lenh cloud cho cua va den.
- Dong bo OTP one-time + danh dau da dung.
- Dong bo accounts admin/user tu cloud.
- Ghi history log co actor/source/authMethod.
- Toi uu runtime (khong doi logic cu):
  - Moi vong loop chi xu ly toi da 1 tac vu mang.
  - Giam timeout network de fail-fast khi mang xau.
  - Gop nhieu field status thanh 1 request `setJSON`.
  - Doc mau den bang 1 request `getJSON`.

### 1.7 Smart light (WS2813)
- Module den tach rieng (`light_led_functions.ino`).
- Dieu khien ON/OFF/RGB.
- Nut cung toggle den (GPIO14, debounce).
- Dong bo 2 chieu qua Firebase.
- Dieu khien qua web local va frontend cloud.

## 2) Frontend (Web app)

### 2.1 Core pages
- `login.html`: dang nhap Firebase Auth.
- `index.html`: dashboard dieu khien cua, OTP, voice, smart light.
- `history.html`: lich su su kien.
- `admin.html`: quan ly tai khoan admin/user realtime.
- `settings.html`: cai dat he thong + doi mat khau + theme.

### 2.2 Door and cloud control
- Nhan/truyen trang thai realtime tu Firebase.
- Nut mo/dong cua tren web.
- Badge va thong bao trang thai ket noi.

### 2.3 Voice control
- Ho tro lenh Viet/Anh:
  - Mo cua / Dong cua
  - Bat den / Tat den

### 2.4 OTP UI
- Tao OTP 6 so.
- Chon thoi han.
- Countdown + xoa OTP.

### 2.5 Account management
- Admin duy nhat (chi sua, khong them/xoa).
- CRUD user realtime.
- Gioi han toi da 10 user.
- Chan trung username/password khi tao va sua.

### 2.6 Settings page
- Theme light/dark + luu localStorage.
- Doi mat khau account dang nhap (reauth).
- Hien thi thong tin app.
- WiFi card hien thi trang thai hien tai (display-only), da loai bo scan/connect.

### 2.7 Smart light UI
- Card dieu khien den rieng.
- Nut bat/tat nhanh.
- Color chip + popup color picker.
- Hien thi HEX + RGB realtime.
- Fix hien tuong con tro mau bi giat/reset khi dang keo.
- Responsive mobile, uu tien card voice o tren.

## 3) Current repo highlights
- Firmware da tach module ro rang: main/wifi/webserver/firebase/light/access/otp.
- Frontend da tach js/css theo tung trang.
- Tai lieu schema Firebase da cap nhat cho nhanh `light` command/state.

## 4) Notes
- Hien tai luong nghiep vu cu (xac thuc/mo khoa/lockout) duoc giu nguyen.
- Cac toi uu gan day tap trung vao do tre online, do on dinh LCD, va do ben cloud sync.
