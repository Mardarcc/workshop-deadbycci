# Installer Black-out sur le Raspberry Pi

Objectif : le Raspberry Pi fait tourner le serveur du jeu, affiche la console du QG sur l'écran tactile, et les téléphones des agents s'y connectent pour le chat.

> **Pas besoin de l'IDE Arduino sur le Pi.** Le sketch `console` est déjà enregistré dans la mémoire de la R4 : il y reste même débranchée. On ne retéléverse depuis un PC que si on modifie le sketch.

---

## 1. Installer les outils (une seule fois)

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y git nodejs npm build-essential python3
node -v                              # v18 ou plus
sudo usermod -aG dialout $USER       # accès au port USB de l'Arduino
sudo reboot
```

`build-essential` et `python3` servent seulement si `npm install` doit recompiler la bibliothèque série.

## 2. Récupérer le code

```bash
git clone https://github.com/<compte>/<depot>.git ~/blackout
```

Si le dépôt est **privé**, Git demande un identifiant : le nom du compte GitHub, puis, à la place du mot de passe, un jeton d'accès en lecture seule limité à ce dépôt (GitHub → *Settings → Developer settings → Fine-grained tokens*, droit *Contents : Read-only*).

Ne copiez pas le dossier `node_modules` depuis Windows : il doit être installé sur le Pi.

## 3. Premier test en local

Branchez la R4 en USB sur le Pi, puis :

```bash
cd ~/blackout/server
npm install
npm start
```

Le terminal doit afficher :

```
Arduino connecte sur /dev/ttyACM0
Telephones des agents : http://192.168.x.x:3000/agents.html
```

Pour piloter le jeu depuis un PC du même réseau, relancez le serveur avec `DEV=1 npm run serveur`, ouvrez `http://192.168.x.x:3000/?dev=1` et jouez le module Chauffage. Sans `DEV=1`, seul l'écran du Pi peut lancer ou réinitialiser une partie : les autres appareils voient la console en lecture seule (c'est voulu, pour que les agents ne puissent pas tricher depuis leur téléphone).

## 4. Donner l'accès aux téléphones des agents

Les téléphones doivent être **sur le même réseau Wi-Fi que le Pi**. L'écran du QG affiche un QR code à scanner avant de lancer la partie.

Pour que les agents puissent rejoindre le chat pendant la partie, imprimez l'affiche du QR code : ouvrez `http://<adresse>:3000/qr.html` une fois le Pi sur le réseau final, écrivez le nom du Wi-Fi sur la ligne prévue, puis **Imprimer**. Réimprimez si l'adresse du Pi change. Si le QR code pointe vers une mauvaise adresse, forcez-la : `AGENTS_URL=http://192.168.x.x:3000/agents.html npm start`.

| Solution | Quand l'utiliser |
| --- | --- |
| **Wi-Fi de l'école** | Testez : un téléphone ouvre l'adresse affichée par le serveur. Si la page ne charge pas, le réseau isole les appareils entre eux → solution suivante. |
| **Partage de connexion d'un téléphone** (recommandé en soutenance) | Un téléphone de l'équipe fait point d'accès ; le Pi et les autres téléphones s'y connectent. Fiable, ne dépend pas du réseau de l'école. |
| **Le Pi en point d'accès** | Sous Raspberry Pi OS : `sudo nmcli device wifi hotspot ifname wlan0 ssid BlackOut password "motdepasse"`. Sous Ubuntu Server, NetworkManager n'est pas installé par défaut : préférez le partage de connexion d'un téléphone. |

Pour connecter le Pi (Ubuntu Server) au partage de connexion du téléphone, éditez le fichier présent dans `/etc/netplan/` (souvent `50-cloud-init.yaml`) :

```yaml
network:
  version: 2
  wifis:
    wlan0:
      dhcp4: true
      access-points:
        "NomDuPartage":
          password: "motdepasse"
```

puis `sudo netplan apply`. L'adresse du Pi change : relancez le serveur, il affiche la nouvelle adresse et le QR code suit.

Si un pare-feu est actif (`sudo ufw status`), ouvrez le port : `sudo ufw allow 3000/tcp`.

## 5. `npm start` ouvre aussi l'écran du QG

Sur le Raspberry Pi, `npm start` lance le serveur **puis ouvre Chromium en plein écran** sur `http://localhost:3000`. Si le navigateur se ferme, il se rouvre au bout de 5 secondes.

| Situation | Ce que fait `npm start` |
| --- | --- |
| Raspberry Pi OS avec bureau | Ouvre Chromium directement en plein écran |
| Ubuntu Server, lancé **depuis l'écran du Pi** (clavier branché) | Ouvre Chromium dans `cage`, un affichage minimal sans bureau |
| Lancé **par SSH** depuis un PC | Pas d'écran disponible : le serveur tourne quand même, sans navigateur |
| Sur un PC Windows | N'ouvre rien (le serveur seul, comme avant) |

Serveur seul, sans écran : `npm run serveur` (ou `KIOSK=0 npm start`).

Sous **Ubuntu Server**, installez une fois l'affichage minimal et Chromium :

```bash
sudo apt install -y cage
sudo snap install chromium
```

Puis testez depuis l'écran du Pi (pas par SSH) : `cd ~/blackout/server && npm start`.

Si Chromium ne s'ouvre pas, le terminal affiche maintenant ses erreurs (« Erreurs de cage / Chromium »). Pour tester à la main, **depuis l'écran du Pi** :

```bash
cage -- chromium --ozone-platform=wayland http://localhost:3000
```

| Erreur affichée | Solution |
| --- | --- |
| `Missing X server or $DISPLAY` | Chromium cherche X11 au lieu de Wayland : faites `git pull` (le serveur ajoute `--ozone-platform=wayland` depuis mercredi). |
| `Could not … seat`, `backend`, `permission denied` sur `/dev/dri` | Lancez depuis une session ouverte sur l'écran du Pi (pas par SSH, pas avec `sudo`). Si besoin : `sudo usermod -aG video,render,input $USER` puis redémarrez. |
| `Running as root without --no-sandbox`, `cannot create directory '/run/user/0'`, ou « Lancé avec sudo (root) » | Ne lancez **jamais** le jeu avec `sudo` : `npm start` tout court. Si des fichiers ont été créés en root, rendez-les à votre utilisateur : `sudo chown -R $USER:$USER ~/blackout`. Si l'Arduino est refusé sans sudo : `sudo usermod -aG dialout $USER`, puis redémarrez. |
| `Session SSH : pas d'écran ici` | Normal : par SSH, il n'y a pas d'écran. Lancez `npm start` sur l'écran du Pi ou utilisez le démarrage automatique (section 6). |

## 6. Tout lancer automatiquement à l'allumage du Pi

**Ubuntu Server** : connexion automatique sur l'écran du Pi, qui lance `npm start`.

```bash
sudo systemctl edit getty@tty1
```

Collez ces lignes (remplacez `<utilisateur>` par votre nom d'utilisateur), enregistrez, quittez :

```ini
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin <utilisateur> --noclear %I $TERM
```

Puis ajoutez à la fin de `~/.bash_profile` :

```bash
if [ "$(tty)" = "/dev/tty1" ]; then
  cd ~/blackout/server && npm start
fi
```

`sudo reboot` : la console du QG s'affiche toute seule. Si le serveur plante, la session se termine et se relance automatiquement : l'accueil du QG affiche alors « Partie interrompue » avec un bouton **Reprendre** (même salle, même chrono), ou « Nouvelle partie » pour repartir de zéro.

**Raspberry Pi OS avec bureau** : ajoutez cette ligne à `~/.config/labwc/autostart` :

```bash
cd ~/blackout/server && npm start &
```

## 7. Historique des parties (MySQL)

Facultatif : sans base de données, le jeu marche normalement et la page « Historique » explique pourquoi elle est vide. Avec la base, chaque partie terminée est enregistrée (résultat, temps, erreurs, score, temps de chaque salle) et la page `http://<adresse>:3000/historique.html` affiche les statistiques et les meilleurs scores.

**Sur le Pi (Ubuntu Server) :**

```bash
sudo apt install -y mysql-server
sudo mysql < ~/blackout/server/db/blackout.sql
sudo mysql -e "CREATE USER 'blackout'@'localhost' IDENTIFIED BY 'choisir-un-mot-de-passe';
               GRANT SELECT, INSERT ON blackout.* TO 'blackout'@'localhost';"
cp ~/blackout/server/db/config.example.json ~/blackout/server/db/config.json
nano ~/blackout/server/db/config.json      # remplacer A_CHANGER par le mot de passe choisi
```

Relancez le jeu : le terminal affiche `Historique : base MySQL "blackout" sur localhost`.

- `blackout.sql` crée la base, les tables `parties` et `etapes`, et 10 parties **fictives** de démonstration (marquées « démo » sur la page). Pour les retirer avant la soutenance : `sudo mysql blackout -e "DELETE FROM parties WHERE demo = TRUE;"`.
- **Attention : relancer `blackout.sql` efface tout l'historique** (il recrée les tables).
- L'utilisateur `blackout` ne peut que lire et ajouter des parties (pas modifier ni supprimer), et MySQL n'écoute que sur le Pi lui-même.
- `server/db/config.json` contient le mot de passe : il n'est pas envoyé sur GitHub (`.gitignore`).

**Sur un PC (pour tester)**, avec un serveur MySQL local, dans Git Bash depuis le dossier du projet :

```bash
mysql -u root -p < server/db/blackout.sql
mysql -u root -p -e "CREATE USER 'blackout'@'localhost' IDENTIFIED BY 'test'; GRANT SELECT, INSERT ON blackout.* TO 'blackout'@'localhost';"
cp server/db/config.example.json server/db/config.json     # puis mettre "test" comme mot de passe
```

(PowerShell ne connaît pas `<` : utilisez Git Bash, ou ouvrez `blackout.sql` dans MySQL Workbench et exécutez-le.)

## 8. Mettre à jour le code

```bash
cd ~/blackout && git pull
cd server && npm install
sudo reboot                           # ou Ctrl+C puis npm start sur l'écran du Pi
```

## En cas de problème

| Symptôme | Piste |
| --- | --- |
| `Arduino introuvable` | La R4 est-elle branchée ? `ls /dev/ttyACM*` doit afficher un port. Le groupe `dialout` demande un redémarrage. |
| Les téléphones n'ouvrent pas la page | Même réseau ? Pare-feu (`ufw`) ? Essayez le partage de connexion d'un téléphone. |
| Bandeau rouge « Connexion perdue » | Le téléphone a perdu le Wi-Fi ou le serveur redémarre : la page se reconnecte toute seule. |
| L'écran affiche une ancienne version (pas de briefing, pas de QR code…) | Comparez la « Version du code » en bas de l'accueil du QG avec `git log -1 --format=%h` sur le Pi. Si elles diffèrent ou si le commit est ancien : poussez depuis le PC (`git push`), puis `git pull` sur le Pi et relancez. Le navigateur ne garde plus de cache des pages du jeu. |
| Pas de QR code sur l'accueil | Le Pi n'a pas d'adresse réseau : connectez-le au Wi-Fi (section 4), puis relancez le serveur. |
| Bandeau « Lecture seule », les boutons ne font rien | La page n'est pas ouverte sur le Pi. Pour tester depuis un PC : `DEV=1 npm run serveur`. |
| « Sauvegarde ignorée » au démarrage | Normal si la liste des modules a changé (ex. démo `MODULES=chauffage,eclairage`) : une partie neuve démarre. |
| Bloqué en pleine partie | Appui long de 3 s sur « BLACK-OUT · QG », puis confirmer : retour à l'écran d'accueil. |
| Page « Historique indisponible » | Lisez la raison affichée : `config.json` absent (section 7), mot de passe refusé (`ER_ACCESS_DENIED_ERROR`), ou MySQL arrêté (`sudo systemctl start mysql`). Le jeu, lui, continue de marcher. |
