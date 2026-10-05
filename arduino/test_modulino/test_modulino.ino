// test_modulino.ino - verifie d'un coup les 7 Modulino du kit Plug and Make
//
// Branchement : tous les Modulino en chaine sur le connecteur Qwiic de l'UNO R4 WiFi
// (l'ordre n'a pas d'importance). Bibliotheque requise : "Modulino".
// Ouvrir le Moniteur serie a 115200 bauds.
//
// Ce que vous devez voir :
//  - au demarrage : chenillard bleu sur les 8 LEDs + un bip
//  - toutes les 0,5 s : une ligne avec molette, temperature, distance, accelerometre
//  - bouton A/B/C : son + message "BTN 0/1/2" + LED jaune du bouton
//  - molette : le nombre de LEDs vertes allumees suit la molette
//  - appui sur la molette : bip grave

#include <Modulino.h>

ModulinoButtons  buttons;
ModulinoBuzzer   buzzer;
ModulinoPixels   leds;
ModulinoKnob     knob;
ModulinoDistance distance;
ModulinoMovement movement;
ModulinoThermo   thermo;

int lastDistance = -1;
unsigned long lastPrint = 0;

void showLevel(int n) {           // allume n LEDs vertes sur 8
  for (int i = 0; i < 8; i++) {
    if (i < n) leds.set(i, GREEN, 20);
    else       leds.set(i, GREEN, 0);
  }
  leds.show();
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000) {}   // attend le moniteur serie (3 s max)

  Modulino.begin();
  buttons.begin();
  buzzer.begin();
  leds.begin();
  knob.begin();
  distance.begin();
  movement.begin();
  thermo.begin();

  Serial.println("Test Modulino : molette, boutons, main au-dessus du capteur de distance.");

  for (int i = 0; i < 8; i++) {           // chenillard de verification des LEDs
    showLevel(0);
    leds.set(i, BLUE, 25);
    leds.show();
    delay(80);
  }
  showLevel(0);
  buzzer.tone(880, 150);
}

void loop() {
  // Boutons
  if (buttons.update()) {
    bool a = buttons.isPressed(0), b = buttons.isPressed(1), c = buttons.isPressed(2);
    buttons.setLeds(a, b, c);
    for (int i = 0; i < 3; i++) {
      if (buttons.isPressed(i)) {
        Serial.print("BTN ");
        Serial.println(i);
        buzzer.tone(440 + i * 220, 100);
      }
    }
  }

  // Appui sur la molette
  if (knob.isPressed()) {
    Serial.println("KNOBPRESS");
    buzzer.tone(220, 150);
    delay(250);
  }

  // Distance (mesure disponible de temps en temps)
  if (distance.available()) {
    lastDistance = distance.get();
  }

  // Affichage toutes les 0,5 s
  if (millis() - lastPrint >= 500) {
    lastPrint = millis();
    int k = knob.get();
    showLevel(constrain(abs(k) % 9, 0, 8));

    movement.update();
    Serial.print("KNOB ");   Serial.print(k);
    Serial.print(" | TEMP "); Serial.print(thermo.getTemperature(), 1);
    Serial.print(" C | HUM "); Serial.print(thermo.getHumidity(), 0);
    Serial.print(" % | DIST "); Serial.print(lastDistance);
    Serial.print(" mm | ACC ");
    Serial.print(movement.getX(), 2); Serial.print(" ");
    Serial.print(movement.getY(), 2); Serial.print(" ");
    Serial.println(movement.getZ(), 2);
  }
}
