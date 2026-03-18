/*
 * WIFI_FUNCTIONS.INO - WiFi Manager functions
 * Smart Door Project
 * Date: 2026-01-28
 *
 * File này được Arduino IDE tự động gộp vào backend.ino khi compile
 * Không cần #include - chỉ cần đặt trong cùng folder
 *
 * QUAN TRỌNG: Tất cả hàm đều NON-BLOCKING để không ảnh hưởng keypad
 */

/* ================= WIFI GLOBAL VARIABLES ================= */
WiFiManager wifiManager;
bool wifiConnected = false;
bool wifiConfigMode = false;
unsigned long lastWiFiCheck = 0;

/* ================= SETUP WIFI (NON-BLOCKING) ================= */
void setupWiFi() {
  Serial.println("\n=== WiFi Setup (Non-Blocking) ===");

  // Set WiFi mode
  WiFi.mode(WIFI_STA);

  // Configure WiFiManager (NON-BLOCKING - quan trọng!)
  wifiManager.setConfigPortalBlocking(false);
  wifiManager.setConnectTimeout(10);       // 10s timeout khi connecting
  wifiManager.setConfigPortalTimeout(180); // 3 phút timeout cho config portal

  // Callback khi vào config portal
  wifiManager.setAPCallback([](WiFiManager *myWiFiManager) {
    Serial.println("WiFi Config Portal started");
    Serial.print("Connect to AP: ");
    Serial.println(AP_NAME);
    wifiConfigMode = true;
  });

  // Callback khi lưu WiFi credentials
  wifiManager.setSaveConfigCallback([]() {
    Serial.println("WiFi credentials saved!");
    wifiConfigMode = false;
  });

  // Thử kết nối (non-blocking)
  if (wifiManager.autoConnect(AP_NAME, AP_PASSWORD)) {
    Serial.println("WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
    setupWebServer();
  } else {
    Serial.println("WiFi not connected - Config Portal may be active");
    Serial.println(">>> KEYPAD VAN HOAT DONG BINH THUONG <<<");
  }
}

/* ================= HANDLE WIFI (CALL IN LOOP - NON-BLOCKING) =================
 */
void handleWiFi() {
  // Process WiFiManager (cho config portal hoạt động)
  wifiManager.process();

  // Check WiFi connection status định kỳ (không block)
  unsigned long now = millis();
  if (now - lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
    lastWiFiCheck = now;

    bool currentlyConnected = (WiFi.status() == WL_CONNECTED);

    // WiFi vừa kết nối
    if (currentlyConnected && !wifiConnected) {
      Serial.println("WiFi connected!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      wifiConnected = true;
      wifiConfigMode = false;
      setupWebServer();
    }
    // WiFi vừa mất kết nối
    else if (!currentlyConnected && wifiConnected) {
      Serial.println("WiFi disconnected - Keypad still works!");
      wifiConnected = false;
    }
  }

  // Handle web server requests (nếu đang connected)
  if (wifiConnected) {
    handleWebServer();
  }
}
