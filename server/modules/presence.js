// Module 3 - Presence (enveloppe 3)
// Le QG tient sa main au-dessus du Modulino Distance, a la distance calculee par les agents,
// pendant 3 secondes. Maquette au 1/10 : rayon (m) x 100 = distance (mm).

const ROUNDS = [
  { code: 'C-12', target: 145 },   // 2,50 x 0,58 = 1,45 m -> 14,5 cm
  { code: 'C-27', target: 336 },   // 4,00 x 0,84 = 3,36 m -> 33,6 cm
  { code: 'C-35', target: 220 },   // 2,20 x 1,00 = 2,20 m -> 22 cm
];
const TOLERANCE = 20;              // +/- 2 cm
const HOLD_MS = 3000;

function show(s, ctx) {
  ctx.send('OLEDCLR');
  ctx.send('OLED 0 PRESENCE');
  ctx.send(`OLED 2 Capteur ${ROUNDS[s.round].code}`);
  ctx.send(`OLED 4 Tour ${s.round + 1}/${ROUNDS.length}`);
}

module.exports = {
  id: 'presence',
  title: 'Présence',
  envelope: 3,
  debrief: 'Un détecteur de présence ne fait des économies que s\'il est bien réglé : son réglage se calcule.',

  init() {
    return { round: 0, holdSince: null, progress: 0 };
  },

  onStart(s, ctx) {
    s.holdSince = null;
    s.progress = 0;
    show(s, ctx);
  },

  onEvent(s, e) {
    if (e.type !== 'DIST') return;
    const inRange = Math.abs(e.value - ROUNDS[s.round].target) <= TOLERANCE;
    if (!inRange) { s.holdSince = null; s.progress = 0; }
    else if (s.holdSince === null) s.holdSince = Date.now();
  },

  // Appele chaque seconde et apres chaque evenement : verifie si la main est tenue assez longtemps
  onTick(s, ctx) {
    if (s.holdSince === null) return;
    s.progress = Math.min(1, (Date.now() - s.holdSince) / HOLD_MS);
    if (s.progress < 1) return;
    ctx.send(`LED ${s.round} OK`);
    ctx.ok();
    s.round++;
    s.holdSince = null;
    s.progress = 0;
    if (s.round >= ROUNDS.length) return ctx.complete();
    show(s, ctx);
  },

  view(s, sensors) {
    const r = ROUNDS[Math.min(s.round, ROUNDS.length - 1)];
    return {
      step: `Capteur ${Math.min(s.round + 1, ROUNDS.length)} / ${ROUNDS.length}`,
      lines: [
        ['Capteur à recalibrer', r.code],
        ['Distance mesurée', sensors.dist != null ? `${(sensors.dist / 10).toFixed(1)} cm` : '—'],
      ],
      big: sensors.dist != null ? `${(sensors.dist / 10).toFixed(1)} cm` : '—',
      bigLabel: 'Tenir la main immobile à la bonne distance pendant 3 secondes',
      progress: s.progress,
      // Aide au calcul pour le QG : les formules, pas les valeurs (hauteur, angle et tan sont dans l'enveloppe 3)
      formula: [
        'rayon (m) = hauteur × tan(angle)',
        'maquette 1/10 (cm) = rayon (m) × 10',
      ],
    };
  },
};
