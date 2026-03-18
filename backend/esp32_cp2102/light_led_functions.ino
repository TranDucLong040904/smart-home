/*
 * LIGHT_LED_FUNCTIONS.INO - WS2813 light control module
 * Smart Door Project
 *
 * Tách riêng logic đèn để dễ quản lý và mở rộng.
 */

#include <Adafruit_NeoPixel.h>
#include "config.h"

/* ================= LIGHT MODULE VARIABLES ================= */
Adafruit_NeoPixel lightStrip(LIGHT_LED_COUNT, LIGHT_LED_PIN, NEO_GRB + NEO_KHZ800);

bool lightOn = false;
uint8_t lightR = 255;
uint8_t lightG = 255;
uint8_t lightB = 255;

int lastLightButtonState = HIGH;
unsigned long lastLightButtonPress = 0;
#define LIGHT_BUTTON_DEBOUNCE_MS 200UL

/* ================= LIGHT MODULE HELPERS ================= */
void applyLightState() {
  uint32_t color = lightOn ? lightStrip.Color(lightR, lightG, lightB)
                           : lightStrip.Color(0, 0, 0);

  for (uint16_t i = 0; i < LIGHT_LED_COUNT; i++) {
    lightStrip.setPixelColor(i, color);
  }
  lightStrip.show();
}

void setLightColor(uint8_t r, uint8_t g, uint8_t b) {
  lightR = r;
  lightG = g;
  lightB = b;
  applyLightState();
}

void setLightOn(bool on) {
  lightOn = on;
  applyLightState();
}

void setLightState(bool on, uint8_t r, uint8_t g, uint8_t b) {
  lightOn = on;
  lightR = r;
  lightG = g;
  lightB = b;
  applyLightState();
}

void toggleLight() { setLightOn(!lightOn); }

bool isLightOn() { return lightOn; }
uint8_t getLightR() { return lightR; }
uint8_t getLightG() { return lightG; }
uint8_t getLightB() { return lightB; }

String getLightStateJson() {
  String json = "\"light\":{";
  json += "\"on\":";
  json += lightOn ? "true" : "false";
  json += ",\"r\":";
  json += lightR;
  json += ",\"g\":";
  json += lightG;
  json += ",\"b\":";
  json += lightB;
  json += "}";
  return json;
}

/* ================= LIGHT MODULE PUBLIC API ================= */
void initLightModule() {
  pinMode(LIGHT_BUTTON_PIN, INPUT_PULLUP);

  lightStrip.begin();
  lightStrip.clear();
  lightStrip.show();

  lightOn = false;
  lightR = 255;
  lightG = 255;
  lightB = 255;

  Serial.println("Light module initialized");
}

void handleLightButton() {
  int buttonState = digitalRead(LIGHT_BUTTON_PIN);

  if (buttonState == LOW && lastLightButtonState == HIGH &&
      (millis() - lastLightButtonPress > LIGHT_BUTTON_DEBOUNCE_MS)) {
    lastLightButtonPress = millis();
    toggleLight();
    Serial.println(lightOn ? ">>> LIGHT BUTTON -> ON <<<" : ">>> LIGHT BUTTON -> OFF <<<");
  }

  lastLightButtonState = buttonState;
}

void handleLightModule() { handleLightButton(); }
