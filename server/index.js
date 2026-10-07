// Serveur du jeu Black-out
// Relie l'Arduino (USB serie), l'ecran du QG (/) et les telephones des agents (/agents.html).
//
// Lancement : npm start
// Variables possibles :
//   SERIAL=COM5 ou /dev/ttyACM0   port de l'Arduino (detecte automatiquement si absent)
//   PORT=3000                     port web
//   DURATION=1200                 duree de la partie en secondes
//   MODULES=chauffage,eclairage   modules joues, dans l'ordre (demo jury : 2 modules)
//   KIOSK=0                       ne pas ouvrir Chromium en plein ecran (ou : npm run serveur)
//   AGENTS_URL=http://...         adresse forcee pour le QR code des agents (detectee automatiquement si absente)
//   DEV=1                         autorise les commandes du jeu depuis un autre appareil (tests a distance avec /?dev=1)

const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { HEURE_DU_JEU } = require('./scenario');
const { calculerScore } = require('./score');
const historique = require('./historique');

const ALL_MODULES = {
  chauffage: require('./modules/chauffage'),
  eclairage: require('./modules/eclairage'),
  presence: require('./modules/presence'),
  code: require('./modules/code'),
  compteur: require('./modules/compteur'),
};
const MODULES = (process.env.MODULES || 'chauffage,eclairage,presence,code,compteur')
  .split(',').map((id) => ALL_MODULES[id.trim()]).filter(Boolean);

const PORT = Number(process.env.PORT || 3000);
const SERIAL_PATH = process.env.SERIAL || null;   // null = detection automatique
const DURATION_SEC = Number(process.env.DURATION || 20 * 60);
const MAX_ERRORS = 3;
const STATE_FILE = path.join(__dirname, 'game-state.json');
const MODULE_IDS = MODULES.map((m) => m.id).join(',');
const DEV = process.env.DEV === '1';

const app = express();
// Pages, scripts et styles toujours relus (no-store) : apres un git pull, l'ecran du QG affiche la nouvelle version
// sans vider le cache du navigateur. Les images peuvent rester en cache.
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, file) => {
    if (/\.(html|js|css)$/.test(file)) res.setHeader('Cache-Control', 'no-store');
  },
}));

// Version du code (dernier commit Git), affichee au demarrage et sur l'accueil du QG
const VERSION = (() => {
  try {
    return execSync('git log -1 --format="%h · %cd" --date=format:"%d/%m %H:%M"', { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'inconnue';
  }
})();
const server = http.createServer(app);
const io = new Server(server);

// ---------- Etat de la partie (sauvegarde a chaque seconde pour la reprise apres incident) ----------
function newGame() {
  return {
    status: 'idle',          // idle | running | won | lost
    elapsedMs: 0,
    durationSec: DURATION_SEC,
    errors: 0,
    maxErrors: MAX_ERRORS,
    moduleIds: MODULE_IDS,   // liste des modules de cette partie (une sauvegarde d'une autre liste est ignoree)
    moduleIndex: 0,
    module: null,            // etat interne du module en cours
    endReason: null,
    startedAt: null,         // date de debut (pour l'historique)
    moduleStartMs: 0,        // chrono au debut du module en cours
    moduleErrors: 0,         // erreurs dans le module en cours
    etapes: [],              // temps et erreurs de chaque salle jouee
    score: null,
    sensors: {},
    chat: [],
  };
}

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    // Sauvegarde faite avec une autre liste de modules (ex. demo MODULES=chauffage,eclairage) :
    // la reprendre ferait planter le serveur (module introuvable), on repart d'une partie neuve.
    if (s.moduleIds !== MODULE_IDS) {
      console.log('Sauvegarde ignoree : elle ne correspond pas aux modules de ce lancement');
      return null;
    }
    console.log(`Partie restauree (statut : ${s.status})`);
    return s;
  } catch {
    return null;
  }
}

// Sauvegarde une fois par seconde (pas a chaque message de l'Arduino).
// Sous Windows, le renommage peut etre refuse si un antivirus ou OneDrive lit le fichier :
// on retombe alors sur une ecriture directe, et une sauvegarde ratee ne fait jamais planter le jeu.
function saveState() {
  const data = JSON.stringify(game);
  const tmp = STATE_FILE + '.tmp';
  try {
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, STATE_FILE);     // ecriture atomique : pas de fichier a moitie ecrit
  } catch {
    try {
      fs.writeFileSync(STATE_FILE, data);
    } catch (e) {
      console.error('Sauvegarde impossible :', e.message);
    }
  }
}

let game = loadState() || newGame();

// ---------- Liaison serie avec l'Arduino (reconnexion automatique) ----------
let port = null;

// Cherche la carte Arduino parmi les ports serie (fabricant Arduino = identifiant USB 2341)
async function findArduinoPort() {
  if (SERIAL_PATH) return SERIAL_PATH;
  const ports = await SerialPort.list();
  const arduino = ports.find((p) => (p.vendorId || '').toLowerCase() === '2341' || /arduino/i.test(p.manufacturer || ''));
  return arduino ? arduino.path : null;
}

async function openSerial() {
  let path;
  try { path = await findArduinoPort(); } catch { path = null; }
  if (!path) {
    console.log('Arduino introuvable (aucun port detecte), nouvel essai dans 2 s');
    return setTimeout(openSerial, 2000);
  }
  const p = new SerialPort({ path, baudRate: 115200, autoOpen: false });
  p.open((err) => {
    if (err) {
      console.log(`Arduino introuvable sur ${path} (${err.message}), nouvel essai dans 2 s`);
      return setTimeout(openSerial, 2000);
    }
    port = p;
    console.log(`Arduino connecte sur ${path}`);
    setTimeout(resyncHardware, 1000);   // apres un redemarrage du serveur, la console reprend l'etat de la partie
    p.pipe(new ReadlineParser({ delimiter: '\n' })).on('data', (l) => onArduinoLine(l.trim()));
    p.on('close', () => {
      console.log('Arduino deconnecte');
      port = null;
      setTimeout(openSerial, 2000);
    });
    p.on('error', (e) => console.error('Erreur serie :', e.message));
  });
}

function send(cmd) {
  if (port && port.isOpen) port.write(cmd + '\n');
  io.emit('log', `> ${cmd}`);
}

// ---------- Moteur de jeu ----------
function ctx() {
  return {
    send,
    sensors: game.sensors,
    ok: () => send('BEEP OK'),
    error: (reason) => addError(reason),
    complete: () => nextModule(),
  };
}

function currentModule() {
  return MODULES[game.moduleIndex];
}

function startGame() {
  const { sensors } = game;               // on garde les dernieres valeurs des capteurs
  game = newGame();
  game.sensors = sensors;
  io.emit('chat:history', game.chat);     // nouvelle partie = chat vide
  game.status = 'running';
  game.startedAt = new Date().toISOString();
  send('LEDS OFF');
  send('ERRORS 0');
  send('MORSE STOP');
  startModule(0);
  update();
}

function startModule(i) {
  game.moduleIndex = i;
  game.moduleStartMs = game.elapsedMs;
  game.moduleErrors = 0;
  game.module = currentModule().init();
  currentModule().onStart(game.module, ctx());
}

// Salle reussie : sequence de victoire sur la console (LEDs arc-en-ciel + melodie) et animation sur les ecrans
// Note le temps et les erreurs de la salle qui se termine (pour l'historique)
function noteEtape(reussie) {
  game.etapes = game.etapes || [];
  game.etapes.push({
    module: currentModule().id,
    tempsS: Math.round((game.elapsedMs - (game.moduleStartMs || 0)) / 1000),
    erreurs: game.moduleErrors || 0,
    reussie,
  });
}

function nextModule() {
  const done = currentModule();
  noteEtape(true);
  if (game.moduleIndex + 1 < MODULES.length) {
    send('VICTORY');
    io.emit('event', { type: 'success', text: `${done.title} : salle ${game.moduleIndex + 1}/${MODULES.length} sécurisée` });
    startModule(game.moduleIndex + 1);
  } else {
    send('VICTORY FINAL');
    io.emit('event', { type: 'won', text: 'Toutes les salles sont sécurisées' });
    endGame('won', null);
  }
}

function addError(reason) {
  if (game.status !== 'running') return;
  game.errors++;
  game.moduleErrors = (game.moduleErrors || 0) + 1;
  send(`ERRORS ${game.errors}`);
  if (game.errors >= game.maxErrors) return endGame('lost', 'Trois erreurs : le saboteur a gagné');
  send('BEEP KO');
  io.emit('event', { type: 'error', text: reason });
}

// Fin de partie. Perdue : alarme rouge puis black-out des LEDs + jingle triste sur la console, ecran noir sur les ecrans
function endGame(status, reason) {
  game.status = status;
  game.endReason = reason;
  send('MORSE STOP');
  if (status === 'lost') {
    send('DEFEAT');
    io.emit('event', { type: 'lost', text: reason });
  }
  send('OLEDCLR');
  send(status === 'won' ? 'OLED 2 MISSION REUSSIE' : 'OLED 2 BLACK-OUT');
  finirPartie(status);
}

// Score, generique de fin sur les ecrans, et enregistrement dans l'historique MySQL
function finirPartie(status) {
  const gagnee = status === 'won';
  if (!gagnee) noteEtape(false);
  const tempsS = Math.min(game.durationSec, Math.round(game.elapsedMs / 1000));
  const sallesReussies = (game.etapes || []).filter((e) => e.reussie).length;
  game.score = calculerScore({ gagnee, dureeMaxS: game.durationSec, tempsS, erreurs: game.errors, sallesReussies });
  io.emit('event', { type: 'final', status, score: game.score, tempsS, sallesReussies, sallesTotal: MODULES.length });
  const dateSql = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  historique.enregistrer({
    debut: dateSql(game.startedAt ? new Date(game.startedAt) : new Date(Date.now() - tempsS * 1000)),
    fin: dateSql(new Date()),
    resultat: gagnee ? 'gagnee' : 'perdue',
    raison: game.endReason,
    dureeMaxS: game.durationSec,
    tempsS,
    erreurs: game.errors,
    sallesReussies,
    sallesTotal: MODULES.length,
    modules: MODULE_IDS,
    score: game.score,
    etapes: game.etapes || [],
  });
}

// Quand l'Arduino (re)demarre, on lui renvoie l'etat de la partie
function resyncHardware() {
  send(`ERRORS ${game.errors}`);
  if (game.status === 'running') currentModule().onStart(game.module, ctx());
  if (game.status === 'won' || game.status === 'lost') {
    send('OLEDCLR');
    send(game.status === 'won' ? 'OLED 2 MISSION REUSSIE' : 'OLED 2 BLACK-OUT');
  }
}

function onArduinoLine(line) {
  if (!line) return;
  io.emit('log', `< ${line}`);
  const [type, ...rest] = line.split(' ');
  const raw = rest.join(' ');
  const value = Number(raw);

  if (['KNOB', 'TEMP', 'DIST', 'POT', 'LIGHT'].includes(type)) game.sensors[type.toLowerCase()] = value;
  if (type === 'READY') resyncHardware();

  if (game.status === 'running') {
    if (type === 'TILT') addError('Console penchée : sabotage détecté');
    else moduleEvent({ type, value, raw });
  }
  update();
}

function moduleEvent(e) {
  const m = currentModule();
  m.onEvent(game.module, e, ctx());
  if (game.status === 'running' && currentModule() === m && m.onTick) m.onTick(game.module, ctx());
}

// Etat envoye aux ecrans (sans les reponses attendues)
function publicState() {
  const m = currentModule();
  return {
    status: game.status,
    gameTime: HEURE_DU_JEU,  // heure de l'histoire, affichee pres du chrono
    remainingSec: Math.max(0, Math.ceil(game.durationSec - game.elapsedMs / 1000)),
    errors: game.errors,
    maxErrors: game.maxErrors,
    endReason: game.endReason,
    score: game.score ?? null,
    elapsedSec: Math.round(game.elapsedMs / 1000),
    debrief: ['won', 'lost'].includes(game.status) ? MODULES.map((m) => ({ title: m.title, text: m.debrief })) : null,
    arduino: Boolean(port && port.isOpen),
    module: game.module ? {
      index: game.moduleIndex + 1,
      total: MODULES.length,
      title: m.title,
      envelope: m.envelope,
      view: m.view(game.module, game.sensors),
    } : null,
  };
}

function update() {
  io.emit('state', publicState());
}

// Chrono : le temps n'avance que quand le serveur tourne (une coupure ne fait pas perdre de temps)
setInterval(() => {
  if (game.status === 'running') {
    game.elapsedMs += 1000;
    const m = currentModule();
    if (m.onTick) m.onTick(game.module, ctx());
    if (game.elapsedMs >= game.durationSec * 1000) endGame('lost', 'Temps écoulé');
  }
  saveState();
  update();
}, 1000);

// ---------- Ecrans et telephones ----------
// Seul l'ecran du QG (le navigateur du Pi, donc "localhost") pilote la partie : un telephone d'agent
// qui ouvrirait la page du QG ou /?dev=1 ne peut ni lancer, ni reinitialiser, ni simuler des capteurs.
const isLocal = (socket) => /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(socket.handshake.address);

function resetGame() {
  const { sensors } = game;
  game = newGame();
  game.sensors = sensors;
  send('LEDS OFF'); send('ERRORS 0'); send('MORSE STOP'); send('OLEDCLR');
  update();
}

io.on('connection', (socket) => {
  const control = DEV || isLocal(socket);
  socket.emit('state', publicState());
  socket.emit('chat:history', game.chat);
  socket.emit('role', { control });

  // Commandes du jeu : ecran du QG uniquement (ou DEV=1 pour tester depuis un autre appareil)
  const qg = (fn) => (...args) => { if (control) fn(...args); };

  socket.on('start', qg(() => startGame()));
  socket.on('reset', qg(() => resetGame()));

  // Chat temps reel : chaque message est diffuse tout de suite a tous les ecrans.
  // Pseudo uniquement (aucune donnee personnelle), 300 caracteres max, 1 message toutes les 0,5 s par appareil.
  let lastMsg = 0;
  socket.on('chat:send', (msg) => {
    const now = Date.now();
    if (now - lastMsg < 500) return;
    lastMsg = now;
    const name = String(msg?.name || 'Agent').trim().slice(0, 20) || 'Agent';
    const text = String(msg?.text || '').trim().slice(0, 300);
    if (!text) return;
    const message = { id: `${now}-${Math.random().toString(36).slice(2, 7)}`, name, text, from: msg?.from === 'qg' ? 'qg' : 'terrain', at: now };
    game.chat.push(message);
    game.chat = game.chat.slice(-100);
    io.emit('chat:message', message);
  });

  // Code tape sur l'ecran tactile (module Code de l'armoire)
  socket.on('code', qg((code) => {
    if (game.status !== 'running') return;
    moduleEvent({ type: 'CODE', value: NaN, raw: String(code).slice(0, 16) });
    update();
  }));

  // Mode test sans Arduino : la page /?dev=1 envoie de fausses lignes serie
  socket.on('simulate', qg((line) => onArduinoLine(String(line).slice(0, 60))));
});

// ---------- Adresse a donner aux telephones des agents ----------
// Les telephones arrivent par le Wi-Fi : on met le Wi-Fi en premier et les cartes virtuelles
// (VirtualBox 192.168.56.x, Hyper-V/WSL, Docker...) en dernier, sinon le QR code pointe vers une adresse injoignable.
const VIRTUAL = /virtual|vbox|vmware|vethernet|hyper-v|wsl|docker|^br-|^veth|virbr|tailscale|zerotier/i;
function lanAddresses() {
  const rank = ({ name, address }) =>
    VIRTUAL.test(name) || address.startsWith('192.168.56.') ? 2 : /wi-?fi|wlan|wireless/i.test(name) ? 0 : 1;
  return Object.entries(os.networkInterfaces())
    .flatMap(([name, list]) => (list || []).map((i) => ({ ...i, name })))
    .filter((i) => i.family === 'IPv4' && !i.internal)
    .sort((a, b) => rank(a) - rank(b))
    .map((i) => i.address);
}

// AGENTS_URL=http://... force l'adresse du QR code si la detection se trompe
function agentsUrls() {
  const urls = lanAddresses().map((ip) => `http://${ip}:${PORT}/agents.html`);
  return process.env.AGENTS_URL ? [process.env.AGENTS_URL, ...urls] : urls;
}

// Historique des parties (page /historique.html)
app.get('/api/historique', async (req, res) => {
  res.json(await historique.lire());
});

app.get('/api/info', (req, res) => {
  res.json({ agentsUrls: agentsUrls(), version: VERSION });
});

app.get('/qr.svg', async (req, res) => {
  const url = String(req.query.url || '').slice(0, 200);
  if (!/^https?:\/\//.test(url)) return res.status(400).end();
  res.type('image/svg+xml').send(await QRCode.toString(url, { type: 'svg', margin: 1 }));
});

// ---------- Ecran du QG : Chromium en plein ecran sur le Raspberry Pi ----------
// Lance automatiquement sous Linux (Raspberry Pi). Desactive avec KIOSK=0 ou --no-kiosk.
const KIOSK = process.platform === 'linux' && process.env.KIOSK !== '0' && !process.argv.includes('--no-kiosk');
let browser = null;
let stopping = false;
let quickFailures = 0;

function findChromium() {
  const names = ['chromium', 'chromium-browser', 'google-chrome'];
  const dirs = (process.env.PATH || '').split(path.delimiter).concat(['/snap/bin', '/usr/bin']);
  for (const n of names) for (const d of dirs) {
    const f = path.join(d, n);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

function openKiosk() {
  const chromium = findChromium();
  if (!chromium) return console.log('Chromium introuvable : ouvrez http://localhost:' + PORT + ' a la main');
  const url = `http://localhost:${PORT}/?kiosk=1`;
  const hasDisplay = Boolean(process.env.WAYLAND_DISPLAY || process.env.DISPLAY);

  // Lance par SSH sans ecran : inutile d'essayer, l'ecran du Pi n'est pas accessible depuis cette session
  if (!hasDisplay && process.env.SSH_CONNECTION) {
    return console.log('Session SSH : pas d\'ecran ici, Chromium n\'est pas lance. Lancez npm start depuis l\'ecran du Pi (ou laissez le demarrage automatique le faire).');
  }

  const flags = ['--kiosk', '--noerrdialogs', '--disable-infobars', '--disable-session-crashed-bubble',
    '--overscroll-history-navigation=0', '--password-store=basic', '--check-for-update-interval=31536000',
    '--no-first-run', '--incognito'];          // navigation privee : jamais d'ancienne version en cache
  // Bureau graphique deja lance (Raspberry Pi OS) : Chromium directement.
  // Pas de bureau (Ubuntu Server, lance depuis l'ecran du Pi) : Chromium dans "cage", un affichage Wayland minimal.
  // Sous cage, Chromium doit utiliser Wayland : sans cette option il cherche un serveur X11 et quitte (code 1).
  if (!hasDisplay || process.env.WAYLAND_DISPLAY) flags.push('--ozone-platform=wayland');
  flags.push(url);
  const [cmd, args] = hasDisplay ? [chromium, flags] : ['cage', ['--', chromium, ...flags]];

  console.log(`Ecran du QG : ouverture de ${url} en plein ecran${hasDisplay ? '' : ' (via cage)'}`);
  const launchedAt = Date.now();
  let erreurs = '';                            // dernieres lignes d'erreur de cage / Chromium, pour le diagnostic
  browser = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  browser.stderr.on('data', (d) => { erreurs = (erreurs + d).slice(-4000); });
  browser.on('error', (e) => console.log(`Impossible d'ouvrir l'ecran du QG (${e.message}). Installez cage et chromium (docs/installation-raspberry.md, section 5), ou lancez avec KIOSK=0.`));
  browser.on('exit', (code) => {
    browser = null;
    if (stopping) return;
    if (code !== 0 && erreurs.trim()) {
      const lignes = erreurs.trim().split('\n').filter((l) => l.trim()).slice(-6);
      console.log(`Erreurs de ${hasDisplay ? 'Chromium' : 'cage / Chromium'} :\n  ${lignes.join('\n  ')}`);
    }
    // Ferme en moins de 10 s trois fois de suite : inutile d'insister
    quickFailures = Date.now() - launchedAt < 10000 ? quickFailures + 1 : 0;
    if (quickFailures >= 3) {
      return console.log('Ecran du QG indisponible apres 3 essais : le serveur continue sans. Voir les erreurs ci-dessus et docs/installation-raspberry.md (En cas de probleme).');
    }
    console.log(`Navigateur ferme (code ${code}), reouverture dans 5 s`);
    setTimeout(openKiosk, 5000);
  });
}

function shutdown() {
  stopping = true;
  if (browser) browser.kill();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  console.log(`Serveur pret : http://localhost:${PORT}`);
  for (const url of agentsUrls()) console.log(`Telephones des agents : ${url}`);
  console.log(`QR code a imprimer : http://localhost:${PORT}/qr.html`);
  console.log(`Modules : ${MODULES.map((m) => m.id).join(', ')}`);
  console.log(`Version du code : ${VERSION}`);
  if (DEV) console.log('DEV=1 : les commandes du jeu sont acceptees depuis tous les appareils du reseau');
  if (KIOSK) openKiosk();
});
openSerial();
historique.demarrer();
