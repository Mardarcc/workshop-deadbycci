// Module 5 - Compteur (enveloppe 5)
// L'OLED affiche deux index du compteur. Les agents calculent les kg de CO2 dus au sabotage.
// Le QG regle le potentiometre, puis valide avec le bouton Grove.

const ANSWER = 54;        // (50 520 - 48 120 - 600) kWh x 30 g = 54 kg
const TOLERANCE = 2;
const MAX_KG = 100;

const kg = (pot) => Math.round(((pot ?? 0) / 1023) * MAX_KG);

module.exports = {
  id: 'compteur',
  title: 'Compteur',
  envelope: 5,
  debrief: 'L\'électricité française émet peu de CO2 (30 g/kWh en 2024, RTE), mais chaque kWh gaspillé compte.',

  init() {
    return {};
  },

  onStart(s, ctx) {
    ctx.send('OLEDCLR');
    ctx.send('OLED 0 COMPTEUR kWh');
    ctx.send('OLED 2 VEN18H 048120');
    ctx.send('OLED 4 LUN08H 050520');
  },

  onEvent(s, e, ctx) {
    if (e.type !== 'VALID') return;
    if (Math.abs(kg(ctx.sensors.pot) - ANSWER) > TOLERANCE) return ctx.error('Compteur : estimation incorrecte');
    ctx.ok();
    ctx.complete();
  },

  view(s, sensors) {
    return {
      step: 'Chiffrer les dégâts',
      lines: [['Index du compteur', 'Lire le petit écran de la console']],
      big: `${kg(sensors.pot)} kg CO₂`,
      bigLabel: 'Régler le potentiomètre, puis appuyer sur Valider',
      // Aide au calcul pour le QG : les formules, pas les valeurs (elles sont dans l'enveloppe 5)
      formula: [
        'conso (kWh) = index lundi − index vendredi',
        'sabotage (kWh) = conso − conso normale',
        'CO₂ (kg) = sabotage × g par kWh ÷ 1 000',
      ],
    };
  },
};
