/*
 * ACCESS_CONTROL_FUNCTIONS.INO - Keypad authorization (admin + users)
 * - 1 admin local (EEPROM), mirrored to Firebase
 * - Up to 10 users from Firebase
 * - Non-blocking sync, no impact to keypad loop
 */

#include <Arduino.h>
#include <Firebase_ESP_Client.h>
#include "firebase_config.h"

extern FirebaseData fbdo;
extern bool firebaseReady;

void savePasswordToEEPROM(const char *pass, byte len);
void logEventDetailed(const char *event, const char *message, const char *source,
                     const char *authMethod, const char *actorRole,
                     const char *actorName, const char *actorId,
                     bool success);

#define MAX_USERS 10

struct UserAccount {
  String id;
  String name;
  String password;
};

enum AccessRole : uint8_t {
  ACCESS_ROLE_NONE,
  ACCESS_ROLE_ADMIN,
  ACCESS_ROLE_USER,
  ACCESS_ROLE_OTP
};

static UserAccount userAccounts[MAX_USERS];
static byte userCount = 0;

static String adminCloudName = "Admin";
static uint64_t adminCreatedAt = 0;
static bool pendingAdminPush = true;
static bool applyingCloudAdminUpdate = false;
static unsigned long lastAdminSeedTry = 0;

static AccessRole currentAccessRole = ACCESS_ROLE_NONE;
static String currentActorName = "";
static String currentActorId = "";
static String currentAuthMethod = "";

static bool compareInputWithStored(const char *input, byte len, const char *stored) {
  if (!input || !stored)
    return false;
  size_t storedLen = strlen(stored);
  if ((size_t)len != storedLen)
    return false;
  return strncmp(input, stored, len) == 0;
}

void clearAccessSession() {
  currentAccessRole = ACCESS_ROLE_NONE;
  currentActorName = "";
  currentActorId = "";
  currentAuthMethod = "";
}

bool isCurrentSessionAdmin() { return currentAccessRole == ACCESS_ROLE_ADMIN; }

const char *getCurrentActorName() { return currentActorName.c_str(); }
const char *getCurrentActorId() { return currentActorId.c_str(); }
const char *getCurrentAuthMethod() { return currentAuthMethod.c_str(); }

const char *getCurrentRoleLabel() {
  if (currentAccessRole == ACCESS_ROLE_ADMIN)
    return "admin";
  if (currentAccessRole == ACCESS_ROLE_USER)
    return "user";
  if (currentAccessRole == ACCESS_ROLE_OTP)
    return "guest";
  return "system";
}

static void applyUsersFromJson(FirebaseJson &usersJson) {
  FirebaseJsonData field;
  size_t count = usersJson.iteratorBegin();

  userCount = 0;

  for (size_t i = 0; i < count; i++) {
    int type = 0;
    String key;
    String value;
    usersJson.iteratorGet(i, type, key, value);

    if (key.length() == 0 || key == "_placeholder")
      continue;

    FirebaseJson oneUser;
    oneUser.setJsonData(value);

    String name;
    String password;
    String id = key;

    if (oneUser.get(field, "name") && field.success) {
      name = field.to<String>();
    }
    if (oneUser.get(field, "password") && field.success) {
      password = field.to<String>();
    }
    if (oneUser.get(field, "id") && field.success) {
      String idFromCloud = field.to<String>();
      if (idFromCloud.length() > 0) {
        id = idFromCloud;
      }
    }

    if (name.length() == 0 || password.length() == 0)
      continue;
    if (userCount >= MAX_USERS)
      break;

    userAccounts[userCount].id = id;
    userAccounts[userCount].name = name;
    userAccounts[userCount].password = password;
    userCount++;
  }

  usersJson.iteratorEnd();
}

static void pushAdminToCloud(const char *updatedBy) {
  if (!Firebase.ready())
    return;

  FirebaseJson adminJson;
  adminJson.set("id", "admin_local");
  adminJson.set("name", adminCloudName);
  adminJson.set("password", savedPass);
  if (adminCreatedAt > 0) {
    adminJson.set("createdAt", (double)adminCreatedAt);
  } else {
    adminJson.set("createdAt/.sv", "timestamp");
  }
  adminJson.set("updatedBy", updatedBy);
  adminJson.set("updatedAt/.sv", "timestamp");

  String basePath = String(FB_PATH_CONFIG) + "/accounts";

  bool ok = Firebase.RTDB.setJSON(&fbdo, basePath + "/admin", &adminJson);
  if (!ok)
    return;

  Firebase.RTDB.setInt(&fbdo, basePath + "/meta/maxUsers", MAX_USERS);
  Firebase.RTDB.setInt(&fbdo, basePath + "/meta/version", 1);
  Firebase.RTDB.setInt(&fbdo, basePath + "/meta/lastSync", millis());

  pendingAdminPush = false;
}

void initAccessControl() {
  if (adminCloudName.length() == 0)
    adminCloudName = "Admin";
  adminCreatedAt = 0;
  pendingAdminPush = true;
}

void onLocalAdminPasswordChanged() {
  if (applyingCloudAdminUpdate)
    return;
  pendingAdminPush = true;
}

bool authenticatePinAndSetSession(const char *input, byte len) {
  if (compareInputWithStored(input, len, savedPass)) {
    currentAccessRole = ACCESS_ROLE_ADMIN;
    currentActorName = adminCloudName;
    currentActorId = "admin_local";
    currentAuthMethod = "ADMIN_PIN";
    return true;
  }

  String inputValue = String(input);
  for (byte i = 0; i < userCount; i++) {
    if (inputValue == userAccounts[i].password) {
      currentAccessRole = ACCESS_ROLE_USER;
      currentActorName = userAccounts[i].name;
      currentActorId = userAccounts[i].id;
      currentAuthMethod = "USER_PIN";
      return true;
    }
  }

  clearAccessSession();
  return false;
}

void setOtpSessionContext() {
  currentAccessRole = ACCESS_ROLE_OTP;
  currentActorName = "Guest OTP";
  currentActorId = "guest_otp";
  currentAuthMethod = "OTP";
}

void syncAccessControlFromCloud() {
  if (!firebaseReady || !Firebase.ready())
    return;

  String basePath = String(FB_PATH_CONFIG) + "/accounts";

  // Ưu tiên đẩy mật khẩu admin local trước để tránh cloud ghi đè ngược
  if (pendingAdminPush) {
    pushAdminToCloud("keypad");
    if (!pendingAdminPush) {
      return;
    }
  }

  // 1) Sync admin info
  if (Firebase.RTDB.getJSON(&fbdo, basePath + "/admin")) {
    FirebaseJson adminJson = fbdo.to<FirebaseJson>();
    FirebaseJsonData field;

    String cloudName = "Admin";
    String cloudPassword;

    if (adminJson.get(field, "name") && field.success) {
      String raw = field.to<String>();
      if (raw.length() > 0)
        cloudName = raw;
    }

    if (adminJson.get(field, "password") && field.success) {
      cloudPassword = field.to<String>();
    }

    if (adminJson.get(field, "createdAt") && field.success) {
      adminCreatedAt = field.to<uint64_t>();
    }

    adminCloudName = cloudName;

    if (cloudPassword.length() == 0) {
      pendingAdminPush = true;
    } else if (!pendingAdminPush && cloudPassword != String(savedPass)) {
      applyingCloudAdminUpdate = true;
      savePasswordToEEPROM(cloudPassword.c_str(), cloudPassword.length());
      applyingCloudAdminUpdate = false;

      logEventDetailed("password_changed", "Admin password updated from web",
                       "cloud", "ADMIN_SYNC", "admin", adminCloudName.c_str(),
                       "admin_local", true);
    }
  } else {
    unsigned long nowTick = millis();
    if (nowTick - lastAdminSeedTry > 3000UL) {
      lastAdminSeedTry = nowTick;
      pendingAdminPush = true;
    }
  }

  // 2) Sync users list
  if (Firebase.RTDB.getJSON(&fbdo, basePath + "/users")) {
    FirebaseJson usersJson = fbdo.to<FirebaseJson>();
    applyUsersFromJson(usersJson);
  } else {
    userCount = 0;
  }
}
