// Ecran du QG : affiche le module en cours, le chrono, les erreurs et le chat
const socket = io();
const $ = (id) => document.getElementById(id);
const dev = new URLSearchParams(location.search).has('dev');
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

function renderKeyboard(screen) {
  const display = el('div', { className: 'big', id: 'typed' }, typed || '_');
  const keys = el('div', { className: 'keys' });
  for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const b = el('button', {}, c);
    b.onclick = () => { if (typed.length < 8) typed += c; display.textContent = typed; };
    keys.append(b);
  }
  const del = el('button', {}, '⌫');
  del.onclick = () => { typed = typed.slice(0, -1); display.textContent = typed || '_'; };
  const ok = el('button', { className: 'primary' }, 'Valider');
  ok.onclick = () => { socket.emit('code', typed); typed = ''; display.textContent = '_'; };
  keys.append(del, ok);
  screen.append(display, keys);
}

function renderScreen(st) {
  // On ne redessine que si le contenu change (sinon le clavier serait recree chaque seconde)
  const key = JSON.stringify([st.status, st.module, st.endReason]);
  if (key === lastScreenKey) return;
  lastScreenKey = key;

  const screen = $('screen');
  screen.replaceChildren();
  if (st.status === 'idle') {
    const box = el('div', { className: 'center' });
    box.append(el('h1', {}, 'Console prête'), el('p', { className: 'hint' }, 'Les agents terrain ont-ils leurs enveloppes ?'));
    const b = el('button', { className: 'primary' }, 'Lancer la partie');
    b.onclick = () => socket.emit('start');
    box.append(b);
    screen.append(box);
    return;
  }
  if (st.status === 'won' || st.status === 'lost') {
    const box = el('div', { className: 'center' });
    box.append(el('h1', { className: st.status }, st.status === 'won' ? 'Black-out évité !' : 'BLACK-OUT'));
    if (st.endReason) box.append(el('p', { className: 'hint' }, st.endReason));
    renderDebrief(box, st.debrief);
    const b = el('button', { className: 'primary' }, 'Nouvelle partie');
    b.onclick = () => socket.emit('start');
    box.append(b);
    screen.append(box);
    return;
  }
  const m = st.module;
  const v = m.view;
  screen.append(el('h2', {}, `Module ${m.index}/${m.total} · ${v.step}`));
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
  if (v.keyboard) renderKeyboard(screen);
}

function renderChat(chat) {
  const ul = $('messages');
  ul.replaceChildren();
  for (const msg of chat) {
    const li = el('li', { className: msg.from });
    li.append(el('b', {}, `${msg.name} : `), document.createTextNode(msg.text));
    ul.append(li);
  }
  ul.scrollTop = ul.scrollHeight;
}

socket.on('state', (st) => {
  $('timer').textContent = st.status === 'running' ? fmt(st.remainingSec) : '--:--';
  $('timer').classList.toggle('urgent', st.status === 'running' && st.remainingSec <= 60);
  $('errors').replaceChildren(...Array.from({ length: st.maxErrors }, (_, i) => el('span', { className: i < st.errors ? 'on' : '' })));
  $('arduino').classList.toggle('off', !st.arduino);
  $('arduino').textContent = st.arduino ? 'Arduino OK' : 'Arduino absent';
  renderScreen(st);
  renderChat(st.chat);
});

socket.on('event', (e) => {
  if (e.type !== 'error') return;
  const f = $('flash');
  f.textContent = `Erreur — ${e.text}`;
  f.style.display = 'block';
  setTimeout(() => { f.style.display = 'none'; }, 2500);
});

document.querySelectorAll('[data-q]').forEach((b) => {
  b.onclick = () => socket.emit('chat', { name: 'QG', text: b.dataset.q, from: 'qg' });
});

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
