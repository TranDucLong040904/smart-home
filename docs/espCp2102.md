# 📑 HỒ SƠ KỸ THUẬT & HƯỚNG DẪN LẬP TRÌNH (CP2102)

## 1. Thông số Phần cứng Định danh (Xác thực qua Serial)
Dữ liệu được trích xuất trực tiếp từ chip ESP32 38-pin (CP2102):

* **Chip Model**: ESP32-D0WD-V3 (Dual Core - 2 nhân xử lý).
* **Silicon Revision**: v3.1 (Phiên bản đã fix lỗi nạp và bảo mật đời cũ).
* **Xung nhịp CPU**: 240 MHz (Tối đa).
* **Bộ nhớ Flash**: 4 MB (Tiêu chuẩn).
* **Địa chỉ MAC WiFi**: `F4:2D:C9:71:C2:6C`.
* **Chip nạp USB-to-UART**: CP2102.
* **Driver yêu cầu**: Silicon Labs CP210x Universal Windows Driver (v11.5.0+).



## 2. Lưu ý quan trọng cho ESP32 Core 3.3.6 (Arduino IDE)
Phiên bản 3.3.6 có cấu trúc thư viện thay đổi so với các bản cũ. Cần tuân thủ các quy tắc sau:

* **Khai báo thư viện tường minh**: Các hàm hệ thống bắt buộc phải đi kèm Header:
    * `#include "esp_chip_info.h"`: Đọc thông tin model/revision chip.
    * `#include "esp_flash.h"`: Quản lý và đọc dung lượng bộ nhớ Flash.
    * `#include "esp_mac.h"`: Đọc địa chỉ MAC định danh vật lý.
* **Cấu hình Phân vùng (Partition Scheme)**: 
    * Đối với các project nặng (phát sóng WiFi, Web Server), phải chọn: **Huge APP (3MB No OTA/1MB SPIFFS)** trong menu *Tools* để không bị lỗi thiếu bộ nhớ.
* **Xung nhịp**: Ép xung lên **240MHz** trong `setup()` để đạt hiệu suất phát sóng tốt nhất.


**Ghi chú cho AI hỗ trợ:** Đây là chip Revision v3.1 cực kỳ ổn định. Hãy ưu tiên các hàm thuộc ESP-IDF tích hợp sẵn trong Core 3.x để tối ưu tốc độ xử lý đa nhân.

Sơ đồ chân

```

ESP32 (38 PIN)
       +-----------+
   3V3 | [ ]   [ ] | GND
    EN | [ ]   [ ] | G23
    SP | [ ]   [ ] | G22
    SN | [ ]   [ ] | TXD
   G34 | [ ]   [ ] | RXD
   G35 | [ ]   [ ] | G21
   G32 | [ ]   [ ] | GND
   G33 | [ ]   [ ] | G19
   G25 | [ ]   [ ] | G18
   G26 | [ ]   [ ] | G5
   G27 | [ ]   [ ] | G17
   G14 | [ ]   [ ] | G16
   G12 | [ ]   [ ] | G4
   GND | [ ]   [ ] | G0
   G13 | [ ]   [ ] | G2
   SD2 | [ ]   [ ] | G15
   SD3 | [ ]   [ ] | SD1
   CMD | [ ]   [ ] | SD0
    V5 | [ ]   [ ] | CLK
       +-----------+
           |USB|
```