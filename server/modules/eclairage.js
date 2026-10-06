// Module 2 - Eclairage (enveloppe 2)
// Les 8 LEDs du Modulino Pixels = les 8 salles du plan (dans l'ordre de l'enveloppe 2).
// Le QG deplace le curseur (boutons Modulino gauche / droite), allume ou eteint (bouton du milieu),
// puis valide avec le bouton Grove.

// Salles qui doivent rester allumees (mardi 14 h 20) : LED 1, 3, 4, 7 -> indices 0, 2, 3, 6
const EXPECTED = [true, false, true, true, false, false, true, false];

function refresh(s, ctx) {
  s.lights.forEach((on, i) => ctx.send(`LED ${i} ${on ? 'ON' : 'OFF'}`));
}

module.exports = {
  id: 'eclairage',
  title: 'Éclairage',
  envelope: 2,
  debrief: 'Une lumière dans une salle vide est un gaspillage pur : on éteint en sortant.',

  init() {
    return { lights: Array(8).fill(true), cursor: 0 };
  },

  onStart(s, ctx) {
    ctx.send('OLEDCLR');
    ctx.send('OLED 0 ECLAIRAGE');
    ctx.send('OLED 2 Salles 1 a 8');
    refresh(s, ctx);
  },

  onEvent(s, e, ctx) {
    if (e.type === 'BTN' && e.value === 0) s.cursor = (s.cursor + 7) % 8;
    if (e.type === 'BTN' && e.value === 2) s.cursor = (s.cursor + 1) % 8;
    if (e.type === 'BTN' && e.value === 1) {
      s.lights[s.cursor] = !s.lights[s.cursor];
      ctx.send(`LED ${s.cursor} ${s.lights[s.cursor] ? 'ON' : 'OFF'}`);
    }
    if (e.type === 'VALID') {
      const ok = s.lights.every((on, i) => on === EXPECTED[i]);
      if (!ok) return ctx.error('Éclairage : mauvaises salles éteintes');
      ctx.ok();
      ctx.send('LEDS OFF');
      ctx.complete();
    }
  },

  view(s) {
    return {
      step: 'Couper les salles vides',
      lines: [['Commandes', '◀ ▶ déplacer · bouton du milieu : allumer / éteindre · Valider']],
      items: s.lights.map((on, i) => ({ label: `LED ${i + 1}`, on, cursor: i === s.cursor })),
    };
  },
};
