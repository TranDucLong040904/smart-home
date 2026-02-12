/*
 * CONFIG.H - Cấu hình GPIO và constants cho Smart Door
 * Board: ESP8266 Wemos D1 Mini
 * Phase 1 - Task 1: Test keypad, LCD, servo, buzzer
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// GPIO PINS - LCD I2C
// ============================================
#define LCD_SDA_PIN D2   // GPIO4 - I2C SDA
#define LCD_SCL_PIN D1   // GPIO5 - I2C SCL
#define LCD_ADDRESS 0x27 // Địa chỉ I2C (thử 0x3F nếu không hiển thị)
#define LCD_COLS 16
#define LCD_ROWS 2

// ============================================
// GPIO PINS - KEYPAD 4x4
// ============================================
// Rows (Output - quét)
#define KEYPAD_ROW_0 D5 // GPIO14 - L1 (dùng chung Servo)
#define KEYPAD_ROW_1 D6 // GPIO12 - L2
#define KEYPAD_ROW_2 D7 // GPIO13 - L3
#define KEYPAD_ROW_3 D4 // GPIO2  - L4 (dùng chung Buzzer)

// Columns (Input - đọc)
#define KEYPAD_COL_0 D0 // GPIO16 - R1
#define KEYPAD_COL_1 D3 // GPIO0  - R2 (cần pull-up 10kΩ)
#define KEYPAD_COL_2 D8 // GPIO15 - R3 (cần pull-down 10kΩ)
#define KEYPAD_COL_3 A0 // ADC    - R4 (analog hack)

// ============================================
// GPIO PINS - SERVO
// ============================================
#define SERVO_PIN D5 // GPIO14 - Dùng chung Keypad Row 0
#define SERVO_CLOSED_ANGLE 0
#define SERVO_OPEN_ANGLE 90
#define SERVO_OPEN_DURATION 3000 // 3 giây

// ============================================
// GPIO PINS - BUZZER
// ============================================
#define BUZZER_PIN D4 // GPIO2 - Dùng chung Keypad Row 3
#define BEEP_SHORT_DURATION 100
#define BEEP_LONG_DURATION 500

// ============================================
// BUTTON SETTINGS
// ============================================
#define BUTTON_B_HOLD_TIME 2000 // 2 giây

// ============================================
// OTHER SETTINGS
// ============================================
#define MAX_INPUT_LENGTH 16 // Độ dài tối đa buffer

#endif // CONFIG_H
