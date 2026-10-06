// Serveur du jeu Black-out
// Relie l'Arduino (USB serie), l'ecran du QG (/) et les telephones des agents (/agents.html).
//
// Lancement : npm start
// Variables possibles :
//   SERIAL=COM5 ou /dev/ttyACM0   port de l'Arduino (detecte automatiquement si absent)
//   PORT=3000                     port web
//   DURATION=1200                 duree de la partie en secondes
//   MODULES=chauffage,eclairage   modules joues, dans l'ordre (demo jury : 2 modules)

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

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

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
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
    moduleIndex: 0,
    module: null,            // etat interne du module en cours
    endReason: null,
    sensors: {},
    chat: [],
  };
}

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
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
  const { chat, sensors } = game;         // on garde le chat et les dernieres valeurs des capteurs
  game = newGame();
  game.chat = chat;
  game.sensors = sensors;
  game.status = 'running';
  send('LEDS OFF');
  send('ERRORS 0');
  send('MORSE STOP');
  startModule(0);
  update();
}

function startModule(i) {
  game.moduleIndex = i;
  game.module = currentModule().init();
  currentModule().onStart(game.module, ctx());
}

function nextModule() {
  if (game.moduleIndex + 1 < MODULES.length) startModule(game.moduleIndex + 1);
  else endGame('won', null);
}

function addError(reason) {
  if (game.status !== 'running') return;
  game.errors++;
  send('BEEP KO');
  send(`ERRORS ${game.errors}`);
  io.emit('event', { type: 'error', text: reason });
  if (game.errors >= game.maxErrors) endGame('lost', 'Trois erreurs : le saboteur a gagné');
}

function endGame(status, reason) {
  game.status = status;
  game.endReason = reason;
  send('MORSE STOP');
  send('OLEDCLR');
  send(status === 'won' ? 'OLED 2 MISSION REUSSIE' : 'OLED 2 BLACK-OUT');
}

// Quand l'Arduino (re)demarre, on lui renvoie l'etat de la partie
function resyncHardware() {
  send(`ERRORS ${game.errors}`);
  if (game.status === 'running') currentModule().onStart(game.module, ctx());
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
    remainingSec: Math.max(0, Math.ceil(game.durationSec - game.elapsedMs / 1000)),
    errors: game.errors,
    maxErrors: game.maxErrors,
    endReason: game.endReason,
    debrief: ['won', 'lost'].includes(game.status) ? MODULES.map((m) => ({ title: m.title, text: m.debrief })) : null,
    arduino: Boolean(port && port.isOpen),
    module: game.module ? {
      index: game.moduleIndex + 1,
      total: MODULES.length,
      title: m.title,
      envelope: m.envelope,
      view: m.view(game.module, game.sensors),
    } : null,
    chat: game.chat.slice(-50),
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
io.on('connection', (socket) => {
  socket.emit('state', publicState());

  socket.on('start', () => startGame());
  socket.on('reset', () => { const { sensors } = game; game = newGame(); game.sensors = sensors; send('LEDS OFF'); send('ERRORS 0'); send('MORSE STOP'); send('OLEDCLR'); update(); });

  // Chat : pseudo uniquement, aucune donnee personnelle, textes limites
  socket.on('chat', (msg) => {
    const name = String(msg?.name || 'Agent').slice(0, 20);
    const text = String(msg?.text || '').trim().slice(0, 300);
    if (!text) return;
    game.chat.push({ name, text, from: msg?.from === 'qg' ? 'qg' : 'terrain', at: Date.now() });
    game.chat = game.chat.slice(-50);
    update();
  });

  // Code tape sur l'ecran tactile (module Code de l'armoire)
  socket.on('code', (code) => {
    if (game.status !== 'running') return;
    moduleEvent({ type: 'CODE', value: NaN, raw: String(code).slice(0, 16) });
    update();
  });

  // Mode test sans Arduino : la page /?dev=1 envoie de fausses lignes serie
  socket.on('simulate', (line) => onArduinoLine(String(line).slice(0, 60)));
});

server.listen(PORT, () => {
  console.log(`Serveur pret : http://localhost:${PORT}  (agents : /agents.html)`);
  console.log(`Modules : ${MODULES.map((m) => m.id).join(', ')}`);
});
openSerial();
