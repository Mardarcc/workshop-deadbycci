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
    won: { icon: '★', title: 'Blocus déjoué !', ms: 4000 },
    lost: { icon: '⚡', title: 'BLACK-OUT', ms: 4500 },
  };
  let timer = null;
  let finaleEnAttente = null;     // generique de fin, joue juste apres l'animation de victoire ou de defaite
  const fermer = () => {
    box.className = '';
    if (finaleEnAttente) { showFinale(finaleEnAttente); finaleEnAttente = null; }
  };
  socket.on('event', (e) => {
    if (e.type === 'final') {
      if (box.classList.contains('show')) finaleEnAttente = e; else showFinale(e);
      return;
    }
    const t = TYPES[e.type];
    if (!t) return;
    box.className = '';
    void box.offsetWidth;                       // relance l'animation
    box.className = `show ${e.type}`;
    box.querySelector('.icon').textContent = t.icon;
    box.querySelector('.title').textContent = t.title;
    box.querySelector('.sub').textContent = e.text || '';
    clearTimeout(timer);
    timer = setTimeout(fermer, t.ms);
  });
  box.addEventListener('click', () => { clearTimeout(timer); fermer(); });
}

// Generique de fin : logo de la CCI, resultat et score qui defile (environ 8 s, toucher pour fermer).
// Logo du campus CCI (version rose) a deposer dans public/img/ : logo-cci.svg (ou logo-cci.png).
// Sans fichier, « BLACK-OUT » s'affiche a la place. Victoire : fond rose CCI, details en bleu marine.
let finaleTimer = null;
function showFinale(e) {
  let f = document.getElementById('finale');
  if (!f) {
    f = document.createElement('div');
    f.id = 'finale';
    f.innerHTML = `
      <div class="logo-wrap">
        <div class="ring"></div><div class="ring r2"></div>
        <div class="disc"><img alt="Logo de la CCI"><span class="fallback">BLACK-OUT</span></div>
      </div>
      <div class="f-title"></div>
      <div class="f-score">0</div>
      <div class="f-sub"></div>
      <div class="f-credit">BLACK-OUT · CCI, le jeu</div>`;
    const disc = f.querySelector('.disc');
    const img = f.querySelector('img');
    img.onerror = () => {
      if (img.src.endsWith('.svg')) img.src = 'img/logo-cci.png';
      else disc.classList.add('no-logo');
    };
    img.src = 'img/logo-cci.svg';
    f.addEventListener('click', () => cacher());
    document.body.append(f);
  }
  const gagne = e.status === 'won';
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  f.querySelector('.f-title').textContent = gagne ? 'Vous avez déjoué le blocus !' : 'Black-out';
  f.querySelector('.f-sub').textContent = `${mmss(e.tempsS || 0)} de jeu · ${e.sallesReussies}/${e.sallesTotal} salles sécurisées`;
  const scoreEl = f.querySelector('.f-score');
  scoreEl.textContent = '0';

  f.className = '';
  void f.offsetWidth;                          // relance les animations CSS
  f.className = `show ${gagne ? 'won' : 'lost'}`;

  // Le score defile de 0 a sa valeur
  const cible = Number(e.score) || 0;
  const debut = performance.now() + 1600;
  const tick = (now) => {
    const k = Math.min(1, Math.max(0, (now - debut) / 1400));
    scoreEl.textContent = `${Math.round(cible * (1 - (1 - k) ** 3)).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')} pts`;
    if (k < 1 && f.classList.contains('show')) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  function cacher() {
    clearTimeout(finaleTimer);
    f.classList.add('hide');
    setTimeout(() => { f.className = ''; }, 600);
  }
  clearTimeout(finaleTimer);
  finaleTimer = setTimeout(cacher, 8000);
}
