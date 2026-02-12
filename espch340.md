# 📑 HỒ SƠ KỸ THUẬT: ESP32 30-PIN (CH340)

## 1. Thông số Phần cứng (Xác thực thực tế)
Hồ sơ được trích xuất từ Serial Monitor cho mạch ESP32 30 chân:

* **Chip Model**: ESP32-D0WD-V3 (Dual Core - 2 nhân)
* **Silicon Revision**: v3.1 (Thế hệ chip mới nhất, ổn định)
* **Dung lượng Flash**: 4 MB
* **Địa chỉ MAC WiFi**: `14:33:5C:54:11:AC`
* **Chip nạp USB-to-Serial**: CH340 (Giá rẻ, phổ thông)
* **Số lượng chân**: 30 chân (Kích thước nhỏ gọn, phù hợp cắm Breadboard)

## 2. Lưu ý Đặc biệt cho Mạch 30-Pin & Core 3.3.6
Dòng mạch này có một số điểm khác biệt về cách vận hành so với bản 38 chân:

* **Driver CH340**: Cần cài đặt driver CH340 để máy tính nhận diện. Nếu không thấy cổng COM, hãy kiểm tra lại driver này thay vì driver CP210x của mạch cũ.
* **Lỗi nạp Code (Connecting...)**: Mạch 30 chân thường không có mạch tự động reset tốt như bản CP2102. 
    * **Bắt buộc**: Nhấn giữ nút **BOOT** khi IDE hiện `Connecting...` cho đến khi thấy tiến trình nạp chạy.
* **Khai báo thư viện (Core 3.3.6)**: 
    * Luôn phải có `#include "esp_mac.h"` nếu muốn lấy địa chỉ MAC.
    * Luôn phải có `#include "esp_chip_info.h"` để kiểm tra thông tin hệ thống.
* **Nguồn điện**: Vì có ít chân GND và 5V/3.3V hơn, khi chạy tác vụ nặng (Spam WiFi), hãy đảm bảo nguồn cấp ổn định để tránh mạch bị khởi động lại (Reset liên tục).

## 3. Cấu hình Arduino IDE
* **Board**: ESP32 Dev Module
* **Upload Speed**: Nên để **115200** hoặc tối đa **460800** (Chip CH340 đôi khi bị lỗi ở tốc độ 921600).
* **Partition Scheme**: Huge APP (3MB No OTA/1MB SPIFFS) cho các dự án lớn.

---
**Ghi chú cho AI hỗ trợ:** Đây là mạch 30 chân sử dụng chip ESP32-V3. Cần lưu ý thứ tự chân GPIO vì nó hẹp hơn bản 38 chân, tránh nhầm lẫn sơ đồ chân khi điều khiển linh kiện ngoại vi.

```
ESP32 (30 PIN)
      (Đầu Anten Wifi)
       +-----------+
    EN | [ ]   [ ] | D23
    VP | [ ]   [ ] | D22
    VN | [ ]   [ ] | TX0
   D34 | [ ]   [ ] | RX0
   D35 | [ ]   [ ] | D21
   D32 | [ ]   [ ] | D19
   D33 | [ ]   [ ] | D18
   D25 | [ ]   [ ] | D5
   D26 | [ ]   [ ] | D17
   D27 | [ ]   [ ] | D16
   D14 | [ ]   [ ] | D4
   D12 | [ ]   [ ] | D2
   D13 | [ ]   [ ] | D15
   GND | [ ]   [ ] | GND
   VIN | [ ]   [ ] | 3V3
       +-----------+
           |USB|
```