// Ecran du QG : affiche le module en cours, le chrono, les erreurs et le chat
const socket = io();
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const dev = params.has('dev');
if (params.has('kiosk')) document.body.classList.add('kiosk');   // ecran tactile du Pi : pas de curseur
if (dev) document.body.classList.add('devmode');
let simKnob = 0;

function el(tag, attrs = {}, text) {
  const e = document.createElement(tag);
  Object.assign(e, attrs);
  if (text !== undefined) e.textContent = text;
  return e;
}

function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

let typed = '';          // code en cours de saisie (module Code de l'armoire)
let lastScreenKey = '';

function renderDebrief(box, debrief) {
  if (!debrief) return;
  const list = el('div', { className: 'debrief' });
  list.append(el('h2', {}, 'Ce qu\'il faut retenir'));
  for (const d of debrief) {
    const p = el('p');
    p.append(el('b', {}, `${d.title} : `), document.createTextNode(d.text));
    list.append(p);
  }
  box.append(list);
}

// Briefing de la mission, qui defile a droite du QR code sur l'ecran d'accueil
const BRIEFING = [
  [['Mardi, 14 h 20. ', true], ['Alerte au QG.', false]],
  [['Un saboteur a piraté les systèmes techniques du campus. Tel un gréviste, il veut ', false], ['consolider le blocus', true], [' en soutien aux lycéens mobilisés : un ', false], ['black-out', true], [' général fermerait le campus pour de bon.', false]],
  [['Chauffage à fond, lumières allumées partout, détecteurs déréglés : la consommation s\'emballe et le réseau va sauter.', false]],
  [['Agents terrain', true], [' : fouillez les salles, trouvez les enveloppes et guidez le QG.', false]],
  [['QG', true], [' : suivez leurs instructions sur la console.', false]],
  [['Vous avez 20 minutes pour sécuriser les 5 salles et déjouer son plan.', true]],
];
function briefing() {
  const zone = el('div', { className: 'briefing' });
  const titre = el('div', { className: 'briefing-title' }, 'Briefing de mission');
  const etat = el('span', {}, 'toucher = pause');
  titre.append(etat);
  zone.append(titre);
  const fenetre = el('div', { className: 'briefing-window' });
  const texte = el('div', { className: 'briefing-text' });
  for (const para of BRIEFING) {
    const p = el('p');
    for (const [t, fort] of para) p.append(fort ? el('b', {}, t) : document.createTextNode(t));
    texte.append(p);
  }
  fenetre.append(texte);
  zone.append(fenetre);
  // Ecran tactile : un toucher met le defilement en pause (pour lire tranquillement), un autre le relance
  fenetre.onclick = () => {
    zone.classList.toggle('paused');
    etat.textContent = zone.classList.contains('paused') ? 'en pause · toucher' : 'toucher = pause';
  };
  return zone;
}

// Lien vers la page historique (on garde le mode kiosque de l'ecran du Pi)
function boutonHistorique() {
  const h = el('button', { className: 'ghost' }, 'Historique des parties');
  h.onclick = () => { location.href = `historique.html${params.has('kiosk') ? '?kiosk=1' : ''}`; };
  return h;
}

// Clavier AZERTY (module Code de l'armoire)
const AZERTY = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];

function renderKeyboard(screen) {
  const display = el('div', { className: 'big', id: 'typed' }, typed || '_');
  const keys = el('div', { className: 'keys' });
  const show = () => { display.textContent = typed || '_'; };
  for (const row of AZERTY) {
    for (const c of row) {
      const b = el('button', {}, c);
      b.onclick = () => { if (typed.length < 8) typed += c; show(); };
      keys.append(b);
    }
  }
  const del = el('button', { className: 'del' }, '⌫');
  del.onclick = () => { typed = typed.slice(0, -1); show(); };
  const ok = el('button', { className: 'primary ok' }, 'Valider');
  ok.onclick = () => { if (!typed) return; socket.emit('code', typed); typed = ''; show(); };
  keys.append(del, ok);
  screen.append(display, keys);
}

function renderScreen(st) {
  // On ne redessine que si le contenu change (sinon le clavier serait recree chaque seconde)
  const key = JSON.stringify([st.status, st.module, st.endReason, st.score, st.resumable]);
  if (key === lastScreenKey) return;
  lastScreenKey = key;

  const screen = $('screen');
  screen.replaceChildren();
  if (st.status === 'idle') {
    const box = el('div', { className: 'center' });
    const r = st.resumable;
    if (r) {
      // Partie interrompue (coupure, plantage) : on propose de la reprendre au lieu de la relancer d'office
      const bar = el('div', { className: 'resume-bar' });
      const txt = el('div', {});
      txt.append(el('b', {}, 'Partie interrompue'), el('br'),
        document.createTextNode(`Salle ${r.salle}/${r.total} · ${r.titre} · ${fmt(r.remainingSec)} restantes · ${r.erreurs} erreur${r.erreurs > 1 ? 's' : ''}`));
      const rb = el('button', { className: 'teal' }, 'Reprendre');
      rb.onclick = () => socket.emit('resume');
      bar.append(txt, rb);
      box.append(bar);
    } else {
      box.append(el('h1', {}, 'Console prête'));
    }
    const join = el('div', { className: 'join' });
    const qr = el('div', { className: 'qr' });
    join.append(qr, briefing());
    box.append(join);
    const version = el('div', { className: 'version' });
    fetch('/api/info').then((r) => r.json()).then(({ agentsUrls, version: v }) => {
      if (v) version.textContent = `Version du code : ${v}`;
      const url = agentsUrls[0];
      if (!url) return;
      qr.append(el('img', { src: `/qr.svg?url=${encodeURIComponent(url)}`, alt: 'QR code de la page des agents', title: url }),
        el('div', { className: 'qr-hint' }, 'Agents : scannez pour ouvrir le chat'));
    }).catch(() => {});
    const b = el('button', { className: 'primary big-btn' }, r ? 'Nouvelle partie' : 'Lancer la partie');
    b.onclick = () => socket.emit('start');
    const row = el('div', { className: 'btn-row' });
    row.append(b, boutonHistorique());
    box.append(row, version);
    screen.append(box);
    return;
  }
  if (st.status === 'won' || st.status === 'lost') {
    const box = el('div', { className: 'center' });
    box.append(el('h1', { className: st.status }, st.status === 'won' ? 'Blocus déjoué !' : 'BLACK-OUT'));
    if (st.endReason) box.append(el('p', { className: 'hint' }, st.endReason));
    if (st.score !== null && st.score !== undefined) {
      const sc = el('div', { className: 'score-line' });
      sc.append(el('b', {}, `${st.score.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')} points`), document.createTextNode(` · ${fmt(st.elapsedSec || 0)} de jeu`));
      box.append(sc);
    }
    renderDebrief(box, st.debrief);
    const b = el('button', { className: 'primary big-btn' }, 'Nouvelle partie');
    b.onclick = () => socket.emit('start');
    const row = el('div', { className: 'btn-row' });
    row.append(b, boutonHistorique());
    box.append(row);
    screen.append(box);
    return;
  }
  const m = st.module;
  const v = m.view;
  screen.append(el('div', { className: 'step' }, `Salle ${m.index}/${m.total} · ${v.step}`));
  screen.append(el('h1', {}, m.title));
  const table = el('table');
  for (const [k, val] of v.lines) {
    const tr = el('tr');
    tr.append(el('td', {}, k), el('td', {}, val));
    table.append(tr);
  }
  screen.append(table);
  if (v.items) {
    const grid = el('div', { className: 'lights' });
    for (const it of v.items) {
      grid.append(el('div', { className: `light${it.on ? ' on' : ''}${it.cursor ? ' cursor' : ''}` }, it.label));
    }
    screen.append(grid);
  }
  if (v.big) screen.append(el('div', { className: 'big' }, v.big));
  if (v.progress !== undefined) {
    const bar = el('div', { className: 'progress' });
    const fill = el('div');
    fill.style.width = `${Math.round(v.progress * 100)}%`;
    bar.append(fill);
    screen.append(bar);
  }
  if (v.bigLabel) screen.append(el('div', { className: 'hint' }, v.bigLabel));
  if (v.formula) {
    const box = el('div', { className: 'formula' });
    box.append(el('div', { className: 'formula-title' }, 'Aide au calcul · valeurs dans l\'enveloppe des agents'));
    for (const f of v.formula) box.append(el('div', { className: 'formula-line' }, f));
    screen.append(box);
  }
  if (v.keyboard) renderKeyboard(screen);
}

socket.on('state', (st) => {
  $('timer').textContent = st.status === 'running' ? fmt(st.remainingSec) : '--:--';
  $('timer').classList.toggle('urgent', st.status === 'running' && st.remainingSec <= 60);
  // Heure de l'histoire (toutes les enigmes se jouent a ce moment-la), a cote du chrono reel
  const t = st.gameTime || '';
  $('gametime').replaceChildren(el('span', {}, 'Nous sommes'), el('b', {}, t.charAt(0).toUpperCase() + t.slice(1)));
  $('errors').replaceChildren(...Array.from({ length: st.maxErrors }, (_, i) => el('span', { className: i < st.errors ? 'on' : '' })));
  $('arduino').classList.toggle('off', !st.arduino);
  $('arduino').textContent = st.arduino ? 'Arduino OK' : 'Arduino absent';
  renderScreen(st);
});

// Animation plein ecran : reussite d'une salle, erreur, victoire finale
showOverlaysFrom(socket);

// Page ouverte ailleurs que sur l'ecran du QG : le serveur refuse les commandes, on le signale
socket.on('role', ({ control }) => document.body.classList.toggle('readonly', !control));

// Abandonner la partie (sans clavier sur le Pi) : appui long de 3 s sur « BLACK-OUT · QG »
const brand = document.querySelector('.brand');
let holdTimer = null;
brand.addEventListener('pointerdown', () => {
  holdTimer = setTimeout(() => {
    if (confirm('Abandonner la partie et revenir à l\'écran d\'accueil ?')) socket.emit('reset');
  }, 3000);
});
brand.addEventListener('contextmenu', (e) => e.preventDefault());   // pas de menu au clic long
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => brand.addEventListener(ev, () => clearTimeout(holdTimer)));

const chat = setupChat(socket, { me: () => 'QG', from: 'qg', list: $('messages'), form: $('form'), input: $('text') });
document.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => chat.send(b.dataset.q); });

// Mode test : ouvrir http://<pi>:3000/?dev=1
if (dev) {
  $('dev').hidden = false;
  document.querySelectorAll('[data-sim]').forEach((b) => {
    b.onclick = () => {
      const s = b.dataset.sim;
      if (s === 'knob+' || s === 'knob-') {
        simKnob += s === 'knob+' ? 1 : -1;
        socket.emit('simulate', `KNOB ${simKnob}`);
      } else {
        socket.emit('simulate', s);
      }
    };
  });
  $('reset').onclick = () => socket.emit('reset');
  socket.on('log', (l) => { $('log').textContent = `${l}\n${$('log').textContent}`.slice(0, 4000); });
}
