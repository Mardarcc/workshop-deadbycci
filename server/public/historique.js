// Page historique : statistiques, meilleurs scores et dernieres parties (lus dans MySQL par le serveur)
const params = new URLSearchParams(location.search);
if (params.has('kiosk')) document.body.classList.add('kiosk');
document.getElementById('retour').onclick = () => { location.href = params.has('kiosk') ? '/?kiosk=1' : '/'; };

const NOMS = { chauffage: 'Chauffage', eclairage: 'Éclairage', presence: 'Présence', code: 'Code de l\'armoire', compteur: 'Compteur' };

function el(tag, attrs = {}, text) {
  const e = document.createElement(tag);
  Object.assign(e, attrs);
  if (text !== undefined) e.textContent = text;   // texte brut uniquement
  return e;
}
const mmss = (s) => (s === null || s === undefined ? '—' : `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
const quand = (d) => {
  const date = new Date(d.replace(' ', 'T'));
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' ' +
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
const points = (n) => Number(n).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0');   // espace des milliers bien visible
const tagDemo = (p) => (p.demo ? el('span', { className: 'tag' }, 'démo') : document.createTextNode(''));

function tuile(valeur, legende) {
  const t = el('div', { className: 'tile' });
  t.append(el('b', {}, valeur), el('span', {}, legende));
  return t;
}

function afficher(data) {
  const page = document.getElementById('page');
  page.replaceChildren();

  if (!data.active) {
    const box = el('div', { className: 'card center-msg' });
    box.append(el('h1', {}, 'Historique indisponible'), el('p', { className: 'hint' }, `Raison : ${data.raison}.`),
      el('p', { className: 'hint' }, 'Le jeu fonctionne sans base de données ; voir docs/installation-raspberry.md, section MySQL.'));
    page.append(box);
    return;
  }

  // Statistiques
  const s = data.stats;
  const taux = s.total ? Math.round((100 * s.gagnees) / s.total) : 0;
  const tiles = el('section', { className: 'tiles' });
  tiles.append(
    tuile(String(s.total), 'parties jouées'),
    tuile(`${taux} %`, 'de victoires'),
    tuile(mmss(s.meilleur_temps_complet), 'meilleur temps (5 salles)'),
    tuile(s.score_moyen === null ? '—' : points(s.score_moyen), 'score moyen'),
  );
  page.append(tiles);

  const cols = el('div', { className: 'cols' });

  // Meilleurs scores
  const top = el('section', { className: 'card' });
  top.append(el('h2', {}, 'Meilleurs scores'));
  const ol = el('ol', { className: 'podium' });
  for (const p of data.top) {
    const li = el('li');
    li.append(el('b', {}, points(p.score)), el('span', {}, ` ${mmss(p.temps_s)} · ${p.salles_total} salles · ${p.erreurs} err. · ${quand(p.debut)} `), tagDemo(p));
    ol.append(li);
  }
  if (!data.top.length) ol.append(el('li', { className: 'hint' }, 'Aucune victoire pour l\'instant.'));
  top.append(ol);

  // Temps moyen par salle
  const mod = el('section', { className: 'card' });
  mod.append(el('h2', {}, 'Temps moyen par salle'));
  const max = Math.max(1, ...data.modules.map((m) => m.temps_moyen));
  for (const m of data.modules) {
    const row = el('div', { className: 'bar-row' });
    const bar = el('div', { className: 'bar' });
    const fill = el('i');
    fill.style.width = `${Math.round((100 * m.temps_moyen) / max)}%`;
    bar.append(fill);
    row.append(el('span', {}, NOMS[m.module] || m.module), bar, el('b', {}, mmss(m.temps_moyen)));
    mod.append(row);
  }
  cols.append(top, mod);
  page.append(cols);

  // Dernieres parties
  const last = el('section', { className: 'card' });
  last.append(el('h2', {}, 'Dernières parties'));
  const table = el('table', { className: 'hist' });
  const head = el('tr');
  for (const h of ['Date', 'Résultat', 'Temps', 'Salles', 'Err.', 'Score']) head.append(el('th', {}, h));
  table.append(head);
  for (const p of data.parties) {
    const tr = el('tr', { className: p.resultat });
    const res = el('td');
    res.append(el('span', { className: `res ${p.resultat}` }, p.resultat === 'gagnee' ? 'Gagnée' : 'Perdue'), tagDemo(p));
    if (p.raison) res.title = p.raison;
    tr.append(el('td', {}, quand(p.debut)), res, el('td', {}, mmss(p.temps_s)),
      el('td', {}, `${p.salles_reussies}/${p.salles_total}`), el('td', {}, String(p.erreurs)), el('td', { className: 'num' }, points(p.score)));
    table.append(tr);
  }
  last.append(table);
  page.append(last);

  // Calcul du score
  const regle = el('section', { className: 'card regle' });
  regle.append(el('h2', {}, 'Calcul du score'),
    el('p', {}, 'Victoire : 1 000 points + bonus de rapidité (jusqu\'à 1 000 points, selon le temps restant) − 150 points par erreur.'),
    el('p', {}, 'Défaite : 100 points par salle sécurisée.'));
  page.append(regle);
}

fetch('/api/historique')
  .then((r) => r.json())
  .then(afficher)
  .catch(() => afficher({ active: false, raison: 'serveur injoignable' }));
