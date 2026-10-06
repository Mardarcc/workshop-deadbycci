// console.ino - console du QG Black-out
// Carte : Arduino UNO R4 WiFi + 7 Modulino (Qwiic) + shield Grove du Sensor Kit
// Bibliotheques : Modulino, Arduino_SensorKit (la matrice LED est fournie avec la carte R4)
//
// Liaison serie USB 115200 bauds avec le Raspberry Pi, une commande par ligne.
//
// Arduino -> Pi
//   READY                 au demarrage
//   KNOB <n>              valeur brute de la molette (a chaque changement)
//   KNOBPRESS             appui sur la molette
//   BTN <0|1|2>           appui sur un bouton Modulino
//   VALID                 appui sur le bouton Grove (D4)
//   TEMP <x.x>            temperature Modulino Thermo (toutes les secondes)
//   DIST <mm>             distance Modulino Distance (a chaque changement > 5 mm)
//   POT <0-1023>          potentiometre Grove (A0)
//   LIGHT <0-1023>        capteur de lumiere Grove (A3)
//   TILT                  console penchee de plus de 30 degres
//   PONG                  reponse a PING
//   ERR <message>         commande non comprise
//
// Pi -> Arduino
//   PING
//   LED <0-7> <ON|OFF|OK|KO>   une LED du Modulino Pixels (blanc / eteint / vert / rouge)
//   LEDS OFF                   eteint les 8 LEDs
//   MORSE <MOT> | MORSE STOP   joue un mot en morse en boucle sur le buzzer Grove
//   OLED <ligne 0-7> <texte>   ecrit une ligne sur l'ecran OLED (16 caracteres max)
//   OLEDCLR                    efface l'ecran OLED
//   ERRORS <0-3>               nombre d'erreurs (affiche sur la matrice LED de la R4)
//   BEEP <OK|KO>               son de reussite ou d'erreur (Modulino Buzzer)
//   GLED <ON|OFF>              LED Grove (D6)

#include <Modulino.h>
#include <Arduino_SensorKit.h>
#include "Arduino_LED_Matrix.h"

// ---------- Broches Grove ----------
const int PIN_POT   = A0;
const int PIN_LIGHT = A3;
const int PIN_VALID = 4;
const int PIN_BUZZ  = 5;
const int PIN_GLED  = 6;

// ---------- Modules ----------
ModulinoButtons  buttons;
ModulinoBuzzer   buzzer;
ModulinoPixels   leds;
ModulinoKnob     knob;
ModulinoDistance distance;
ModulinoMovement movement;
ModulinoThermo   thermo;
ArduinoLEDMatrix matrix;

// ---------- Lecture serie ----------
char buf[64];
uint8_t bufLen = 0;

// ---------- Etat des capteurs ----------
int lastKnob = 32767;
bool lastKnobPressed = false;
bool lastBtn[3] = {false, false, false};
bool lastValid = false;
unsigned long validChanged = 0;
int lastDist = -100;
int lastPot = -100;
int lastLight = -100;
unsigned long tTemp = 0, tPot = 0, tLight = 0, tTilt = 0;
int tiltCount = 0;
bool tiltSent = false;

// ---------- Morse ----------
const char* const MORSE[26] = {
  ".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---", "-.-", ".-..", "--",
  "-.", "---", ".--.", "--.-", ".-.", "...", "-", "..-", "...-", ".--", "-..-", "-.--", "--.."
};
const unsigned long DOT = 150, DASH = 450, SYMBOL_GAP = 150, LETTER_GAP = 1000, WORD_GAP = 5000;
char morseWord[17] = "";
bool morseOn = false, morseTone = false;
int mLetter = 0, mSymbol = 0;
unsigned long mNext = 0;

const char* morseCode(char c) {
  if (c >= 'A' && c <= 'Z') return MORSE[c - 'A'];
  return nullptr;
}

void morseStart(const char* word) {
  strncpy(morseWord, word, 16);
  morseWord[16] = '\0';
  for (char* p = morseWord; *p; p++) *p = toupper(*p);
  mLetter = 0; mSymbol = 0; morseTone = false;
  mNext = millis();
  morseOn = morseWord[0] != '\0';
}

void morseStop() {
  morseOn = false;
  morseTone = false;
  noTone(PIN_BUZZ);
}

void morseTick(unsigned long t) {
  if (!morseOn || t < mNext) return;
  const char* code = morseCode(morseWord[mLetter]);
  if (morseTone) {                       // fin d'un bip
    noTone(PIN_BUZZ);
    morseTone = false;
    mSymbol++;
    if (code == nullptr || code[mSymbol] == '\0') {   // lettre terminee
      mLetter++;
      mSymbol = 0;
      if (morseWord[mLetter] == '\0') { mLetter = 0; mNext = t + WORD_GAP; }
      else mNext = t + LETTER_GAP;
    } else {
      mNext = t + SYMBOL_GAP;
    }
    return;
  }
  if (code == nullptr) {                 // caractere ignore (espace, chiffre...)
    mLetter++;
    if (morseWord[mLetter] == '\0') mLetter = 0;
    mNext = t + LETTER_GAP;
    return;
  }
  tone(PIN_BUZZ, 700);
  morseTone = true;
  mNext = t + (code[mSymbol] == '-' ? DASH : DOT);
}

// ---------- Affichages ----------
void showErrors(int n) {                 // 3 barres sur la matrice 12x8 de la R4
  uint8_t frame[8][12] = {0};
  for (int e = 0; e < 3; e++) {
    if (e >= n) continue;
    for (int r = 1; r < 7; r++)
      for (int c = e * 4; c < e * 4 + 3; c++) frame[r][c] = 1;
  }
  matrix.renderBitmap(frame, 8, 12);
}

void setLed(int i, const char* mode) {
  if (i < 0 || i > 7) return;
  if (strcmp(mode, "ON") == 0)      leds.set(i, WHITE, 20);
  else if (strcmp(mode, "OK") == 0) leds.set(i, GREEN, 25);
  else if (strcmp(mode, "KO") == 0) leds.set(i, RED, 25);
  else                              leds.set(i, WHITE, 0);
  leds.show();
}

void beep(bool ok) {
  if (ok) buzzer.tone(1200, 120);
  else    buzzer.tone(200, 400);
}

// ---------- Commandes recues ----------
void handleLine(char* line) {
  // "OLED <n> <texte>" : on garde le texte entier, espaces compris
  if (strncmp(line, "OLED ", 5) == 0) {
    int row = atoi(line + 5);
    char* text = strchr(line + 5, ' ');
    Oled.setCursor(0, constrain(row, 0, 7));
    Oled.print("                ");      // efface la ligne (16 caracteres)
    Oled.setCursor(0, constrain(row, 0, 7));
    if (text) Oled.print(text + 1);
    return;
  }

  char* cmd = strtok(line, " ");
  if (!cmd) return;
  char* a1 = strtok(NULL, " ");
  char* a2 = strtok(NULL, " ");

  if (strcmp(cmd, "PING") == 0)         Serial.println("PONG");
  else if (strcmp(cmd, "LED") == 0 && a1 && a2) setLed(atoi(a1), a2);
  else if (strcmp(cmd, "LEDS") == 0)    { for (int i = 0; i < 8; i++) leds.set(i, WHITE, 0); leds.show(); }
  else if (strcmp(cmd, "MORSE") == 0 && a1) {
    if (strcmp(a1, "STOP") == 0) morseStop(); else morseStart(a1);
  }
  else if (strcmp(cmd, "OLEDCLR") == 0) Oled.clear();
  else if (strcmp(cmd, "ERRORS") == 0 && a1) showErrors(atoi(a1));
  else if (strcmp(cmd, "BEEP") == 0 && a1) beep(strcmp(a1, "OK") == 0);
  else if (strcmp(cmd, "GLED") == 0 && a1) digitalWrite(PIN_GLED, strcmp(a1, "ON") == 0 ? HIGH : LOW);
  else { Serial.print("ERR commande inconnue : "); Serial.println(cmd); }
}

void readSerial() {
  while (Serial.available()) {
    char c = Serial.read();
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

// ---------- Capteurs ----------
void readSensors(unsigned long t) {
  // Molette
  int k = knob.get();
  if (k != lastKnob) { lastKnob = k; Serial.print("KNOB "); Serial.println(k); }
  bool kp = knob.isPressed();
  if (kp && !lastKnobPressed) Serial.println("KNOBPRESS");
  lastKnobPressed = kp;

  // Boutons Modulino (front montant uniquement)
  if (buttons.update()) {
    for (int i = 0; i < 3; i++) {
      bool p = buttons.isPressed(i);
      if (p && !lastBtn[i]) { Serial.print("BTN "); Serial.println(i); }
      lastBtn[i] = p;
    }
  }

  // Bouton Grove "Valider" (anti-rebond 30 ms)
  bool v = digitalRead(PIN_VALID) == HIGH;
  if (v != lastValid && t - validChanged > 30) {
    validChanged = t;
    lastValid = v;
    if (v) Serial.println("VALID");
  }

  // Temperature, toutes les secondes
  if (t - tTemp >= 1000) {
    tTemp = t;
    Serial.print("TEMP "); Serial.println(thermo.getTemperature(), 1);
  }

  // Distance
  if (distance.available()) {
    int d = distance.get();
    if (abs(d - lastDist) > 5) { lastDist = d; Serial.print("DIST "); Serial.println(d); }
  }

  // Potentiometre et lumiere
  if (t - tPot >= 100) {
    tPot = t;
    int p = analogRead(PIN_POT);
    if (abs(p - lastPot) > 8) { lastPot = p; Serial.print("POT "); Serial.println(p); }
  }
  if (t - tLight >= 500) {
    tLight = t;
    int l = analogRead(PIN_LIGHT);
    if (abs(l - lastLight) > 20) { lastLight = l; Serial.print("LIGHT "); Serial.println(l); }
  }

  // Anti-sabotage : console penchee de plus de 30 degres pendant 0,5 s
  if (t - tTilt >= 100) {
    tTilt = t;
    movement.update();
    float x = movement.getX(), y = movement.getY(), z = movement.getZ();
    float norm = sqrt(x * x + y * y + z * z);
    bool tilted = norm > 0.5 && fabs(z) < 0.866 * norm;   // cos(30 deg) = 0,866
    tiltCount = tilted ? tiltCount + 1 : 0;
    if (tiltCount >= 5 && !tiltSent) { Serial.println("TILT"); tiltSent = true; }
    if (!tilted) tiltSent = false;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_VALID, INPUT);
  pinMode(PIN_GLED, OUTPUT);

  Modulino.begin();
  buttons.begin();
  buzzer.begin();
  leds.begin();
  knob.begin();
  distance.begin();
  movement.begin();
  thermo.begin();

  Oled.begin();
  Oled.setFlipMode(true);
  Oled.setFont(u8x8_font_chroma48medium8_r);
  Oled.clear();
  Oled.setCursor(0, 0);
  Oled.print("BLACK-OUT");

  matrix.begin();
  showErrors(0);

  for (int i = 0; i < 8; i++) leds.set(i, WHITE, 0);
  leds.show();

  Serial.println("READY");
}

void loop() {
  unsigned long t = millis();
  readSerial();
  readSensors(t);
  morseTick(t);
}
