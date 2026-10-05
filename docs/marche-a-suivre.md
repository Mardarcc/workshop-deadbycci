# Black-out — Marche à suivre

Guide pas à pas pour construire le jeu **tous ensemble**, étape par étape. On ne passe à l'étape suivante que quand la case « C'est bon quand… » est validée.

> Repères : **Pi** = Raspberry Pi 5 (poste QG) · **R4** = Arduino UNO R4 WiFi · **Modulino** = modules du kit Plug and Make · **Grove** = modules du Sensor Kit.

---

## Étape 0 — S'organiser (30 min)

Travailler à 5 sur la même chose, ça marche si les rôles tournent :

- **Pilote** : il tient le clavier. On change de pilote toutes les heures, pour que tout le monde touche au Pi et à l'Arduino.
- **Copilote** : il lit ce guide et la doc, et repère les erreurs.
- **Secrétaire** : il tient le **journal de bord** (ce qu'on a fait, les problèmes rencontrés, les choix et pourquoi). C'est la matière du dossier technique, et la grille note « journal » et « Git ».
- Les deux autres préparent en parallèle ce qui ne bloque pas le pilote : enveloppes papier, maquette des écrans, poster.

À faire tout de suite :

- [ ] Créer un dépôt GitHub `Workshop2025-26-M1g<n>` avec cette arborescence :

```
arduino/console/      sketch de la console
server/               serveur Node.js
server/public/        pages web (console + agents)
docs/                 fiche matériel, enveloppes, journal de bord
```

- [ ] Mettre dans `docs/` la fiche matériel et les enveloppes.

✅ **C'est bon quand** le dépôt existe et que tout le monde peut y pousser.

---

## Étape 1 — Préparer le Raspberry Pi (lundi, 1 h 30)

### 1.1 Tester l'écran en premier

1. Pi éteint, brancher l'écran tactile sur le port DSI avec la nappe prévue pour le Pi 5.
2. Démarrer le Pi sur Ubuntu Server.
3. Regarder si le texte de démarrage s'affiche **sur l'écran tactile**.

| Résultat | Décision |
| --- | --- |
| Le texte s'affiche sur l'écran | On peut garder Ubuntu, mais la suite (mode kiosque) sera plus manuelle. |
| Rien ne s'affiche | Réinstaller **Raspberry Pi OS 64 bits (avec bureau)**. |

**Notre conseil :** passer directement à Raspberry Pi OS avec bureau. L'écran, le navigateur en plein écran et le point d'accès Wi-Fi y marchent sans bricolage. Comptez 15 minutes :

1. Sur un PC, installer **Raspberry Pi Imager**.
2. Carte microSD dans le lecteur USB → *Raspberry Pi 5* → *Raspberry Pi OS (64-bit)*.
3. Dans les réglages (roue dentée) : nom d'hôte `blackout`, utilisateur et mot de passe, Wi-Fi de l'école, **activer SSH**.
4. Écrire la carte, la remettre dans le Pi, démarrer.

✅ **C'est bon quand** le bureau s'affiche sur l'écran tactile et qu'un appui du doigt déplace le curseur.

### 1.2 Se connecter au Pi depuis un PC

```bash
ssh <utilisateur>@blackout.local
```

Si `blackout.local` ne répond pas, trouvez l'adresse IP du Pi (`hostname -I` sur le Pi) et utilisez-la à la place.

✅ **C'est bon quand** tout le monde arrive à ouvrir une session SSH.

### 1.3 Installer les outils

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y git nodejs npm
node -v          # doit afficher v18 ou plus
sudo usermod -aG dialout $USER   # droit d'accès au port USB de l'Arduino
sudo reboot
```

Puis cloner le dépôt sur le Pi :

```bash
git clone https://github.com/<compte>/Workshop2025-26-M1g<n>.git
```

✅ **C'est bon quand** `node -v` répond et que le dépôt est cloné sur le Pi.

---

## Étape 2 — Découvrir l'Arduino (lundi, 1 h 30)

On programme l'Arduino **depuis un PC**, puis on le branche sur le Pi.

### 2.1 Installer l'IDE et faire clignoter une LED

1. Installer **Arduino IDE 2** : https://www.arduino.cc/en/software
2. Brancher la R4 en USB-C sur le PC.
3. *Outils → Type de carte → Gestionnaire de cartes* : installer **Arduino UNO R4 Boards**.
4. *Outils → Type de carte* : choisir **Arduino UNO R4 WiFi**, puis *Outils → Port* : choisir le port qui apparaît.
5. *Fichier → Exemples → 01.Basics → Blink*, puis le bouton **Téléverser** (flèche →).

✅ **C'est bon quand** la petite LED de la carte clignote une fois par seconde.

### 2.2 Les modules Modulino

1. *Outils → Gérer les bibliothèques* : installer **Modulino**.
2. Brancher un Modulino (par exemple le Knob) sur le connecteur Qwiic de la R4 avec un câble Qwiic.
3. *Fichier → Exemples → Modulino* : ouvrir l'exemple du module, téléverser, puis ouvrir le **Moniteur série** (loupe en haut à droite, 115200 bauds).
4. Ajouter les autres Modulino **en chaîne** (chaque module a deux connecteurs) et tester leurs exemples un par un.

✅ **C'est bon quand** chaque Modulino réagit dans son exemple. Notez dans la fiche matériel ceux qui marchent (État → OK).

### 2.3 Les modules Grove (le test critique)

1. Bibliothèques : installer **Arduino_SensorKit**.
2. Enficher le shield Grove sur la R4, **en gardant les Modulino branchés sur le Qwiic**.
3. Tester les exemples *Fichier → Exemples → Arduino_SensorKit* : bouton, potentiomètre, buzzer, écran OLED.

✅ **C'est bon quand** un exemple Grove et un exemple Modulino marchent **en même temps**. Si les Grove ne répondent pas sur la R4, empruntez une UNO au myDiL pour les Grove et notez-le dans le journal de bord.

---

## Étape 3 — Faire parler l'Arduino au Pi (lundi soir ou mardi matin, 1 h)

### 3.1 Un sketch qui envoie des messages

Sketch de test à téléverser depuis le PC (`arduino/test_serie/test_serie.ino`) :

```cpp
#include <Modulino.h>

ModulinoKnob knob;

void setup() {
  Serial.begin(115200);
  Modulino.begin();
  knob.begin();
}

void loop() {
  static int last = 9999;
  int v = knob.get();
  if (v != last) {                 // n'envoie que si la valeur change
    last = v;
    Serial.print("KNOB ");
    Serial.println(v);
  }
  if (knob.isPressed()) {
    Serial.println("KNOBPRESS");
    delay(300);                    // évite les doubles appuis
  }
  delay(20);
}
```

Testez d'abord dans le Moniteur série du PC : tourner la molette doit afficher `KNOB 1`, `KNOB 2`…

### 3.2 Brancher sur le Pi

1. Débrancher la R4 du PC et la brancher en USB sur le Pi.
2. Sur le Pi :

```bash
ls /dev/ttyACM*                              # doit afficher /dev/ttyACM0
stty -F /dev/ttyACM0 115200 raw -echo
cat /dev/ttyACM0                             # tourner la molette, Ctrl+C pour quitter
```

✅ **C'est bon quand** les messages `KNOB …` défilent dans le terminal du Pi.

---

## Étape 4 — Le serveur et l'écran (mardi, une demi-journée)

### 4.1 Serveur minimal

Sur le Pi, dans `server/` :

```bash
npm init -y
npm install express socket.io serialport @serialport/parser-readline
```

`server/index.js` :

```js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = new Server(server);

// Liaison avec l'Arduino
const port = new SerialPort({ path: process.env.SERIAL || '/dev/ttyACM0', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
port.on('error', (err) => console.error('Erreur série :', err.message));

parser.on('data', (line) => {
  line = line.trim();
  console.log('Arduino >', line);
  io.emit('arduino', line);            // envoie le message à toutes les pages ouvertes
});

io.on('connection', (socket) => {
  socket.on('cmd', (cmd) => port.write(cmd + '\n'));   // page → Arduino
  socket.on('chat', (msg) => io.emit('chat', msg));     // chat QG ↔ agents
});

server.listen(3000, () => console.log('Serveur prêt sur le port 3000'));
```

`server/public/index.html` :

```html
<!doctype html>
<meta charset="utf-8">
<title>Console Black-out</title>
<h1>Console Black-out</h1>
<pre id="log"></pre>
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
  const log = document.getElementById('log');
  socket.on('arduino', (line) => { log.textContent = line + '\n' + log.textContent; });
</script>
```

Lancer : `node index.js`, puis ouvrir `http://blackout.local:3000` sur un PC.

✅ **C'est bon quand** tourner la molette fait apparaître `KNOB …` dans la page web du PC.

### 4.2 L'écran tactile en plein écran (mode kiosque)

Sur Raspberry Pi OS avec bureau, ajouter cette ligne dans `~/.config/labwc/autostart` (créer le fichier s'il n'existe pas) :

```bash
chromium --kiosk --noerrdialogs http://localhost:3000 &
```

Sur les versions plus anciennes, la commande s'appelle `chromium-browser`.

### 4.3 Lancer le serveur au démarrage

```bash
sudo npm install -g pm2
cd ~/Workshop2025-26-M1g<n>/server
pm2 start index.js --name blackout
pm2 startup        # puis copier-coller la commande qu'il affiche
pm2 save
```

✅ **C'est bon quand**, après un `sudo reboot`, la console s'affiche toute seule en plein écran sur l'écran tactile.

---

## Étape 5 — Premier module de bout en bout : Chauffage (mardi après-midi)

On construit **un seul module complètement** avant de faire les autres. Ensuite, les autres vont beaucoup plus vite.

### 5.1 Fixer le « langage » entre l'Arduino et le serveur

Une ligne de texte par message. À noter dans le journal de bord, c'est l'une des pièces du dossier.

| Sens | Message | Signification |
| --- | --- | --- |
| Arduino → Pi | `KNOB 19` | Valeur de la molette |
| Arduino → Pi | `KNOBPRESS` | Appui sur la molette |
| Arduino → Pi | `TEMP 23.4` | Température mesurée |
| Arduino → Pi | `BTN 0` / `BTN 1` / `BTN 2` | Boutons Modulino ◀ / milieu / ▶ |
| Arduino → Pi | `VALID` | Bouton Grove « Valider » |
| Arduino → Pi | `DIST 143` | Distance en mm |
| Arduino → Pi | `POT 512` | Potentiomètre (0–1023) |
| Arduino → Pi | `TILT` | Console penchée |
| Pi → Arduino | `LED 3 ON` / `LED 3 OFF` | LED du Modulino Pixels |
| Pi → Arduino | `MORSE WATT` | Jouer un mot en morse |
| Pi → Arduino | `OLED <texte>` | Afficher sur l'OLED |
| Pi → Arduino | `ERR 2` | Nombre d'erreurs (matrice LED + bip) |

### 5.2 Le module Chauffage

1. **Arduino** : envoyer `KNOB`, `KNOBPRESS` et `TEMP` (Modulino Thermo).
2. **Serveur** : garder l'état de la partie (module actif, tour en cours, erreurs, chrono) dans un objet `game`. Au `KNOBPRESS`, comparer la valeur à la réponse attendue (voir le corrigé des enveloppes).
3. **Page console** : afficher la salle, le jour et l'heure, la dernière sortie, la température mesurée et la consigne en cours de réglage.

✅ **C'est bon quand** quelqu'un joue les 3 tours du module Chauffage avec l'enveloppe 1 en main, sans aide.

---

## Étape 6 — Les autres modules, un par un (mercredi)

Même méthode à chaque fois : Arduino → serveur → page, puis on teste avec l'enveloppe.

1. [ ] **Éclairage** : Modulino Pixels + Buttons + bouton Valider.
2. [ ] **Compteur** : OLED + potentiomètre + Valider.
3. [ ] **Code de l'armoire** : buzzer Grove en morse + clavier sur l'écran tactile.
4. [ ] **Présence** : Modulino Distance (main tenue 3 s).
5. [ ] **Commun** : chrono, compteur d'erreurs sur la matrice LED, bip d'erreur (Modulino Buzzer), anti-sabotage (Modulino Movement).

✅ **C'est bon quand** une partie complète se joue du début à la fin, avec le débriefing qui s'affiche.

---

## Étape 7 — L'interface des agents et le chat (mercredi après-midi)

1. Créer `server/public/agents.html` : une page simple pour téléphone, avec le chat, le chrono et le module actif.
2. Les téléphones se connectent au Wi-Fi, puis à `http://blackout.local:3000/agents.html`.
3. **Si le Wi-Fi de l'école bloque les appareils entre eux**, transformer le Pi en point d'accès (Raspberry Pi OS) :

```bash
sudo nmcli device wifi hotspot ifname wlan0 ssid BlackOut password "choisir-un-mot-de-passe"
```

✅ **C'est bon quand** un message tapé sur un téléphone apparaît sur l'écran du QG, et inversement.

---

## Étape 8 — Sécurité et fiabilité (jeudi matin)

Ce sont des points de la grille. Faites-les, puis notez-les dans le dossier.

- [ ] **HTTPS** : créer un certificat auto-signé et passer le serveur en `https.createServer`. Les téléphones afficheront un avertissement à accepter une fois.

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=blackout.local"
```

- [ ] **Pas de données personnelles** : les agents tapent seulement un pseudo, rien n'est conservé après la partie.
- [ ] **Reprise après incident** : le serveur écrit l'objet `game` dans un fichier JSON à chaque changement, et le relit au démarrage. Test : débrancher le Pi en pleine partie ; au redémarrage, la partie doit reprendre au même endroit.
- [ ] **Arduino débranché** : le serveur réessaie d'ouvrir le port toutes les 2 secondes au lieu de planter.
- [ ] **Plan de secours** : faire une image de la carte microSD avec le lecteur USB, et garder un jeu d'enveloppes de rechange.

✅ **C'est bon quand** le test « débrancher le Pi en pleine partie » réussit.

---

## Étape 9 — Tester avec de vrais joueurs (jeudi midi)

1. Faire jouer **un autre groupe** avec les enveloppes imprimées, sans les aider.
2. Noter où ils bloquent et combien de temps prend chaque module.
3. Ajuster : indices, chrono, tolérances.

✅ **C'est bon quand** une équipe extérieure finit la partie en moins de 20 minutes.

---

## Étape 10 — Livrables et soutenance (jeudi après-midi → vendredi)

**Dépôt jeudi**, à l'heure fixée par le coach, dans le dossier `Workshop2025-26-M1g<n>` :

- [ ] Le jeu fonctionnel (le dépôt Git et le Pi prêt à jouer)
- [ ] `Workshop2025-26-M1g<n>-dossier.pdf` : choix technologiques, architecture (schéma Arduino → Pi → écrans), algorithmes (protocole série, validation des réponses, reprise après incident), poster scientifique A3
- [ ] `Workshop2025-26-M1g<n>-pres.pptx` : présentation de chaque membre **en anglais**, fonctionnement du jeu, apport pédagogique

**Soutenance vendredi** : 5 min de pitch (tout le monde parle) + 10 min de questions. Répétez au moins deux fois jeudi soir, chrono en main, avec une démo de 2 modules.

---

## Planning récapitulatif

| Jour | Étapes | Objectif du soir |
| --- | --- | --- |
| Lundi | 0, 1, 2, (3) | Pi prêt, écran OK, chaque module Arduino testé |
| Mardi | 3, 4, 5 | Le module Chauffage se joue de bout en bout |
| Mercredi | 6, 7 | Partie complète jouable, chat sur téléphone |
| Jeudi | 8, 9, 10 | Fiabilité, test joueurs, livrables déposés |
| Vendredi | Soutenance | — |
