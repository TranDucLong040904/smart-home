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

/* ================= FIREBASE OBJECTS ================= */
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

/* ================= FIREBASE VARIABLES ================= */
bool firebaseReady = false;
unsigned long lastFirebaseUpdate = 0;
unsigned long lastCommandCheck = 0;
#define FIREBASE_UPDATE_INTERVAL 2000UL // Update status every 2s
#define COMMAND_CHECK_INTERVAL 500UL    // Check commands every 500ms

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

  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Set timeout
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
      // Clear command after execution
      Firebase.RTDB.setString(&fbdo, String(FB_PATH_COMMANDS) + "/action",
                              "none");
      // Log event
      logEvent("door_opened", "Opened via cloud command");
    } else if (command == "close" && doorOpen) {
      Serial.println(">>> FIREBASE: Close Door <<<");
      closeDoor();
      Firebase.RTDB.setString(&fbdo, String(FB_PATH_COMMANDS) + "/action",
                              "none");
      logEvent("door_closed", "Closed via cloud command");
    }
  }
}

/* ================= LOG EVENT TO FIREBASE ================= */
void logEvent(const char *event, const char *message) {
  if (!Firebase.ready())
    return;

  FirebaseJson json;
  json.set("event", event);
  json.set("message", message);
  json.set("timestamp/.sv", "timestamp"); // Server timestamp
  json.set("device", DEVICE_ID);

  // Push to logs (auto-generate unique ID)
  Firebase.RTDB.pushJSON(&fbdo, FB_PATH_LOGS, &json);
}

/* ================= SET DEVICE OFFLINE ================= */
void setDeviceOffline() {
  if (!Firebase.ready())
    return;
  Firebase.RTDB.setBool(&fbdo, String(FB_PATH_DEVICES) + "/online", false);
}
