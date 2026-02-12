# Sơ đồ chân ESP32 (CP2102) – Smart Door

**Board:** ESP32 38-pin (CP2102, ESP32-D0WD-V3)  
**Mục tiêu:** Giữ nguyên tính năng cũ, loại bỏ chia sẻ chân, đấu dây gọn, dễ nạp code.

## Chân khuyến nghị

| Nhóm            | Linh kiện      | Chân linh kiện | ESP32 Pin | Ghi chú |
| --------------- | -------------- | -------------- | --------- | ------- |
| **LCD I2C**     | SDA            | SDA            | G21       | I2C SDA |
|                 | SCL            | SCL            | G22       | I2C SCL |
| **Keypad 4x4**  | Row 0          | L1             | G16       | Output |
|                 | Row 1          | L2             | G17       | Output |
|                 | Row 2          | L3             | G18       | Output |
|                 | Row 3          | L4             | G19       | Output |
|                 | Col 0          | R1             | G25       | Input (pull-up nội) |
|                 | Col 1          | R2             | G26       | Input (pull-up nội) |
|                 | Col 2          | R3             | G27       | Input (pull-up nội) |
|                 | Col 3          | R4             | G23       | Input (pull-up nội) |
| **Servo SG90**  | Signal         | Cam (Signal)   | G5        | PWM ổn định |
| **Buzzer**      | I/O            | Signal         | G33       | Không chia sẻ với servo |
| **Nút trong nhà** | 1            | NO/COM         | G32       | Kéo xuống GND, dùng pull-up nội |
|                 | 2              | GND            | GND       | GND chung |

## Kết nối chi tiết

### LCD I2C 16x2 (địa chỉ 0x27 hoặc 0x3F)
- GND → GND
- VCC → 5V (giữ pull-up I2C ở mức 3.3V nếu module có jumper; nếu không, LCD vẫn chấp nhận 3.3V logic do open-drain)
- SDA → G21
- SCL → G22

### Keypad 4x4
- Rows (Output từ ESP32):
  - L1 → G16
  - L2 → G17
  - L3 → G18
  - L4 → G19
- Columns (Input về ESP32):
  - R1 → G25
  - R2 → G26
  - R3 → G27
  - R4 → G23
- Bật `INPUT_PULLUP` cho các chân cột trong code. Không cần điện trở ngoài, tránh dây chéo lung tung.

### Servo SG90
- Signal (Cam) → G5
- VCC (Đỏ) → 5V riêng (adapter ≥2A nếu dùng chung với buzzer)
- GND (Nâu) → GND chung với ESP32
- Khuyến nghị: tụ ≥470µF sát servo, dây ngắn để giảm nhiễu.

### Buzzer (module hoặc piezo có transistor càng tốt)
- Signal → G33
- VCC → 5V (hoặc 3.3V tùy module)
- GND → GND chung
- Không chia sẻ với servo, không cần detach servo khi beep.

### Nút trong nhà
- Một chân nút → G32
- Chân còn lại → GND
- Cấu hình `INPUT_PULLUP` trong code; nhấn nút sẽ kéo xuống GND.

## Lý do chọn chân
- Tránh toàn bộ nhóm boot-strap nhạy cảm (G0, G2, G4, G5, G12, G15) cho keypad; chỉ dùng G5 cho servo (ổn cho PWM, không bị ảnh hưởng boot vì đã có pull-up mặc định).
- Không dùng TX/RX, không dùng chân chia sẻ như trước, bỏ hoàn toàn time-multiplexing servo/buzzer và keypad/nút.
- Dùng cụm 16/17/18/19 (liên tiếp) cho Rows và 25/26/27/23 cho Cols để đi dây gọn, dễ nhớ.
- I2C cố định 21/22 là chuẩn trên ESP32 38-pin.

## Checklist trước khi cấp nguồn
- Kiểm tra GND chung giữa ESP32, servo, buzzer, LCD, keypad.
- VCC servo/buzzer lấy từ nguồn 5V riêng, không kéo từ 3.3V của ESP32.
- LCD: nếu không hiển thị, thử đổi địa chỉ 0x27 ↔ 0x3F.
- Dây servo/buzzer ngắn, tụ 470µF gần servo.
- Keypad: xác nhận không cắm nhầm hàng/cột; dây không vắt qua nguồn/anten Wi-Fi.

---

Hoàn tất đấu dây xong mới chuyển bước cập nhật mapping trong config.h và code.