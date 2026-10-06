// Page des agents terrain (telephones) : chrono, module en cours et chat
const socket = io();
const $ = (id) => document.getElementById(id);

// Pseudo uniquement (aucune donnee personnelle), garde sur ce telephone
let name = '';
try { name = localStorage.getItem('pseudo') || ''; } catch { /* stockage indisponible */ }
if (!name) {
  name = (prompt('Votre pseudo d\'agent ?') || 'Agent').slice(0, 20);
  try { localStorage.setItem('pseudo', name); } catch { /* stockage indisponible */ }
}

const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

socket.on('state', (st) => {
  $('timer').textContent = st.status === 'running' ? fmt(st.remainingSec) : '--:--';
  $('timer').classList.toggle('urgent', st.status === 'running' && st.remainingSec <= 60);
  const errs = [];
  for (let i = 0; i < st.maxErrors; i++) {
    const s = document.createElement('span');
    if (i < st.errors) s.className = 'on';
    errs.push(s);
  }
  $('errors').replaceChildren(...errs);

  if (st.status === 'running' && st.module) {
    $('module').textContent = `${st.module.index}/${st.module.total} · ${st.module.title}`;
    $('envelope').textContent = `Cherchez l'enveloppe ${st.module.envelope}.`;
  } else if (st.status === 'won') {
    $('module').textContent = 'Black-out évité !';
    $('envelope').textContent = '';
  } else if (st.status === 'lost') {
    $('module').textContent = 'BLACK-OUT';
    $('envelope').textContent = st.endReason || '';
  } else {
    $('module').textContent = 'En attente du QG…';
    $('envelope').textContent = '';
  }

  const ul = $('messages');
  ul.replaceChildren();
  for (const m of st.chat) {
    const li = document.createElement('li');
    li.className = m.from;
    const b = document.createElement('b');
    b.textContent = `${m.name} : `;
    li.append(b, document.createTextNode(m.text));
    ul.append(li);
  }
  ul.scrollTop = ul.scrollHeight;
});

$('form').onsubmit = (e) => {
  e.preventDefault();
  const text = $('text').value.trim();
  if (!text) return;
  socket.emit('chat', { name, text, from: 'terrain' });
  $('text').value = '';
};
