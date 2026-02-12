/*
 * WIFI_CONFIG.H - Cấu hình WiFi Manager và Web Server
 * Smart Door Project
 * Date: 2026-01-28
 *
 * File này chứa các khai báo biến và HTML page cho WiFi
 * Được include vào backend.ino
 */

#ifndef WIFI_CONFIG_H
#define WIFI_CONFIG_H

// WiFi Libraries
#include <DNSServer.h>
#include <WebServer.h>
#include <WiFi.h>
#include <WiFiManager.h>


/* ================= WIFI SETTINGS ================= */
#define AP_NAME "SmartDoor_Config"
#define AP_PASSWORD "12345678"
#define WIFI_CHECK_INTERVAL 5000UL // Check WiFi every 5s

/* ================= WIFI VARIABLES ================= */
extern WiFiManager wifiManager;
extern WebServer server;
extern bool wifiConnected;
extern bool wifiConfigMode;
extern unsigned long lastWiFiCheck;

// Declare external variables from backend.ino
extern bool doorOpen;
extern bool locked;
extern void openDoor();
extern void closeDoor();

/* ================= HTML PAGE ================= */
const char HTML_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Smart Door Control</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      max-width: 350px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    h1 {
      color: #fff;
      text-align: center;
      margin-bottom: 10px;
      font-size: 24px;
    }
    .status {
      text-align: center;
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 10px;
      font-weight: bold;
    }
    .status.online { background: #10b981; color: #fff; }
    .btn {
      display: block;
      width: 100%;
      padding: 15px;
      margin: 10px 0;
      border: none;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn:active { transform: scale(0.98); }
    .btn-open {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }
    .btn-close {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
    }
    .btn-reset {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
      margin-top: 30px;
    }
    .door-icon {
      font-size: 60px;
      text-align: center;
      margin: 20px 0;
    }
    #doorState {
      text-align: center;
      color: #fff;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      color: rgba(255,255,255,0.5);
      margin-top: 20px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class='container'>
    <h1>🚪 Smart Door</h1>
    <div class='status online'>Connected</div>
    <div class='door-icon' id='doorIcon'>🔒</div>
    <div id='doorState'>Door: CLOSED</div>
    <button class='btn btn-open' onclick='doorAction("open")'>🔓 Open Door</button>
    <button class='btn btn-close' onclick='doorAction("close")'>🔒 Close Door</button>
    <button class='btn btn-reset' onclick='resetWiFi()'>📶 Reset WiFi</button>
    <div class='footer'>Smart Door v2.0 - WiFi Edition</div>
  </div>
  <script>
    function doorAction(action) {
      fetch('/' + action)
        .then(r => r.text())
        .then(d => {
          updateDoorState(action === 'open');
        })
        .catch(e => alert('Error: ' + e));
    }
    function resetWiFi() {
      if(confirm('Reset WiFi? Device will restart in AP mode for configuration.')) {
        fetch('/resetwifi').then(() => {
          alert('WiFi reset! Connect to SmartDoor_Config network.');
        });
      }
    }
    function updateDoorState(isOpen) {
      document.getElementById('doorIcon').textContent = isOpen ? '🔓' : '🔒';
      document.getElementById('doorState').textContent = 'Door: ' + (isOpen ? 'OPEN' : 'CLOSED');
    }
    // Get initial state
    fetch('/status').then(r => r.json()).then(d => updateDoorState(d.door === 'open'));
  </script>
</body>
</html>
)rawliteral";

#endif // WIFI_CONFIG_H
