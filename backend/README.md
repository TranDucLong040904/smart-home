# Backend - Smart Home

Folder chứa firmware cho các mạch điều khiển.

## 📂 Cấu trúc

```
backend/
├── README.md              ← File này
└── esp32_cp2102/          ← Mạch ESP32 với chip CP2102 (Active)
    ├── esp32_cp2102.ino   ← File firmware chính
    ├── config.h
    ├── firebase_config.h
    ├── wifi_config.h
    ├── firebase_functions.ino
    ├── wifi_functions.ino
    └── README.md          ← Hướng dẫn chi tiết cho mạch này
```

## 🔌 Các mạch hiện có

| Folder          | Mạch         | Trạng thái | Mô tả                     |
| --------------- | ------------ | ---------- | ------------------------- |
| `esp32_cp2102/` | ESP32 CP2102 | ✅ Active  | Mạch điều khiển cửa chính |

## ➕ Thêm mạch mới

Khi cần thêm mạch điều khiển mới:

1. Tạo folder mới: `backend/[tên_mạch]/`
2. Tạo file `.ino` **cùng tên** với folder (yêu cầu của Arduino IDE)
3. Copy các file config cần thiết
4. Cập nhật bảng "Các mạch hiện có" ở trên

**Ví dụ:**

```
backend/
├── esp32_cp2102/          ← Mạch cũ
└── esp32_c3_mini/         ← Mạch mới
    └── esp32_c3_mini.ino
```

## 📦 Backup

Folder `backend_old/` (nằm ngoài) chứa bản backup firmware cũ để rollback khi cần.

---

_Cập nhật: 2026-02-07_
