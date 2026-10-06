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
//   VICTORY | VICTORY FINAL    salle reussie : LEDs arc-en-ciel + melodie (FINAL = fin de partie, plus longue)
//   DEFEAT                     partie perdue : LEDs rouges qui clignotent puis s'eteignent une a une + jingle triste

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
int currentErrors = 0;
uint8_t ledState[8] = {0};               // 0 eteinte, 1 blanche, 2 verte, 3 rouge (etat voulu par le jeu)

void showErrors(int n) {                 // 3 barres sur la matrice 12x8 de la R4
  currentErrors = n;
  uint8_t frame[8][12] = {0};
  for (int e = 0; e < 3; e++) {
    if (e >= n) continue;
    for (int r = 1; r < 7; r++)
      for (int c = e * 4; c < e * 4 + 3; c++) frame[r][c] = 1;
  }
  matrix.renderBitmap(frame, 8, 12);
}

bool defeatOn = false;                   // l'animation en cours est celle de la defaite
bool victoryOn = false;                  // pendant une animation (victoire ou defaite), les LEDs ne suivent pas le jeu

void renderLeds() {
  for (int i = 0; i < 8; i++) {
    if (ledState[i] == 1)      leds.set(i, WHITE, 20);
    else if (ledState[i] == 2) leds.set(i, GREEN, 25);
    else if (ledState[i] == 3) leds.set(i, RED, 25);
    else                       leds.set(i, WHITE, 0);
  }
  leds.show();
}

void setLed(int i, const char* mode) {
  if (i < 0 || i > 7) return;
  if (strcmp(mode, "ON") == 0)      ledState[i] = 1;
  else if (strcmp(mode, "OK") == 0) ledState[i] = 2;
  else if (strcmp(mode, "KO") == 0) ledState[i] = 3;
  else                              ledState[i] = 0;
  if (!victoryOn) renderLeds();          // sinon, l'etat sera affiche a la fin de l'animation
}

// ---------- Sequence de victoire : arc-en-ciel sur les 8 LEDs + melodie ----------
const int MELODY[]       = {523, 659, 784, 1047};                       // do mi sol do
const int MELODY_MS[]    = {120, 120, 120, 420};
const int FANFARE[]      = {392, 523, 659, 784, 659, 784, 1047, 1047};  // sol do mi sol mi sol do do
const int FANFARE_MS[]   = {140, 140, 140, 280, 140, 140, 260, 600};
const int* vNotes = MELODY;
const int* vDurations = MELODY_MS;
int vCount = 4, vNote = 0;
unsigned long vStart = 0, vNextNote = 0, vEnd = 0, vFrame = 0;

void wheel(uint8_t pos, uint8_t &r, uint8_t &g, uint8_t &b) {   // roue des couleurs 0-255
  pos = 255 - pos;
  if (pos < 85)       { r = 255 - pos * 3; g = 0;             b = pos * 3; }
  else if (pos < 170) { pos -= 85;  r = 0;             g = pos * 3;       b = 255 - pos * 3; }
  else                { pos -= 170; r = pos * 3;       g = 255 - pos * 3; b = 0; }
}

void showCheck() {                       // coche sur la matrice de la R4
  uint8_t frame[8][12] = {0};
  const uint8_t pts[][2] = {{4,2},{5,3},{6,4},{5,5},{4,6},{3,7},{2,8},{1,9}};
  for (auto &p : pts) { frame[p[0]][p[1]] = 1; frame[p[0]][p[1] + 1] = 1; }
  matrix.renderBitmap(frame, 8, 12);
}

void victoryStart(bool final) {
  vNotes = final ? FANFARE : MELODY;
  vDurations = final ? FANFARE_MS : MELODY_MS;
  vCount = final ? 8 : 4;
  vNote = 0;
  vStart = millis();
  vNextNote = vStart;
  vEnd = vStart + (final ? 5000 : 2600);
  victoryOn = true;
  defeatOn = false;
  showCheck();
}

// ---------- Sequence de defaite : alarme rouge puis black-out + jingle triste ----------
// "Wah wah wah waaah" : trois notes qui descendent, puis une derniere note qui tremble
const int DEFEAT[]    = {392, 370, 349, 330, 311, 330, 311, 330, 311, 330, 311, 330, 311, 330, 294};
const int DEFEAT_MS[] = {450, 450, 450,  90,  90,  90,  90,  90,  90,  90,  90,  90,  90,  90, 400};
const unsigned long D_ALARM = 1350;      // phase 1 : 8 LEDs rouges qui clignotent sur les 3 notes
const unsigned long D_FADE  = 1200;      // phase 2 : les LEDs s'eteignent une a une (le black-out)
const unsigned long D_TOTAL = 3400;
bool showCrossAtEnd = false;             // faux si une nouvelle partie demarre pendant l'animation

void showCross() {                       // grande croix sur la matrice de la R4
  uint8_t frame[8][12] = {0};
  for (int r = 0; r < 8; r++) {
    frame[r][2 + r] = 1;  frame[r][3 + r] = 1;      // diagonale \ (2 pixels d'epaisseur)
    frame[r][9 - r] = 1;  frame[r][8 - r] = 1;      // diagonale /
  }
  matrix.renderBitmap(frame, 8, 12);
}

void defeatStart() {
  morseStop();
  vNotes = DEFEAT;
  vDurations = DEFEAT_MS;
  vCount = 15;
  vNote = 0;
  vStart = millis();
  vNextNote = vStart;
  vEnd = vStart + D_TOTAL;
  victoryOn = true;                      // bloque l'affichage des LEDs du jeu pendant l'animation
  defeatOn = true;
  showCrossAtEnd = true;
  for (int i = 0; i < 8; i++) ledState[i] = 0;   // apres l'animation : tout reste eteint
  showCross();
}

void defeatFrame(unsigned long e) {      // e = temps ecoule depuis le debut (ms)
  if (e < D_ALARM) {                     // alarme : rouge plein 300 ms, eteint 150 ms, au rythme des notes
    bool on = (e % 450) < 300;
    for (int i = 0; i < 8; i++) leds.set(i, RED, on ? 50 : 0);
    digitalWrite(PIN_GLED, on);
  } else {                               // black-out : de la LED 7 a la LED 0, avec un rouge qui palpite
    unsigned long f = e - D_ALARM;
    int lit = 8 - (int)(f * 8 / D_FADE); // nombre de LEDs encore allumees
    uint8_t level = 12 + ((f / 40) % 2) * 18;      // scintillement 12 / 30
    for (int i = 0; i < 8; i++) leds.set(i, RED, i < lit ? level : 0);
    digitalWrite(PIN_GLED, LOW);
  }
  leds.show();
}

void victoryTick(unsigned long t) {
  if (!victoryOn) return;
  if (vNote < vCount && t >= vNextNote) {             // note suivante de la melodie
    int d = vDurations[vNote];
    buzzer.tone(vNotes[vNote], d > 100 ? d - 20 : d + 10);   // notes courtes liees : effet de vibrato
    vNextNote = t + vDurations[vNote];
    vNote++;
  }
  if (t - vFrame >= 40 && defeatOn) {                 // defaite : LEDs rouges
    vFrame = t;
    defeatFrame(t - vStart);
  } else if (t - vFrame >= 40) {                      // victoire : arc-en-ciel qui tourne (25 images/s)
    vFrame = t;
    for (int i = 0; i < 8; i++) {
      uint8_t r, g, b;
      wheel((uint8_t)((t - vStart) / 4 + i * 32), r, g, b);
      leds.set(i, ModulinoColor(r, g, b), 30);
    }
    leds.show();
    digitalWrite(PIN_GLED, ((t - vStart) / 150) % 2);  // la LED Grove clignote aussi
  }
  if (t >= vEnd) {                                    // fin : retour a l'etat du jeu
    victoryOn = false;
    digitalWrite(PIN_GLED, LOW);
    renderLeds();
    if (defeatOn && showCrossAtEnd) showCross();      // la croix reste affichee jusqu'a la partie suivante
    else showErrors(currentErrors);
    defeatOn = false;
  }
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
  else if (strcmp(cmd, "LEDS") == 0)    { for (int i = 0; i < 8; i++) ledState[i] = 0; if (!victoryOn) renderLeds(); }
  else if (strcmp(cmd, "VICTORY") == 0) victoryStart(a1 && strcmp(a1, "FINAL") == 0);
  else if (strcmp(cmd, "DEFEAT") == 0)  defeatStart();
  else if (strcmp(cmd, "MORSE") == 0 && a1) {
    if (strcmp(a1, "STOP") == 0) morseStop(); else morseStart(a1);
  }
  else if (strcmp(cmd, "OLEDCLR") == 0) Oled.clear();
  else if (strcmp(cmd, "ERRORS") == 0 && a1) { if (victoryOn) { currentErrors = atoi(a1); showCrossAtEnd = false; } else showErrors(atoi(a1)); }
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
  victoryTick(t);
}
