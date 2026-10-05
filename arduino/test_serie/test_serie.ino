#include <Modulino.h>

ModulinoKnob knob;

void setup() {
  Serial.begin(115200);
  Modulino.begin();
  knob.begin();
}

void loop() {
  static int last = 9999;
  int v = knob.get();
  if (v != last) {                 // n'envoie que si la valeur change
    last = v;
    Serial.print("KNOB ");
    Serial.println(v);
  }
  if (knob.isPressed()) {
    Serial.println("KNOBPRESS");
    delay(300);                    // évite les doubles appuis
  }
  delay(20);
}
