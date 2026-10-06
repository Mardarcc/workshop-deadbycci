// Module 1 - Chauffage (enveloppe 1)
// Le QG tourne la molette pour regler la consigne, puis appuie sur la molette pour valider.
// Les reponses viennent du corrige des enveloppes (docs/enveloppes-agents-terrain.md).

const NOW = 'mardi 14 h 20';
const ROUNDS = [
  { room: 'Amphi',        lastExit: 'vendredi 18 h 00',           answer: 8 },
  { room: 'Salle Info 1', lastExit: 'badge actif (salle occupée)', answer: 19 },
  { room: 'CDI',          lastExit: 'lundi 12 h 00',              answer: 16 },
];
const START_SETPOINT = 24;   // le saboteur a mis le chauffage a fond
const MIN = 5;
const MAX = 25;
const KNOB_STEP = 1;         // nombre de crans de molette pour 1 degre (a ajuster selon la molette)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function show(s, ctx) {
  const r = ROUNDS[s.round];
  ctx.send('OLEDCLR');
  ctx.send('OLED 0 CHAUFFAGE');
  ctx.send(`OLED 2 ${r.room}`);
  ctx.send(`OLED 4 Tour ${s.round + 1}/${ROUNDS.length}`);
}

module.exports = {
  id: 'chauffage',
  title: 'Chauffage',
  envelope: 1,
  debrief: 'La loi plafonne le chauffage à 19 °C, 16 °C ou 8 °C quand les locaux sont vides. 1 °C de moins = environ 7 % d\'énergie en moins (ADEME).',

  init() {
    return { round: 0, knobBase: null, setpoint: START_SETPOINT };
  },

  // Appele au debut du module et quand l'Arduino se reconnecte (ne remet pas le tour a zero)
  onStart(s, ctx) {
    s.knobBase = ctx.sensors.knob ?? null;
    s.setpoint = START_SETPOINT;
    show(s, ctx);
  },

  onEvent(s, e, ctx) {
    if (e.type === 'KNOB') {
      if (s.knobBase === null) s.knobBase = e.value;
      s.setpoint = clamp(START_SETPOINT + Math.round((e.value - s.knobBase) / KNOB_STEP), MIN, MAX);
      return;
    }
    if (e.type === 'KNOBPRESS') {
      const r = ROUNDS[s.round];
      if (s.setpoint !== r.answer) {
        ctx.error(`Chauffage : mauvaise consigne pour ${r.room}`);
        return;
      }
      ctx.send(`LED ${s.round} OK`);
      ctx.ok();
      s.round++;
      if (s.round >= ROUNDS.length) return ctx.complete();
      s.knobBase = ctx.sensors.knob ?? s.knobBase;
      s.setpoint = START_SETPOINT;
      show(s, ctx);
    }
  },

  // Ce que l'ecran du QG affiche (jamais la reponse attendue)
  view(s, sensors) {
    const r = ROUNDS[Math.min(s.round, ROUNDS.length - 1)];
    return {
      step: `Tour ${Math.min(s.round + 1, ROUNDS.length)} / ${ROUNDS.length}`,
      lines: [
        ['Salle', r.room],
        ['Jour et heure', NOW],
        ['Dernière sortie', r.lastExit],
        ['Température mesurée', sensors.temp != null ? `${Number(sensors.temp).toFixed(1)} °C` : '—'],
      ],
      big: `${s.setpoint} °C`,
      bigLabel: 'Consigne : tourner la molette, puis appuyer dessus pour valider',
    };
  },
};
