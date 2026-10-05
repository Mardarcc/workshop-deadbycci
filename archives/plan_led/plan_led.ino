// plan_led.ino — Plan du campus à LEDs (Arduino Uno / Nano / Mega)
// Ruban WS2812B piloté par le Raspberry Pi via USB (série 115200 bauds).
//
// Commandes reçues (une par ligne) :
//   ROOM <n> <OFF|OK|WARN|ALERT|SOLVED>   état d'une salle
//   ALL <etat>                            toutes les salles
//   BRIGHT <0-255>                        luminosité globale
//   PING                                  -> répond PONG
// Messages envoyés :
//   READY | PONG | OK | ERR <msg> | BTN <n> <0|1> | LDR <0-1023>
//
// Librairie requise : Adafruit NeoPixel (gestionnaire de bibliothèques).

#include <Adafruit_NeoPixel.h>

// ---------- À ADAPTER ----------
#define PIN_LEDS   6
#define NUM_LEDS   20
#define PIN_LDR    A0
const uint8_t BTN_PINS[] = {2, 3, 4, 5};

struct Room { uint8_t first; uint8_t count; };
// Index de la 1re LED de chaque salle + nombre de LEDs (dans l'ordre du ruban)
const Room ROOMS[] = {
  {0, 3},   // 0 Accueil
  {3, 2},   // 1 CDI
  {5, 3},   // 2 Salle info 1
  {8, 3},   // 3 Salle info 2
  {11, 4},  // 4 Cafétéria
  {15, 3},  // 5 Amphi
  {18, 2},  // 6 Administration
};
// --------------------------------

const uint8_t NUM_BTNS  = sizeof(BTN_PINS);
const uint8_t NUM_ROOMS = sizeof(ROOMS) / sizeof(ROOMS[0]);
const unsigned long LINK_TIMEOUT = 6000;   // ms sans message du Pi = liaison perdue

enum State : uint8_t { S_OFF, S_OK, S_WARN, S_ALERT, S_SOLVED };
const char* const STATE_NAMES[] = {"OFF", "OK", "WARN", "ALERT", "SOLVED"};

Adafruit_NeoPixel strip(NUM_LEDS, PIN_LEDS, NEO_GRB + NEO_KHZ800);
State roomState[NUM_ROOMS];

char buf[40];
uint8_t bufLen = 0;
unsigned long lastRx = 0, lastFrame = 0, lastLdr = 0;
int lastLdrVal = -100;
bool btnState[NUM_BTNS];
unsigned long btnChanged[NUM_BTNS];

// Onde triangle 0..255 de période p (ms)
uint8_t pulse(unsigned long t, unsigned long p) {
  unsigned long x = t % p;
  return (x < p / 2) ? (x * 510UL / p) : (510UL - x * 510UL / p);
}

uint32_t colorFor(State s, unsigned long t) {
  switch (s) {
    case S_OK:     return strip.Color(40, 40, 40);                       // blanc doux
    case S_WARN: { uint8_t v = 40 + pulse(t, 1500) * 215UL / 255;        // orange qui respire
                   return strip.Color(v, v * 2 / 5, 0); }
    case S_ALERT:  return ((t / 300) % 2) ? strip.Color(255, 0, 0) : 0;  // rouge clignotant
    case S_SOLVED: return strip.Color(0, 200, 0);                        // vert fixe
    default:       return 0;
  }
}

void render(unsigned long t) {
  bool lost = (t - lastRx) > LINK_TIMEOUT;
  for (uint8_t r = 0; r < NUM_ROOMS; r++) {
    uint32_t c = lost ? strip.Color(0, 0, pulse(t, 2000) / 3) : colorFor(roomState[r], t);
    for (uint8_t i = 0; i < ROOMS[r].count; i++) strip.setPixelColor(ROOMS[r].first + i, c);
  }
  strip.show();
}

int parseState(const char* s) {
  if (!s) return -1;
  for (uint8_t i = 0; i < 5; i++) if (strcasecmp(s, STATE_NAMES[i]) == 0) return i;
  return -1;
}

void handleLine(char* line) {
  char* cmd = strtok(line, " ");
  if (!cmd) return;
  char* a1 = strtok(NULL, " ");
  char* a2 = strtok(NULL, " ");

  if (strcasecmp(cmd, "PING") == 0) { Serial.println(F("PONG")); return; }

  if (strcasecmp(cmd, "ROOM") == 0) {
    int st = parseState(a2);
    if (!a1 || st < 0) { Serial.println(F("ERR syntaxe ROOM")); return; }
    int n = atoi(a1);
    if (n < 0 || n >= NUM_ROOMS) { Serial.println(F("ERR salle inconnue")); return; }
    roomState[n] = (State)st;
    Serial.println(F("OK"));
    return;
  }
  if (strcasecmp(cmd, "ALL") == 0) {
    int st = parseState(a1);
    if (st < 0) { Serial.println(F("ERR etat inconnu")); return; }
    for (uint8_t r = 0; r < NUM_ROOMS; r++) roomState[r] = (State)st;
    Serial.println(F("OK"));
    return;
  }
  if (strcasecmp(cmd, "BRIGHT") == 0 && a1) {
    strip.setBrightness(constrain(atoi(a1), 0, 255));
    Serial.println(F("OK"));
    return;
  }
  Serial.println(F("ERR commande inconnue"));
}

void readSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    lastRx = millis();
    if (c == '\r') continue;
    if (c == '\n') {
      buf[bufLen] = '\0';
      if (bufLen) handleLine(buf);
      bufLen = 0;
    } else if (bufLen < sizeof(buf) - 1) {
      buf[bufLen++] = c;
    }
  }
}

void readButtons(unsigned long t) {
  for (uint8_t i = 0; i < NUM_BTNS; i++) {
    bool pressed = digitalRead(BTN_PINS[i]) == LOW;   // INPUT_PULLUP : appuyé = LOW
    if (pressed != btnState[i] && t - btnChanged[i] > 30) {  // anti-rebond 30 ms
      btnState[i] = pressed;
      btnChanged[i] = t;
      Serial.print(F("BTN ")); Serial.print(i); Serial.print(' '); Serial.println(pressed ? 1 : 0);
    }
  }
}

void readLdr(unsigned long t) {
  if (t - lastLdr < 200) return;
  lastLdr = t;
  int v = analogRead(PIN_LDR);
  if (abs(v - lastLdrVal) > 20) {          // n'envoie que les variations nettes
    lastLdrVal = v;
    Serial.print(F("LDR ")); Serial.println(v);
  }
}

void setup() {
  Serial.begin(115200);
  for (uint8_t i = 0; i < NUM_BTNS; i++) pinMode(BTN_PINS[i], INPUT_PULLUP);
  strip.begin();
  strip.setBrightness(80);   // ~1/3 : limite le courant consommé
  // Animation de démarrage : chenillard pour vérifier le câblage
  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    strip.clear(); strip.setPixelColor(i, strip.Color(0, 80, 255)); strip.show(); delay(40);
  }
  strip.clear(); strip.show();
  lastRx = millis();
  Serial.println(F("READY"));
}

void loop() {
  unsigned long t = millis();
  readSerial();
  readButtons(t);
  readLdr(t);
  if (t - lastFrame >= 20) { lastFrame = t; render(t); }   // ~50 images/s
}
