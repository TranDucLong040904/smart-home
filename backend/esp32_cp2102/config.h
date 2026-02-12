/*
 * CONFIG.H - Cấu hình GPIO và constants cho Smart Door
 * Board: ESP32 (CP2102, 38-pin)
 * Giữ nguyên logic cũ, chỉ đổi mapping chân cho ESP32
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// GPIO PINS - LCD I2C (theo pin_mapping_esp32.md)
// ============================================
#define LCD_SDA_PIN 21   // G21 - I2C SDA
#define LCD_SCL_PIN 22   // G22 - I2C SCL
#define LCD_ADDRESS 0x27 // Địa chỉ I2C (thử 0x3F nếu không hiển thị)
#define LCD_COLS 16
#define LCD_ROWS 2

// ============================================
// GPIO PINS - KEYPAD 4x4
// ============================================
// Rows (Output - quét)
#define KEYPAD_ROW_0 16 // G16 - L1
#define KEYPAD_ROW_1 17 // G17 - L2
#define KEYPAD_ROW_2 18 // G18 - L3
#define KEYPAD_ROW_3 19 // G19 - L4

// Columns (Input - đọc, dùng pull-up nội)
#define KEYPAD_COL_0 25 // G25 - R1
#define KEYPAD_COL_1 26 // G26 - R2
#define KEYPAD_COL_2 27 // G27 - R3
#define KEYPAD_COL_3 23 // G23 - R4

// ============================================
// GPIO PINS - SERVO
// ============================================
#define SERVO_PIN 5 // G5 - PWM ổn định
#define SERVO_CLOSED_ANGLE 0
#define SERVO_OPEN_ANGLE 90
#define SERVO_OPEN_DURATION 3000 // 3 giây

// ============================================
// GPIO PINS - BUZZER
// ============================================
#define BUZZER_PIN 33 // G33 - tách riêng servo
#define BEEP_SHORT_DURATION 100
#define BEEP_LONG_DURATION 500

// ============================================
// BUTTON SETTINGS
// ============================================
#define BUTTON_B_HOLD_TIME 2000 // 2 giây
#define INDOOR_BUTTON_PIN 32    // G32 - nút trong nhà

// ============================================
// OTHER SETTINGS
// ============================================
#define MAX_INPUT_LENGTH 16 // Độ dài tối đa buffer

#endif // CONFIG_H
