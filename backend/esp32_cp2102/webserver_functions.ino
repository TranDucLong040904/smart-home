/*
 * WEBSERVER_FUNCTIONS.INO - HTTP Web Server module
 * Smart Door Project
 *
 * Chứa toàn bộ code web server để tách khỏi WiFi manager và file main.
 */

#include <WebServer.h>
#include "wifi_config.h"

/* ================= EXTERNAL LIGHT API ================= */
extern void setLightOn(bool on);
extern void toggleLight();
extern void setLightColor(uint8_t r, uint8_t g, uint8_t b);
extern String getLightStateJson();

/* ================= WEBSERVER VARIABLES ================= */
WebServer server(80);

/* ================= HTML PAGE ================= */
const char WEB_HTML_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Smart Door + Light Control</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg1: #0b132b;
      --bg2: #1c2541;
      --panel: rgba(255,255,255,0.1);
      --ok: #22c55e;
      --warn: #f59e0b;
      --danger: #ef4444;
      --light: #facc15;
    }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: radial-gradient(circle at top left, var(--bg2), var(--bg1));
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      color: #fff;
    }
    .container {
      width: 100%;
      max-width: 420px;
      background: var(--panel);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.25);
      backdrop-filter: blur(6px);
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 14px;
    }
    .section {
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .title {
      margin-bottom: 8px;
      font-weight: 700;
    }
    .row {
      display: flex;
      gap: 8px;
      margin: 8px 0;
    }
    button {
      flex: 1;
      border: none;
      border-radius: 10px;
      padding: 12px;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
    }
    .open { background: var(--ok); }
    .close { background: var(--warn); }
    .light { background: var(--light); color: #111827; }
    .danger { background: var(--danger); }
    .status {
      line-height: 1.5;
      font-size: 14px;
      opacity: 0.95;
      margin-top: 8px;
    }
    .color-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    input[type='range'] {
      width: 100%;
    }
  </style>
</head>
<body>
  <div class='container'>
    <h1>Smart Door + Light</h1>

    <div class='section'>
      <div class='title'>Door</div>
      <div class='row'>
        <button class='open' onclick='doorAction("open")'>Open</button>
        <button class='close' onclick='doorAction("close")'>Close</button>
      </div>
    </div>

    <div class='section'>
      <div class='title'>Light (WS2813)</div>
      <div class='row'>
        <button class='light' onclick='lightAction("on")'>Light ON</button>
        <button class='close' onclick='lightAction("off")'>Light OFF</button>
      </div>
      <div class='row'>
        <button class='open' onclick='lightAction("toggle")'>Toggle</button>
      </div>
      <div class='color-row'><span>R</span><input id='r' type='range' min='0' max='255' value='255'></div>
      <div class='color-row'><span>G</span><input id='g' type='range' min='0' max='255' value='255'></div>
      <div class='color-row'><span>B</span><input id='b' type='range' min='0' max='255' value='255'></div>
      <div class='row'>
        <button class='light' onclick='setColor()'>Apply Color</button>
      </div>
    </div>

    <div class='section'>
      <div class='title'>Device</div>
      <button class='danger' onclick='resetWiFi()'>Reset WiFi</button>
      <div class='status' id='status'>Loading...</div>
    </div>
  </div>

  <script>
    async function doorAction(action) {
      await fetch('/' + action);
      refreshStatus();
    }

    async function lightAction(action) {
      await fetch('/light/' + action);
      refreshStatus();
    }

    async function setColor() {
      const r = document.getElementById('r').value;
      const g = document.getElementById('g').value;
      const b = document.getElementById('b').value;
      await fetch('/light/set?r=' + r + '&g=' + g + '&b=' + b);
      refreshStatus();
    }

    function resetWiFi() {
      if (confirm('Reset WiFi and restart device?')) {
        fetch('/resetwifi');
      }
    }

    async function refreshStatus() {
      const data = await fetch('/status').then(r => r.json());
      document.getElementById('status').innerHTML =
        'Door: ' + data.door.toUpperCase() + '<br>' +
        'Locked: ' + data.locked + '<br>' +
        'Light: ' + (data.light.on ? 'ON' : 'OFF') +
        ' (' + data.light.r + ',' + data.light.g + ',' + data.light.b + ')' + '<br>' +
        'WiFi: ' + data.wifi;
    }

    setInterval(refreshStatus, 2000);
    refreshStatus();
  </script>
</body>
</html>
)rawliteral";

/* ================= ROUTE HANDLERS ================= */
void handleRoot() { server.send_P(200, "text/html", WEB_HTML_PAGE); }

void handleOpen() {
  Serial.println(">>> WEB: Open Door <<<");
  if (!doorOpen && !locked) {
    openDoor();
  }
  server.send(200, "text/plain", "Door opened");
}

void handleClose() {
  Serial.println(">>> WEB: Close Door <<<");
  if (doorOpen) {
    closeDoor();
  }
  server.send(200, "text/plain", "Door closed");
}

void handleLightOn() {
  setLightOn(true);
  server.send(200, "text/plain", "Light on");
}

void handleLightOff() {
  setLightOn(false);
  server.send(200, "text/plain", "Light off");
}

void handleLightToggle() {
  toggleLight();
  server.send(200, "text/plain", "Light toggled");
}

uint8_t parseColorArg(const char *name, uint8_t fallback) {
  if (!server.hasArg(name)) {
    return fallback;
  }
  int value = server.arg(name).toInt();
  if (value < 0) {
    value = 0;
  }
  if (value > 255) {
    value = 255;
  }
  return (uint8_t)value;
}

void handleLightSet() {
  uint8_t r = parseColorArg("r", 255);
  uint8_t g = parseColorArg("g", 255);
  uint8_t b = parseColorArg("b", 255);

  setLightColor(r, g, b);
  setLightOn(true);
  server.send(200, "text/plain", "Light color updated");
}

void handleStatus() {
  String json = "{\"door\":\"";
  json += doorOpen ? "open" : "closed";
  json += "\",\"locked\":";
  json += locked ? "true" : "false";
  json += ",";
  json += getLightStateJson();
  json += ",\"wifi\":\"connected\"}";
  server.send(200, "application/json", json);
}

void handleResetWiFi() {
  Serial.println(">>> WEB: Reset WiFi <<<");
  server.send(200, "text/plain", "WiFi reset - Restarting...");
  delay(1000);

  wifiManager.resetSettings();
  ESP.restart();
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

/* ================= WEB SERVER API ================= */
void setupWebServer() {
  server.on("/", HTTP_GET, handleRoot);

  server.on("/open", HTTP_GET, handleOpen);
  server.on("/close", HTTP_GET, handleClose);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/resetwifi", HTTP_GET, handleResetWiFi);

  server.on("/light/on", HTTP_GET, handleLightOn);
  server.on("/light/off", HTTP_GET, handleLightOff);
  server.on("/light/toggle", HTTP_GET, handleLightToggle);
  server.on("/light/set", HTTP_GET, handleLightSet);

  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("Web Server started on port 80");
}

void handleWebServer() { server.handleClient(); }
