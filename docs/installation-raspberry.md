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

Si le dépôt GitHub est **public** :

```bash
git clone https://github.com/<compte>/<depot>.git ~/blackout
```

S'il est **privé** : créez une clé SSH sur le Pi (`ssh-keygen -t ed25519`) et ajoutez `~/.ssh/id_ed25519.pub` dans le dépôt GitHub, rubrique *Settings → Deploy keys* (accès en lecture seule, limité à ce dépôt). Puis :

```bash
git clone git@github.com:<compte>/<depot>.git ~/blackout
```

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

Depuis un PC du même réseau, ouvrez `http://192.168.x.x:3000/?dev=1` et jouez le module Chauffage.

## 4. Donner l'accès aux téléphones des agents

Les téléphones doivent être **sur le même réseau Wi-Fi que le Pi**. L'écran du QG affiche un QR code à scanner avant de lancer la partie.

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

## 5. Lancer le serveur au démarrage

```bash
sudo tee /etc/systemd/system/blackout.service > /dev/null <<EOF
[Unit]
Description=Serveur Black-out
After=network-online.target

[Service]
User=$USER
WorkingDirectory=/home/$USER/blackout/server
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=2
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now blackout
journalctl -u blackout -f            # voir les messages du serveur (Ctrl+C pour quitter)
```

Si le serveur plante, il redémarre tout seul en 2 secondes, et la partie reprend là où elle en était.

## 6. Écran tactile en plein écran (mode kiosque)

Sous **Ubuntu Server** :

```bash
sudo apt install -y cage
sudo snap install chromium
cage -- chromium --kiosk --noerrdialogs http://localhost:3000     # test depuis l'écran du Pi
```

Si la page s'affiche et répond au doigt, ajoutez le lancement automatique à la connexion sur l'écran du Pi, à la fin de `~/.bash_profile` :

```bash
if [ "$(tty)" = "/dev/tty1" ]; then exec cage -- chromium --kiosk --noerrdialogs http://localhost:3000; fi
```

Si `cage` ou Chromium refusent de démarrer au bout de 30 minutes d'essais : passez à Raspberry Pi OS avec bureau, où il suffit d'ajouter dans `~/.config/labwc/autostart` :

```bash
chromium --kiosk --noerrdialogs http://localhost:3000 &
```

## 7. Mettre à jour le code

```bash
cd ~/blackout && git pull
cd server && npm install
sudo systemctl restart blackout
```

## En cas de problème

| Symptôme | Piste |
| --- | --- |
| `Arduino introuvable` | La R4 est-elle branchée ? `ls /dev/ttyACM*` doit afficher un port. Le groupe `dialout` demande un redémarrage. |
| Les téléphones n'ouvrent pas la page | Même réseau ? Pare-feu (`ufw`) ? Essayez le partage de connexion d'un téléphone. |
| Bandeau rouge « Connexion perdue » | Le téléphone a perdu le Wi-Fi ou le serveur redémarre : la page se reconnecte toute seule. |
| L'écran affiche une ancienne version | Rechargez la page (ou redémarrez le Pi après un `git pull`). |
