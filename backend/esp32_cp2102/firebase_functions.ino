/*
 * FIREBASE_FUNCTIONS.INO - Firebase Realtime Database functions
 * Smart Door Project
 * Date: 2026-01-28
 *
 * Sử dụng Database Secret (Legacy Token) - đơn giản, không cần Authentication
 * File này được Arduino IDE tự động gộp vào backend.ino khi compile
 *
 * QUAN TRỌNG: Tất cả hàm đều NON-BLOCKING để không ảnh hưởng keypad
 */

#include "firebase_config.h"
#include <Firebase_ESP_Client.h>

// Provide the RTDB payload printing info
#include <addons/RTDBHelper.h>

/* ================= EXTERNAL LIGHT API ================= */
extern bool isLightOn();
extern uint8_t getLightR();
extern uint8_t getLightG();
extern uint8_t getLightB();
extern void setLightOn(bool on);
extern void setLightState(bool on, uint8_t r, uint8_t g, uint8_t b);
extern void toggleLight();

/* ================= FIREBASE OBJECTS ================= */
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

/* ================= FIREBASE VARIABLES ================= */
bool firebaseReady = false;
unsigned long lastFirebaseUpdate = 0;
unsigned long lastCommandCheck = 0;
unsigned long lastOtpCheck = 0;
unsigned long lastAccountsCheck = 0;
#define FIREBASE_UPDATE_INTERVAL 3000UL // Status 3s để giảm tải
#define COMMAND_CHECK_INTERVAL 1000UL   // Lệnh mỗi 1s
#define OTP_SYNC_INTERVAL 3000UL        // OTP mỗi 3s (non-critical)
#define ACCOUNTS_SYNC_INTERVAL 5000UL   // Accounts mỗi 5s

/* ================= SETUP FIREBASE ================= */
void setupFirebase() {
  if (!wifiConnected) {
    Serial.println("Firebase: WiFi not connected, skipping setup");
    return;
  }

  Serial.println("\n=== Firebase Setup ===");

  // Configure Firebase với Database Secret (Legacy Token)
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_DATABASE_SECRET;

  // Timeout ngắn để tránh block lâu khi mạng kém (API v4.x)
  config.timeout.serverResponse = 2000;    // 2s
  config.timeout.socketConnection = 5000;  // 5s

  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Set timeout nhỏ để tránh block lâu
  fbdo.setBSSLBufferSize(1024, 1024);
  fbdo.setResponseSize(1024);

  Serial.println("Firebase initialized with Database Secret!");
  firebaseReady = true;

  // Update device online status
  updateDeviceStatus();
}

/* ================= HANDLE FIREBASE (NON-BLOCKING) ================= */
void handleFirebase() {
  if (!wifiConnected || !firebaseReady)
    return;

  unsigned long now = millis();

  // Check for commands from cloud
  if (now - lastCommandCheck >= COMMAND_CHECK_INTERVAL) {
    lastCommandCheck = now;
    checkCloudCommand();
  }

  // OTP sync tách riêng, chu kỳ dài hơn
  if (now - lastOtpCheck >= OTP_SYNC_INTERVAL) {
    lastOtpCheck = now;
    syncOtpFromCloud();
  }

  // Accounts sync (admin + users)
  if (now - lastAccountsCheck >= ACCOUNTS_SYNC_INTERVAL) {
    lastAccountsCheck = now;
    syncAccessControlFromCloud();
  }

  // Update device status to cloud
  if (now - lastFirebaseUpdate >= FIREBASE_UPDATE_INTERVAL) {
    lastFirebaseUpdate = now;
    updateDeviceStatus();
  }
}

/* ================= UPDATE DEVICE STATUS TO FIREBASE ================= */
void updateDeviceStatus() {
  if (!Firebase.ready())
    return;

  String path = String(FB_PATH_DEVICES);

  // Update door status
  Firebase.RTDB.setString(&fbdo, path + "/door", doorOpen ? "open" : "closed");
  Firebase.RTDB.setBool(&fbdo, path + "/locked", locked);
  Firebase.RTDB.setBool(&fbdo, path + "/online", true);
  Firebase.RTDB.setInt(&fbdo, path + "/lastUpdate", millis());

  // Update WiFi status
  Firebase.RTDB.setString(&fbdo, path + "/wifi/ssid", WiFi.SSID());
  Firebase.RTDB.setString(&fbdo, path + "/wifi/ip", WiFi.localIP().toString());
  Firebase.RTDB.setInt(&fbdo, path + "/wifi/rssi", WiFi.RSSI());

  // Update light status
  Firebase.RTDB.setBool(&fbdo, path + "/light/on", isLightOn());
  Firebase.RTDB.setInt(&fbdo, path + "/light/r", getLightR());
  Firebase.RTDB.setInt(&fbdo, path + "/light/g", getLightG());
  Firebase.RTDB.setInt(&fbdo, path + "/light/b", getLightB());
}

/* ================= CHECK CLOUD COMMANDS ================= */
void checkCloudCommand() {
  if (!Firebase.ready())
    return;

  String path = String(FB_PATH_COMMANDS) + "/action";

  if (Firebase.RTDB.getString(&fbdo, path)) {
    String command = fbdo.stringData();

    if (command == "open" && !doorOpen && !locked) {
      Serial.println(">>> FIREBASE: Open Door <<<");
      openDoor();
      scheduleAutoCloseRemote();
      // Clear command after execution
      Firebase.RTDB.setString(&fbdo, String(FB_PATH_COMMANDS) + "/action",
                              "none");
      // Log event
      logEventDetailed("door_opened", "Opened via cloud command", "cloud",
                       "CLOUD_COMMAND", "admin", "Web App", "cloud_web",
                       true);
    } else if (command == "close" && doorOpen) {
      Serial.println(">>> FIREBASE: Close Door <<<");
      closeDoor();
      Firebase.RTDB.setString(&fbdo, String(FB_PATH_COMMANDS) + "/action",
                              "none");
      logEventDetailed("door_closed", "Closed via cloud command", "cloud",
                       "CLOUD_COMMAND", "admin", "Web App", "cloud_web",
                       true);
    }
  }

  String lightPath = String(FB_PATH_COMMANDS) + "/light";
  String lightActionPath = lightPath + "/action";

  if (Firebase.RTDB.getString(&fbdo, lightActionPath)) {
    String action = fbdo.stringData();

    if (action == "on") {
      setLightOn(true);
      Firebase.RTDB.setString(&fbdo, lightActionPath, "none");
      Serial.println(">>> FIREBASE: Light ON <<<");
    } else if (action == "off") {
      setLightOn(false);
      Firebase.RTDB.setString(&fbdo, lightActionPath, "none");
      Serial.println(">>> FIREBASE: Light OFF <<<");
    } else if (action == "toggle") {
      toggleLight();
      Firebase.RTDB.setString(&fbdo, lightActionPath, "none");
      Serial.println(">>> FIREBASE: Light TOGGLE <<<");
    } else if (action == "set") {
      String colorPath = lightPath + "/color";
      int r = 255;
      int g = 255;
      int b = 255;

      if (Firebase.RTDB.getInt(&fbdo, colorPath + "/r"))
        r = fbdo.intData();
      if (Firebase.RTDB.getInt(&fbdo, colorPath + "/g"))
        g = fbdo.intData();
      if (Firebase.RTDB.getInt(&fbdo, colorPath + "/b"))
        b = fbdo.intData();

      if (r < 0)
        r = 0;
      if (r > 255)
        r = 255;
      if (g < 0)
        g = 0;
      if (g > 255)
        g = 255;
      if (b < 0)
        b = 0;
      if (b > 255)
        b = 255;

      setLightState(true, (uint8_t)r, (uint8_t)g, (uint8_t)b);
      Firebase.RTDB.setString(&fbdo, lightActionPath, "none");
      Serial.println(">>> FIREBASE: Light SET COLOR <<<");
    }
  }
}

/* ================= LOG EVENT TO FIREBASE ================= */
void logEvent(const char *event, const char *message) {
  logEventDetailed(event, message, "system", "SYSTEM", "system", "System",
                   "system", true);
}

void logEventDetailed(const char *event, const char *message, const char *source,
                     const char *authMethod, const char *actorRole,
                     const char *actorName, const char *actorId,
                     bool success) {
  if (!Firebase.ready())
    return;

  FirebaseJson json;
  json.set("event", event);
  json.set("message", message);
  json.set("timestamp/.sv", "timestamp"); // Server timestamp
  json.set("device", DEVICE_ID);
  json.set("success", success);
  json.set("source", source);
  json.set("authMethod", authMethod);
  json.set("actorRole", actorRole);
  json.set("actorName", actorName);
  json.set("actorId", actorId);

  // Push to logs (auto-generate unique ID)
  Firebase.RTDB.pushJSON(&fbdo, FB_PATH_LOGS, &json);
}

/* ================= SET DEVICE OFFLINE ================= */
void setDeviceOffline() {
  if (!Firebase.ready())
    return;
  Firebase.RTDB.setBool(&fbdo, String(FB_PATH_DEVICES) + "/online", false);
}
