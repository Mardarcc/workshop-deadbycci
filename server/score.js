// Score d'une partie : plus l'equipe finit vite, plus elle marque.
//
//   Victoire : 1 000 points
//            + bonus de rapidite = 1 000 x temps restant / temps total   (jusqu'a +1 000)
//            - 150 points par erreur
//   Defaite  : 100 points par salle securisee (le temps restant ne compte pas)
//
// Le score ne descend jamais sous 0. Exemple : victoire en 12 min sur 20 avec 1 erreur
// -> 1 000 + 1 000 x 8/20 - 150 = 1 250 points.

const BASE_VICTOIRE = 1000;
const BONUS_RAPIDITE_MAX = 1000;
const MALUS_ERREUR = 150;
const POINTS_PAR_SALLE = 100;

function calculerScore({ gagnee, dureeMaxS, tempsS, erreurs, sallesReussies }) {
  if (!gagnee) return Math.max(0, sallesReussies * POINTS_PAR_SALLE);
  const restant = Math.max(0, dureeMaxS - tempsS);
  const bonus = Math.round((BONUS_RAPIDITE_MAX * restant) / dureeMaxS);
  return Math.max(0, BASE_VICTOIRE + bonus - erreurs * MALUS_ERREUR);
}

module.exports = { calculerScore, BASE_VICTOIRE, BONUS_RAPIDITE_MAX, MALUS_ERREUR, POINTS_PAR_SALLE };
