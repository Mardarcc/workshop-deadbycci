// Module 4 - Code de l'armoire (enveloppe 4)
// Le buzzer Grove joue un mot en morse. Les agents le decodent et le chiffrent (decalage = numero
// de la salle ou l'enveloppe 4 est cachee). Le QG tape le code sur l'ecran tactile.

const WORD = 'WATT';
const SALLE_ENVELOPPE = 3;   // A REGLER : numero (1 a 8) de la salle ou l'enveloppe 4 est cachee

const shift = (w, n) => w.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + n) % 26) + 65));
const ANSWER = shift(WORD, SALLE_ENVELOPPE);   // WATT + 3 = ZDWW

module.exports = {
  id: 'code',
  title: 'Code de l\'armoire',
  envelope: 4,
  debrief: 'Le watt mesure une puissance, le kilowattheure une énergie : 1 000 W pendant 1 h = 1 kWh.',

  init() {
    return {};
  },

  onStart(s, ctx) {
    ctx.send('OLEDCLR');
    ctx.send('OLED 0 ARMOIRE');
    ctx.send('OLED 2 VERROUILLEE');
    ctx.send(`MORSE ${WORD}`);
  },

  onEvent(s, e, ctx) {
    if (e.type !== 'CODE') return;
    if (String(e.raw).toUpperCase().trim() !== ANSWER) return ctx.error('Armoire : code refusé');
    ctx.send('MORSE STOP');
    ctx.ok();
    ctx.complete();
  },

  view() {
    return {
      step: 'Signal sonore en cours',
      lines: [['Signal', 'Écoutez le buzzer et dictez-le aux agents']],
      keyboard: true,
    };
  },
};
