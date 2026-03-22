# Project Structure - Smart Door

Cap nhat theo workspace hien tai (ESP32 CP2102).

## Overview tree

```text
smart home/
├── .git/
├── .gitignore
├── README.md
├── PROJECT_STRUCTURE.md
├── backend/
│   ├── README.md
│   └── esp32_cp2102/
│       ├── esp32_cp2102.ino
│       ├── config.h
│       ├── wifi_config.h
│       ├── wifi_functions.ino
│       ├── webserver_functions.ino
│       ├── firebase_config.h
│       ├── firebase_functions.ino
│       ├── access_control_functions.ino
│       ├── otp_functions.ino
│       ├── light_led_functions.ino
│       └── pin_mapping_esp32.md
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── admin.html
│   ├── history.html
│   ├── settings.html
│   ├── favicon.png
│   ├── css/
│   │   ├── styles.css
│   │   ├── login.css
│   │   ├── admin.css
│   │   ├── history.css
│   │   ├── settings.css
│   │   └── theme-light.css
│   └── js/
│       ├── firebase-config.js
│       ├── app.js
│       ├── login.js
│       ├── admin.js
│       ├── history.js
│       ├── settings.js
│       └── theme.js
└── docs/
    ├── FEATURES.md
    ├── firebase_schema.json
    ├── firebase_link.txt
    ├── firebase_accounts_patch.json
    ├── espCp2102.md
    ├── Báo cáo hệ nhúng.docx
    └── Báo cáo hệ nhúng Nhóm 16.pdf
```

## Folder roles

### backend/
- Chua firmware ESP32 CP2102 theo kieu module `.ino`.
- `esp32_cp2102.ino` la entry point (setup/loop).
- Cac module chinh:
  - WiFi manager: `wifi_functions.ino`
  - Local web server: `webserver_functions.ino`
  - Firebase sync/commands: `firebase_functions.ino`
  - Access control (admin/user): `access_control_functions.ino`
  - OTP flow: `otp_functions.ino`
  - Smart light WS2813: `light_led_functions.ino`

### frontend/
- Web app thuần HTML/CSS/JS.
- Moi trang co file JS/CSS rieng de de bao tri.
- `js/firebase-config.js` chua cau hinh Firebase cho frontend.

### docs/
- `FEATURES.md`: danh sach tinh nang hien co.
- `firebase_schema.json`: schema tham chieu RTDB.
- `firebase_accounts_patch.json`: patch mau cho account tree.
- `firebase_link.txt`: lien ket nhanh project Firebase.
- Tai lieu bao cao va ghi chu bo sung.

## Naming conventions
- Arduino files: `lowercase_with_underscores.ino/.h`
- Frontend pages: `lowercase.html`
- Frontend assets: tach theo `frontend/css` va `frontend/js`

## Development workflow (recommended)
1. Sua firmware trong `backend/esp32_cp2102`.
2. Test phan cung + serial monitor.
3. Test cloud sync voi frontend.
4. Cap nhat `docs/FEATURES.md` khi co thay doi tinh nang.
5. Commit theo nhom thay doi ro rang (`backend`, `frontend`, `docs`).

## Current baseline
- Platform firmware: ESP32 CP2102.
- Cloud: Firebase Realtime Database + Firebase Auth (frontend login).
- Smart light WS2813 da tich hop backend + frontend + cloud.
