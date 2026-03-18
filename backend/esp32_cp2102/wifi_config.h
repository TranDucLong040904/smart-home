/*
 * WIFI_CONFIG.H - Cấu hình WiFi Manager
 * Smart Door Project
 * Date: 2026-01-28
 *
 * File này chứa các khai báo biến cho WiFi
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
extern bool wifiConnected;
extern bool wifiConfigMode;
extern unsigned long lastWiFiCheck;

// Declare external variables from backend.ino
extern bool doorOpen;
extern bool locked;
extern void openDoor();
extern void closeDoor();

extern void setupWebServer();
extern void handleWebServer();

#endif // WIFI_CONFIG_H
