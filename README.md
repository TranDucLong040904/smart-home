<div align="right">
  <a href="README.md"><img src="https://img.shields.io/badge/English-blue?style=flat-square&logo=github&logoColor=white&labelColor=000080" alt="English"></a>
  <a href="README.vi"><img src="https://img.shields.io/badge/Tiếng_Việt-red?style=flat-square&color=C90000" alt="Tiếng Việt"></a>
</div>

# Smart Door System - ESP32 + Firebase + Web Dashboard

<div align="center">

![ESP32](https://img.shields.io/badge/ESP32-CP2102-111111?style=for-the-badge&logo=espressif&logoColor=white)
![Arduino](https://img.shields.io/badge/Arduino-IDE-00979D?style=for-the-badge&logo=arduino&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Frontend](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-0A66C2?style=for-the-badge&logo=googlechrome&logoColor=white)

![Repo](https://img.shields.io/badge/Project-Smart%20Home-2E7D32?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20ESP32-blue?style=flat-square)

</div>

---
<a id="introduction"></a>
## Introduction

This project is a complete smart door solution built around ESP32 CP2102. It combines local hardware control (keypad, LCD, servo, buzzer), cloud sync (Firebase Realtime Database), and a web dashboard (login, control, history, admin, settings).

### Core highlights
- PIN authentication on keypad with lockout after failed attempts.
- Admin/user account sync between ESP32 and Firebase.
- One-time OTP flow with expiration and usage tracking.
- Door control from both local server and cloud web app.
- WS2813 smart light control with real-time RGB sync.
- Voice commands on web app: open/close door, turn on/off light.
- Stability-oriented backend tuning for online operation.

---
<a id="table-of-contents"></a>
## Table of Contents

- [Introduction](#introduction)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Endpoints (ESP32 Local)](#api-endpoints-esp32-local)
- [Firebase Data Flow](#firebase-data-flow)
- [Testing Checklist](#testing-checklist)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---
<a id="system-architecture"></a>
## System Architecture

```text
Keypad/LCD/Servo/Buzzer/Light
          |
          v
    ESP32 Firmware (modular .ino)
      |                 |
      | Local HTTP      | Cloud Sync
      v                 v
  Browser (LAN)     Firebase RTDB
                          |
                          v
                  Web Dashboard (Frontend)
```

---
<a id="technology-stack"></a>
## Technology Stack

### Firmware
- ESP32 CP2102
- Arduino C++
- WiFiManager
- Firebase ESP Client
- LiquidCrystal_I2C, Keypad, ESP32Servo

### Cloud
- Firebase Realtime Database
- Firebase Authentication (web login)

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Web Speech API (voice commands)

---
<a id="key-features"></a>
## Key Features

### Hardware and firmware
- Keypad authentication with admin-only password change rule.
- Door lockout countdown on LCD after 3 wrong attempts.
- Servo open/close control with indoor button support.
- Buzzer feedback patterns for key press/success/fail/lockout.
- LCD I2C status screens for each state.

### Cloud integration
- Realtime command handling: door and light.
- Device status upload: door, lock, WiFi, light RGB.
- OTP sync and usage mark-back.
- Account sync for admin/users.
- Event logging with actor/auth/source fields.

### Smart light (WS2813)
- ON/OFF and RGB control.
- Hardware button toggle.
- Local HTTP endpoints and cloud commands.
- Frontend color picker with realtime sync.

### Web app
- Login page with Firebase Auth.
- Main dashboard for door, light, OTP, voice.
- History page and admin management page.
- Settings page with theme and account password update.
- WiFi card on settings is display-only (scan/connect removed).

### Reliability improvements
- One network task per main loop cycle (avoid stacked blocking).
- Batched status write via JSON.
- Faster network timeout strategy.
- LCD I2C conservative timing for better display stability.

---
<a id="project-structure"></a>
## Project Structure

```text
smart home/
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
│   ├── css/
│   └── js/
├── docs/
│   ├── FEATURES.md
│   ├── firebase_schema.json
│   ├── firebase_accounts_patch.json
│   └── firebase_link.txt
├── PROJECT_STRUCTURE.md
├── README.md
└── README.vi
```

---
<a id="getting-started"></a>
## Getting Started

### 1) Hardware requirements
- ESP32 CP2102
- 4x4 keypad
- LCD 16x2 I2C
- Servo motor (recommended separate 5V supply)
- Buzzer
- WS2813 LED strip
- Stable power and common GND wiring

### 2) Flash firmware
```bash
# Open in Arduino IDE
backend/esp32_cp2102/esp32_cp2102.ino

# Select board and COM, then Upload
```

### 3) Launch web frontend
- Configure Firebase in `frontend/js/firebase-config.js`.
- Open `frontend/login.html` to authenticate.
- Navigate to `frontend/index.html` for dashboard control.

---
<a id="configuration"></a>
## Configuration

Update these files before deployment:
- `backend/esp32_cp2102/config.h`
- `backend/esp32_cp2102/wifi_config.h`
- `backend/esp32_cp2102/firebase_config.h`
- `frontend/js/firebase-config.js`

Recommended checks:
- Firebase database URL and credentials
- Device ID paths in Firebase
- Pin mapping for your actual wiring

---
<a id="api-endpoints-esp32-local"></a>
## API Endpoints (ESP32 Local)

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Local control page |
| `/open` | GET | Open door |
| `/close` | GET | Close door |
| `/status` | GET | Device status JSON |
| `/resetwifi` | GET | Clear WiFi and restart config mode |
| `/light/on` | GET | Turn light on |
| `/light/off` | GET | Turn light off |
| `/light/toggle` | GET | Toggle light |
| `/light/set?r=&g=&b=` | GET | Set RGB color |

---
<a id="firebase-data-flow"></a>
## Firebase Data Flow

- ESP32 writes device states under `devices/...`
- Frontend writes commands under `commands/...`
- ESP32 polls commands and executes actions
- ESP32 pushes event logs to `history/logs`
- Accounts and OTP sync through `config/...` and `otp/...`

See [docs/firebase_schema.json](docs/firebase_schema.json) for schema details.

---
<a id="testing-checklist"></a>
## Testing Checklist

1. Flash firmware and verify boot logs.
2. Test keypad input speed and buzzer feedback.
3. Test wrong PIN lockout countdown on LCD.
4. Test cloud open/close and local open/close.
5. Test light ON/OFF/RGB from frontend.
6. Test voice commands for door and light.
7. Keep device online for 5-10 minutes and observe stability.
8. Verify history entries in Firebase.

---
<a id="roadmap"></a>
## Roadmap

- [ ] Add watchdog and recovery metrics dashboard.
- [ ] Add integration tests for Firebase command flow.
- [ ] Add optional MQTT transport layer.
- [ ] Add richer history filtering and export.
- [ ] Improve hardware diagnostics screen.

---
<a id="contributing"></a>
## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused commits.
4. Open a pull request with test notes.

---
<a id="license"></a>
## License

This project is currently maintained for educational and project demonstration purposes.
Please align reuse and distribution with your team or institution policy.
