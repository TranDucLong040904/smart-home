#include <Keypad.h>

#include <LiquidCrystal_I2C.h>
#include <EEPROM.h>

#include <Servo.h>


/* ================= PIN ================= */
#define BUZZER_PIN 10


/* ================= SERVO ================= */   // ===== SERVO (ADDED) =====
#define SERVO_PIN 11
#define SERVO_CLOSE_ANGLE 0
#define SERVO_OPEN_ANGLE  90
#define SERVO_OPEN_TIME   3000UL   // mo cua 3 giay

Servo doorServo;
bool servoOpening = false;
unsigned long servoOpenTime = 0;


/* ================= LCD ================= */
LiquidCrystal_I2C lcd(0x27, 16, 2);
byte cursorCol = 0;

/* ================= KEYPAD ================= */
const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  {'1','4','7','*'},
  {'2','5','8','0'},
  {'3','6','9','#'},
  {'A','B','C','D'}
};

byte rowPins[ROWS] = {2, 3, 4, 5};
byte colPins[COLS] = {6, 7, 8, 9};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

/* ================= PASSWORD ================= */
#define MAX_PASS_LEN 16
#define MIN_PASS_LEN 6
#define EEPROM_FLAG  0xAA

char inputPass[MAX_PASS_LEN + 1];
byte inputLen = 0;

char savedPass[MAX_PASS_LEN + 1];
byte savedLen = 0;

char newPass[MAX_PASS_LEN + 1];
byte newLen = 0;

/* ================= LOCK ================= */
#define MAX_FAIL 3
#define LOCK_TIME 10000UL   // 10 giay

byte failCount = 0;
bool locked = false;
unsigned long lockStartTime = 0;
unsigned long lastCountdownUpdate = 0;

/* ================= AUTH ================= */
#define AUTH_TIMEOUT 5000UL
unsigned long authTime = 0;

/* ================= STATE ================= */
enum SystemState {
  INPUT_PASSWORD,
  AUTH_SUCCESS,
  CHANGE_NEW,
  CHANGE_CONFIRM
};

SystemState state = INPUT_PASSWORD;

/* ================= BUZZER ================= */
void beep(int t = 80) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(t);
  digitalWrite(BUZZER_PIN, LOW);
}

void beepKey() {
  beep(30);
}

void beepSuccess() {
  beep(300);
}

void beepFail() {
  for (int i = 0; i < 3; i++) {
    beep(100);
    delay(80);
  }
}

void beepLock() {
  beep(400);
  delay(150);
  beep(400);
}

void beepChangeOK() {
  beep(200);
  delay(100);
  beep(200);
}

/* ================= SETUP ================= */
void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  lcd.init();
  lcd.backlight();

  loadPasswordFromEEPROM();
  showInputScreen();

  // ===== SERVO SETUP (ADDED) =====
  doorServo.attach(SERVO_PIN);
  doorServo.write(SERVO_CLOSE_ANGLE); // dong cua mac dinh
}

/* ================= LOOP ================= */
void loop() {

  /* ====== KHI BI KHOA -> CHI CHAY DEM NGUOC ====== */
  if (locked) {
    handleLockTimer();
    return;   // <<< FIX QUAN TRONG
  }

  handleServo();        // ===== SERVO (ADDED) =====
  handleAuthTimeout();
  handleKeypad();
}

/* ================= KEYPAD ================= */
void handleKeypad() {
  char key = keypad.getKey();
  if (!key) return;

  beepKey();

  if (key >= '0' && key <= '9') handleDigit(key);
  else if (key == 'A') handleDeleteOrExit();
  else if (key == 'D') handleOK();
  else if (key == 'C') handleChangeRequest();
}

/* ================= DIGIT ================= */
void handleDigit(char key) {
  if (state == INPUT_PASSWORD && inputLen < MAX_PASS_LEN) {
    inputPass[inputLen++] = key;
    inputPass[inputLen] = '\0';
    lcd.print(key);        // hien so
    // lcd.print('*');     // bat sau neu can
    cursorCol++;
  }
  else if (state == CHANGE_NEW && newLen < MAX_PASS_LEN) {
    newPass[newLen++] = key;
    newPass[newLen] = '\0';
    lcd.print(key);
    // lcd.print('*');
    cursorCol++;
  }
  else if (state == CHANGE_CONFIRM && inputLen < MAX_PASS_LEN) {
    inputPass[inputLen++] = key;
    inputPass[inputLen] = '\0';
    lcd.print(key);
    // lcd.print('*');
    cursorCol++;
  }
}

/* ================= DELETE / EXIT ================= */
void handleDeleteOrExit() {

  // Thoat doi mat khau
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
  }
  else if (state == CHANGE_NEW && newLen > 0) {
    newLen--;
    newPass[newLen] = '\0';
    eraseLast();
  }
}

/* ================= OK ================= */
void handleOK() {
  lcd.clear();
  lcd.setCursor(0, 0);

  if (state == INPUT_PASSWORD) {
    if (strcmp(inputPass, savedPass) == 0) {
      lcd.print("Da mo khoa");
      beepSuccess();

      openDoor();   // ===== SERVO (ADDED) =====

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
      delay(800);
      if (failCount >= MAX_FAIL) enterLock();
      else resetInput();
    }
  }

  else if (state == CHANGE_NEW) {
    if (!isStrongPassword(newPass, newLen)) {
      lcd.print("MK yeu");
      beepFail();
      delay(1200);
      startChangePassword();
    } else {
      lcd.print("Nhap lai MK");
      state = CHANGE_CONFIRM;
      resetLine();
    }
  }

  else if (state == CHANGE_CONFIRM) {
    if (strcmp(inputPass, newPass) == 0) {
      savePasswordToEEPROM(newPass, newLen);
      lcd.print("Da luu MK");
      beepChangeOK();
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
  if (state == AUTH_SUCCESS) startChangePassword();
}

/* ================= PASSWORD RULE ================= */
bool isStrongPassword(char* pass, byte len) {
  if (len < MIN_PASS_LEN) return false;
  if (isBirthdayPattern(pass, len)) return false;
  return true;
}

bool isBirthdayPattern(char* pass, byte len) {
  if (!(len == 6 || len == 8)) return false;
  int day   = (pass[0]-'0')*10 + (pass[1]-'0');
  int month = (pass[2]-'0')*10 + (pass[3]-'0');
  return (day >= 1 && day <= 31 && month >= 1 && month <= 12);
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
  if (cursorCol == 0) return;
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
}

/* ================= EEPROM ================= */
void loadPasswordFromEEPROM() {
  if (EEPROM.read(0) != EEPROM_FLAG) {
    savePasswordToEEPROM("123456", 6);
  } else {
    savedLen = EEPROM.read(1);
    if (savedLen > MAX_PASS_LEN) savedLen = MAX_PASS_LEN;
    for (byte i = 0; i < savedLen; i++) {
      savedPass[i] = EEPROM.read(2 + i);
    }
    savedPass[savedLen] = '\0';
  }
}

void savePasswordToEEPROM(const char* pass, byte len) {
  EEPROM.update(0, EEPROM_FLAG);
  EEPROM.update(1, len);
  for (byte i = 0; i < len; i++) EEPROM.update(2 + i, pass[i]);
  strcpy(savedPass, pass);
  savedLen = len;
}

/* ================= LOCK + COUNTDOWN ================= */
void enterLock() {
  locked = true;
  lockStartTime = millis();
  lastCountdownUpdate = 0;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Khoa tam thoi");
  beepLock();
}

void handleLockTimer() {
  unsigned long now = millis();
  unsigned long elapsed = now - lockStartTime;

  if (now - lastCountdownUpdate >= 1000) {
    lastCountdownUpdate = now;

    int remainSec = (LOCK_TIME - elapsed) / 1000;
    if (remainSec < 0) remainSec = 0;

    lcd.setCursor(0, 1);
    lcd.print("Con lai: ");
    if (remainSec < 10) lcd.print("0");
    lcd.print(remainSec);
    lcd.print("s   ");
  }

  if (elapsed >= LOCK_TIME) {
    locked = false;
    failCount = 0;
    resetAll();
  }
}

void handleAuthTimeout() {
  if (state == AUTH_SUCCESS && millis() - authTime >= AUTH_TIMEOUT) {
    resetAll();
  }
}

/* ================= SERVO CONTROL ================= */   // ===== SERVO (ADDED) =====
void openDoor() {
  doorServo.write(SERVO_OPEN_ANGLE);
  servoOpening = true;
  servoOpenTime = millis();
}

void handleServo() {
  if (servoOpening && millis() - servoOpenTime >= SERVO_OPEN_TIME) {
    doorServo.write(SERVO_CLOSE_ANGLE);
    servoOpening = false;
  }
}