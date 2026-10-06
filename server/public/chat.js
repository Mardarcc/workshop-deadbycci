// Chat temps reel (Socket.io), partage par l'ecran du QG et les telephones des agents.
//   setupChat(socket, { me: () => 'pseudo', from: 'qg' | 'terrain', list, form, input })
function setupChat(socket, opts) {
  const { list, form, input, from } = opts;
  let unread = 0;
  const baseTitle = document.title;

  const time = (at) => new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isMine = (m) => m.from === from && m.name === opts.me();

  function add(m) {
    const li = document.createElement('li');
    li.className = `${m.from}${isMine(m) ? ' mine' : ''}`;
    const head = document.createElement('div');
    head.className = 'meta';
    const b = document.createElement('b');
    b.textContent = m.name;
    head.append(b, document.createTextNode(` · ${time(m.at)}`));
    const body = document.createElement('div');
    body.textContent = m.text;                 // texte brut : pas d'injection HTML possible
    li.append(head, body);
    list.append(li);
  }

  const scroll = () => { list.scrollTop = list.scrollHeight; };

  // Petit signal a la reception (vibration sur telephone + bip court)
  function notify() {
    try { if (navigator.vibrate) navigator.vibrate(120); } catch { /* non disponible */ }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.08);
    } catch { /* son bloque tant que l'utilisateur n'a pas touche la page */ }
    if (document.hidden) document.title = `(${++unread}) ${baseTitle}`;
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { unread = 0; document.title = baseTitle; }
  });

  socket.on('chat:history', (msgs) => {
    list.replaceChildren();
    msgs.forEach(add);
    scroll();
  });

  socket.on('chat:message', (m) => {
    add(m);
    scroll();
    if (!isMine(m)) notify();
  });

  function send(text) {
    text = String(text || '').trim();
    if (!text) return;
    socket.emit('chat:send', { name: opts.me(), text, from });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      send(input.value);
      input.value = '';
      input.focus();
    });
  }

  // Etat de la connexion, utile si le Wi-Fi decroche
  socket.on('disconnect', () => document.body.classList.add('offline'));
  socket.on('connect', () => document.body.classList.remove('offline'));

  return { send };
}

// Animation plein ecran partagee par le QG et les telephones
function showOverlaysFrom(socket) {
  const box = document.getElementById('overlay');
  if (!box) return;
  const TYPES = {
    success: { icon: '✔', title: 'Salle sécurisée !', ms: 2600 },
    error: { icon: '✖', title: 'Erreur', ms: 2000 },
    won: { icon: '★', title: 'Black-out évité !', ms: 4000 },
  };
  let timer = null;
  socket.on('event', (e) => {
    const t = TYPES[e.type];
    if (!t) return;
    box.className = '';
    void box.offsetWidth;                       // relance l'animation
    box.className = `show ${e.type}`;
    box.querySelector('.icon').textContent = t.icon;
    box.querySelector('.title').textContent = t.title;
    box.querySelector('.sub').textContent = e.text || '';
    clearTimeout(timer);
    timer = setTimeout(() => { box.className = ''; }, t.ms);
  });
  box.addEventListener('click', () => { box.className = ''; });
}
