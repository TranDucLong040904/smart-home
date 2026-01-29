/*
 * SMART DOOR - FULL VERSION
 *
 * Board: ESP8266 Wemos D1 Mini
 * Date: 2026-01-24
 *
 * FEATURES:
 * - State machine (4 states)
 * - EEPROM password storage
 * - Lockout after 3 fails (10s)
 * - Password rules (min 6, no birthday)
 * - Auth timeout (5s)
 * - Indoor button to close door (D0)
 * - Time-multiplexing (D8, D0)
 */

#include <EEPROM.h>

// WiFi Module (PHẢI include TRƯỚC Keypad để tránh xung đột CLOSED macro)
#include "wifi_config.h"

#include <Keypad.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

/* ================= GPIO PINS ================= */
// LCD I2C
#define LCD_SDA D2 // GPIO4
#define LCD_SCL D1 // GPIO5
#define LCD_ADDRESS 0x27

// Keypad 4x4 - Rows (Output)
#define KEYPAD_ROW_0 D6 // GPIO12 - L1
#define KEYPAD_ROW_1 D7 // GPIO13 - L2
#define KEYPAD_ROW_2 1  // GPIO1 (TX) - L3 - RÚT KHI NẠP CODE!
#define KEYPAD_ROW_3 3  // GPIO3 (RX) - L4 - RÚT KHI NẠP CODE!

// Keypad 4x4 - Columns (Input)
#define KEYPAD_COL_0 D0 // GPIO16 - R1 (DÙNG CHUNG NÚT TRONG NHÀ)
#define KEYPAD_COL_1 D3 // GPIO0  - R2
#define KEYPAD_COL_2 D4 // GPIO2  - R3
#define KEYPAD_COL_3 D5 // GPIO14 - R4

// Servo + Buzzer (dùng chung D8 - time-multiplexing)
#define SERVO_PIN D8  // GPIO15
#define BUZZER_PIN D8 // GPIO15 (dùng chung)

// Indoor button (dùng chung D0 với Keypad Col 0)
#define INDOOR_BUTTON_PIN D0 // GPIO16

/* ================= SERVO ================= */
#define SERVO_CLOSE_ANGLE 0
#define SERVO_OPEN_ANGLE 180
Servo doorServo;
bool doorOpen = false;

/* ================= LCD ================= */
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);
byte cursorCol = 0;

/* ================= KEYPAD ================= */
const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
    {'1', '2', '3', 'A'}, // A = Delete
    {'4', '5', '6', 'B'}, // B = (không dùng)
    {'7', '8', '9', 'C'}, // C = Đổi mật khẩu
    {'*', '0', '#', 'D'}  // D = OK/Enter
};

byte rowPins[ROWS] = {KEYPAD_ROW_0, KEYPAD_ROW_1, KEYPAD_ROW_2, KEYPAD_ROW_3};
byte colPins[COLS] = {KEYPAD_COL_0, KEYPAD_COL_1, KEYPAD_COL_2, KEYPAD_COL_3};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

/* ================= PASSWORD ================= */
#define MAX_PASS_LEN 16
#define MIN_PASS_LEN 6
#define EEPROM_FLAG 0xAA

char inputPass[MAX_PASS_LEN + 1];
byte inputLen = 0;

char savedPass[MAX_PASS_LEN + 1];
byte savedLen = 0;

char newPass[MAX_PASS_LEN + 1];
byte newLen = 0;

/* ================= LOCK ================= */
#define MAX_FAIL 3
#define LOCK_TIME 10000UL // 10 giây

byte failCount = 0;
bool locked = false;
unsigned long lockStartTime = 0;
unsigned long lastCountdownUpdate = 0;

/* ================= AUTH ================= */
#define AUTH_TIMEOUT 5000UL
unsigned long authTime = 0;

/* ================= STATE ================= */
enum SystemState { INPUT_PASSWORD, AUTH_SUCCESS, CHANGE_NEW, CHANGE_CONFIRM };

SystemState state = INPUT_PASSWORD;

/* ================= INDOOR BUTTON ================= */
int lastIndoorButtonState = HIGH;
unsigned long lastIndoorButtonPress = 0;
#define DEBOUNCE_DELAY 200

/* ================= BUZZER ================= */
void beep(int t = 80) {
  // Detach servo tạm thời để dùng D8 cho buzzer
  if (doorOpen)
    doorServo.detach();

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(t);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(BUZZER_PIN, INPUT);

  // Attach lại servo nếu cửa đang mở
  if (doorOpen) {
    doorServo.attach(SERVO_PIN);
    doorServo.write(SERVO_OPEN_ANGLE);
  }
}

void beepKey() { beep(30); }

void beepSuccess() {
  // Giai điệu thành công: Do-Mi-Sol (C-E-G)
  if (doorOpen)
    doorServo.detach();
  pinMode(BUZZER_PIN, OUTPUT);

  tone(BUZZER_PIN, 523); // Do (C)
  delay(150);
  tone(BUZZER_PIN, 659); // Mi (E)
  delay(150);
  tone(BUZZER_PIN, 784); // Sol (G)
  delay(300);
  noTone(BUZZER_PIN);

  pinMode(BUZZER_PIN, INPUT);
  if (doorOpen) {
    doorServo.attach(SERVO_PIN);
    doorServo.write(SERVO_OPEN_ANGLE);
  }
}

void beepFail() {
  for (int i = 0; i < 3; i++) {
    beep(100);
    delay(80);
  }
}

void beepLock() {
  // Siren ngắn để tránh block countdown quá lâu
  doorServo.detach();
  pinMode(BUZZER_PIN, OUTPUT);

  const byte cycles = 2;    // Giảm còn 2 chu kỳ
  const int stepDelay = 25; // Nhanh hơn để kết thúc sớm

  for (byte cycle = 0; cycle < cycles; cycle++) {
    for (int freq = 600; freq <= 1800; freq += 40) {
      tone(BUZZER_PIN, freq);
      delay(stepDelay);
    }
    for (int freq = 1800; freq >= 600; freq -= 40) {
      tone(BUZZER_PIN, freq);
      delay(stepDelay);
    }
  }

  noTone(BUZZER_PIN);
  pinMode(BUZZER_PIN, INPUT);
}

void beepChangeOK() {
  // Giai điệu hoàn thành: Sol-Do cao (G-C)
  if (doorOpen)
    doorServo.detach();
  pinMode(BUZZER_PIN, OUTPUT);

  tone(BUZZER_PIN, 784); // Sol (G)
  delay(200);
  tone(BUZZER_PIN, 1047); // Do cao (C high)
  delay(400);
  noTone(BUZZER_PIN);

  pinMode(BUZZER_PIN, INPUT);
  if (doorOpen) {
    doorServo.attach(SERVO_PIN);
    doorServo.write(SERVO_OPEN_ANGLE);
  }
}

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n=== SMART DOOR - FULL VERSION ===");
  Serial.println("Board: ESP8266 Wemos D1 Mini");

  // EEPROM
  EEPROM.begin(512);

  // LCD
  lcd.init();
  lcd.backlight();

  // Servo (khởi tạo ở góc đóng, sau đó detach)
  doorServo.attach(SERVO_PIN);
  doorServo.write(SERVO_CLOSE_ANGLE);
  delay(500);
  doorServo.detach(); // Detach để tránh PWM gây nhiễu buzzer
  doorOpen = false;

  // Load password
  loadPasswordFromEEPROM();

  // Show screen
  showInputScreen();

  // WiFi Setup (non-blocking - keypad works while WiFi connects)
  setupWiFi();

  // Firebase Setup (after WiFi is initialized)
  setupFirebase();

  Serial.println("Setup complete!");
  Serial.println("Default password: 123456");
}

/* ================= LOOP ================= */
void loop() {
  // WiFi handler (non-blocking - runs independently of keypad)
  handleWiFi();

  // Firebase handler (non-blocking - sync with cloud)
  handleFirebase();

  // Khi bị khóa -> chỉ chạy đếm ngược
  if (locked) {
    handleLockTimer();
    return;
  }

  handleIndoorButton();
  handleAuthTimeout();
  handleKeypad();
}

/* ================= KEYPAD ================= */
void handleKeypad() {
  char key = keypad.getKey();
  if (!key)
    return;

  beepKey();
  Serial.print("Key: ");
  Serial.println(key);

  if (key >= '0' && key <= '9')
    handleDigit(key);
  else if (key == 'A')
    handleDeleteOrExit();
  else if (key == 'D')
    handleOK();
  else if (key == 'C')
    handleChangeRequest();
}

/* ================= DIGIT ================= */
void handleDigit(char key) {
  if (state == INPUT_PASSWORD && inputLen < MAX_PASS_LEN) {
    inputPass[inputLen++] = key;
    inputPass[inputLen] = '\0';
    lcd.print(key); // Hiển thị số (test)
    // lcd.print('*');     // Ẩn mật khẩu (bật sau khi test xong)
    cursorCol++;
  } else if (state == CHANGE_NEW && newLen < MAX_PASS_LEN) {
    newPass[newLen++] = key;
    newPass[newLen] = '\0';
    lcd.print(key);
    // lcd.print('*');
    cursorCol++;
  } else if (state == CHANGE_CONFIRM && inputLen < MAX_PASS_LEN) {
    inputPass[inputLen++] = key;
    inputPass[inputLen] = '\0';
    lcd.print(key);
    // lcd.print('*');
    cursorCol++;
  }
}

/* ================= DELETE / EXIT ================= */
void handleDeleteOrExit() {
  // Thoát đổi mật khẩu
  if ((state == CHANGE_NEW && newLen == 0) ||
      (state == CHANGE_CONFIRM && inputLen == 0)) {
    showAuthScreen();
    state = AUTH_SUCCESS;
    return;
  }

  // Delete
  if ((state == INPUT_PASSWORD || state == CHANGE_CONFIRM) && inputLen > 0) {
    inputLen--;
    inputPass[inputLen] = '\0';
    eraseLast();
  } else if (state == CHANGE_NEW && newLen > 0) {
    newLen--;
    newPass[newLen] = '\0';
    eraseLast();
  }
}

/* ================= OK ================= */
void handleOK() {
  // Nếu cửa đang mở sẵn VÀ đang ở màn hình nhập PIN -> dùng D để đóng nhanh
  if (doorOpen && state == INPUT_PASSWORD) {
    closeDoor();
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);

  if (state == INPUT_PASSWORD) {
    if (strcmp(inputPass, savedPass) == 0) {
      lcd.print("Da mo khoa");
      beepSuccess();

      openDoor(); // Mở cửa

      failCount = 0;
      state = AUTH_SUCCESS;
      authTime = millis();
      delay(800);
      showAuthScreen();
    } else {
      failCount++;
      lcd.print("Sai (");
      lcd.print(failCount);
      lcd.print("/");
      lcd.print(MAX_FAIL);
      lcd.print(")");
      beepFail();
      Serial.print("Wrong password! Fail count: ");
      Serial.println(failCount);
      delay(800);
      if (failCount >= MAX_FAIL)
        enterLock();
      else
        resetInput();
    }
  }

  else if (state == CHANGE_NEW) {
    // Kiểm tra mật khẩu mới trùng mật khẩu cũ
    if (strcmp(newPass, savedPass) == 0) {
      lcd.print("MK trung cu");
      lcd.setCursor(0, 1);
      lcd.print("Chon MK khac");
      beepFail();
      Serial.println("New password same as old password!");
      delay(1500);
      startChangePassword();
    } else {
      // Kiểm tra độ mạnh mật khẩu
      byte errorCode = checkPasswordStrength(newPass, newLen);

      if (errorCode == 0) {
        // Mật khẩu OK
        lcd.print("Nhap lai MK");
        state = CHANGE_CONFIRM;
        resetLine();
      } else {
        // Hiển thị lỗi cụ thể
        lcd.print("MK yeu:");
        lcd.setCursor(0, 1);

        if (errorCode == 1) {
          lcd.print("MK ngan (<6)");
        } else if (errorCode == 2) {
          lcd.print("Co ngay sinh");
        } else if (errorCode == 3) {
          lcd.print("MK lap lai");
        } else if (errorCode == 4) {
          lcd.print("MK lien tiep");
        }

        beepFail();
        delay(1500);
        startChangePassword();
      }
    }
  }

  else if (state == CHANGE_CONFIRM) {
    if (strcmp(inputPass, newPass) == 0) {
      savePasswordToEEPROM(newPass, newLen);
      lcd.print("Da luu MK");
      beepChangeOK();
      Serial.println("Password changed!");
      delay(1200);
      resetAll();
    } else {
      lcd.print("Khong khop");
      beepFail();
      delay(1200);
      startChangePassword();
    }
  }
}

/* ================= CHANGE ================= */
void handleChangeRequest() {
  if (state == AUTH_SUCCESS)
    startChangePassword();
}

/* ================= PASSWORD RULE ================= */
// Trả về mã lỗi: 0=OK, 1=Ngắn, 2=Ngày sinh, 3=Lặp, 4=Liên tiếp
byte checkPasswordStrength(char *pass, byte len) {
  if (len < MIN_PASS_LEN)
    return 1; // Mật khẩu ngắn
  if (isBirthdayPattern(pass, len))
    return 2; // Có ngày sinh
  if (isRepeatingPattern(pass, len))
    return 3; // Lặp lại
  if (isSequentialPattern(pass, len))
    return 4; // Liên tiếp
  return 0;   // OK
}

bool isBirthdayPattern(char *pass, byte len) {
  if (!(len == 6 || len == 8))
    return false;
  int day = (pass[0] - '0') * 10 + (pass[1] - '0');
  int month = (pass[2] - '0') * 10 + (pass[3] - '0');
  return (day >= 1 && day <= 31 && month >= 1 && month <= 12);
}

// Chặn chuỗi giống nhau: 111111, 222222, 000000
bool isRepeatingPattern(char *pass, byte len) {
  if (len < 4)
    return false; // Chỉ check nếu >= 4 ký tự

  char firstChar = pass[0];
  for (byte i = 1; i < len; i++) {
    if (pass[i] != firstChar)
      return false; // Có ký tự khác -> OK
  }
  return true; // Tất cả giống nhau -> YẾU
}

// Chặn chuỗi tăng/giảm: 123456, 654321, 012345
bool isSequentialPattern(char *pass, byte len) {
  if (len < 4)
    return false; // Chỉ check nếu >= 4 ký tự

  bool isIncreasing = true;
  bool isDecreasing = true;

  for (byte i = 1; i < len; i++) {
    int diff = pass[i] - pass[i - 1];

    if (diff != 1)
      isIncreasing = false; // Không tăng dần
    if (diff != -1)
      isDecreasing = false; // Không giảm dần

    if (!isIncreasing && !isDecreasing)
      return false; // OK
  }

  return (isIncreasing || isDecreasing); // Tăng hoặc giảm -> YẾU
}

/* ================= UI ================= */
void showInputScreen() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Nhap mat khau:");
  lcd.setCursor(0, 1);
  cursorCol = 0;
}

void showAuthScreen() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Da mo khoa");
  lcd.setCursor(0, 1);
  lcd.print("C: Doi MK");
  cursorCol = 0;
}

void startChangePassword() {
  state = CHANGE_NEW;
  newLen = inputLen = 0;
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Nhap MK moi:");
  lcd.setCursor(0, 1);
  cursorCol = 0;
}

void resetInput() {
  inputLen = 0;
  inputPass[0] = '\0';
  showInputScreen();
}

void resetAll() {
  inputLen = newLen = 0;
  inputPass[0] = newPass[0] = '\0';
  state = INPUT_PASSWORD;
  showInputScreen();
}

void eraseLast() {
  if (cursorCol == 0)
    return;
  cursorCol--;
  lcd.setCursor(cursorCol, 1);
  lcd.print(' ');
  lcd.setCursor(cursorCol, 1);
}

void resetLine() {
  lcd.setCursor(0, 1);
  lcd.print("                ");
  lcd.setCursor(0, 1);
  cursorCol = 0;
  inputLen = 0;
  inputPass[0] = '\0';
}

/* ================= EEPROM ================= */
void loadPasswordFromEEPROM() {
  if (EEPROM.read(0) != EEPROM_FLAG) {
    savePasswordToEEPROM("123456", 6);
    Serial.println("First boot - default password: 123456");
  } else {
    savedLen = EEPROM.read(1);
    if (savedLen > MAX_PASS_LEN)
      savedLen = MAX_PASS_LEN;
    for (byte i = 0; i < savedLen; i++) {
      savedPass[i] = EEPROM.read(2 + i);
    }
    savedPass[savedLen] = '\0';
    Serial.print("Loaded password from EEPROM: ");
    Serial.println(savedPass);
  }
}

void savePasswordToEEPROM(const char *pass, byte len) {
  EEPROM.write(0, EEPROM_FLAG);
  EEPROM.write(1, len);
  for (byte i = 0; i < len; i++)
    EEPROM.write(2 + i, pass[i]);
  EEPROM.commit(); // ESP8266 cần commit!
  strcpy(savedPass, pass);
  savedLen = len;
  Serial.print("Saved password to EEPROM: ");
  Serial.println(pass);
}

/* ================= LOCK + COUNTDOWN ================= */
void enterLock() {
  locked = true;
  doorServo.detach(); // Detach servo để siren hoạt động tốt

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Khoa tam thoi");
  lcd.setCursor(0, 1);
  lcd.print("Con lai: 10s"); // Hiển thị ngay

  beepLock();
  // Bắt đầu đếm sau khi siren kết thúc để LCD không bị giật
  lockStartTime = millis();
  lastCountdownUpdate = lockStartTime;
  Serial.println("LOCKED for 10 seconds!");
}

void handleLockTimer() {
  unsigned long now = millis();
  unsigned long elapsed = now - lockStartTime;

  if (elapsed >= LOCK_TIME) {
    locked = false;
    failCount = 0;
    resetAll();
    Serial.println("Unlocked!");
    return;
  }

  // Cập nhật countdown mỗi giây để giảm nhiễu
  if (now - lastCountdownUpdate >= 1000) {
    lastCountdownUpdate = now;
    unsigned long remainMs = LOCK_TIME - elapsed;
    byte remainSec = remainMs / 1000;

    lcd.setCursor(0, 1);
    lcd.print("Con lai: ");
    if (remainSec < 10)
      lcd.print('0');
    lcd.print(remainSec);
    lcd.print("s ");
  }
}

void handleAuthTimeout() {
  if (state == AUTH_SUCCESS && millis() - authTime >= AUTH_TIMEOUT) {
    Serial.println("Auth timeout - reset to input screen");
    resetAll();
  }
}

/* ================= SERVO CONTROL ================= */
void openDoor() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Mo cua...");
  lcd.setCursor(0, 1);
  lcd.print("Nhan nut dong");

  doorServo.attach(SERVO_PIN);
  doorServo.write(SERVO_OPEN_ANGLE);
  delay(500);
  // KHÔNG DETACH - giữ servo để giữ vị trí mở
  doorOpen = true;
  Serial.println("Door OPEN - waiting for indoor button");
}

void closeDoor() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Dong cua...");

  doorServo.write(SERVO_CLOSE_ANGLE);
  delay(500);
  doorServo.detach(); // Detach để tránh PWM gây nhiễu buzzer
  doorOpen = false;

  beep(100);
  Serial.println("Door CLOSED");

  delay(1000);

  // Quay về màn hình chính
  resetAll();
}

/* ================= INDOOR BUTTON ================= */
void handleIndoorButton() {
  // BỎ QUA khi đang đổi mật khẩu (tránh xung đột với Keypad Column 0 - D0)
  if (state == CHANGE_NEW || state == CHANGE_CONFIRM) {
    return;
  }

  int buttonState = digitalRead(INDOOR_BUTTON_PIN);

  // Edge detection: HIGH → LOW (nhấn nút)
  if (buttonState == LOW && lastIndoorButtonState == HIGH &&
      (millis() - lastIndoorButtonPress > DEBOUNCE_DELAY)) {
    lastIndoorButtonPress = millis();

    if (locked) {
      Serial.println("Indoor button ignored (locked state)");
    } else if (doorOpen) {
      Serial.println(">>> INDOOR BUTTON -> CLOSE DOOR <<<");
      closeDoor();
    } else {
      Serial.println(">>> INDOOR BUTTON -> OPEN DOOR <<<");
      openDoor();
    }
  }

  lastIndoorButtonState = buttonState;
}
