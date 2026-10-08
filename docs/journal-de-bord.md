# Journal de bord — Black-out

Workshop Escape Tech · EPSI M1 · semaine du 5 au 9 octobre 2026 · groupe **Les Goules**

| Membre | Rôle principal |
| --- | --- |
| Romain MARDARGENT | Console Arduino et matériel (câblage, capteurs, protocole série) |
| Noa GUIGNOLLE | Serveur de jeu et temps réel (Node.js, Socket.io, moteur du jeu) |
| Tasha BAILLY LE ROCH | Interface tactile et UX (écran 7", téléphones des joueurs) |
| Killiann ODDO | Énigmes et contenu pédagogique (enveloppes, données réelles, débriefing) |
| Léo LEBLANC | Réseau, sécurité et documentation (Raspberry Pi, MySQL, dossier) |

Une entrée par demi-journée. On avance tous ensemble, étape par étape (`docs/marche-a-suivre.md`), avec des rôles qui tournent toutes les heures : un **pilote** au clavier, un **copilote** qui relit, un **secrétaire** qui tient ce journal.

---

### Lundi 5 octobre, matin — cadrage du projet — pilote : … , secrétaire : …

Fait :
- Lecture du sujet « Escape Tech » et de la grille d'évaluation ; liste des critères à couvrir (collaboration, division des tâches, apport pédagogique, technique, sécurité).
- Choix du concept **Black-out** : un saboteur a piraté les systèmes techniques du campus (chauffage, éclairage, détecteurs de présence, armoire électrique, compteur). Thème retenu : Environnement, sous l'angle de l'énergie du bâtiment.
- Découpage du jeu en 5 salles, une par système piraté, chacune liée à une enveloppe d'agents terrain et à un module de la console.
- Inventaire du matériel : Raspberry Pi 5 8 Go, écran tactile Freenove 7" (FNK0078), kit Arduino Plug and Make (UNO R4 WiFi + 7 Modulino : Knob, Buttons, Pixels, Distance, Thermo, Movement, Buzzer), kit Arduino Sensor Kit (shield et modules Grove). Voir `fiche-materiel-workshop.md`.
- Rédaction des 5 enveloppes des agents terrain, avec leur corrigé et le message de débriefing de chaque salle. Voir `enveloppes-agents-terrain.md`.

Problèmes rencontrés et solutions :
- Pas de découpeuse laser, et l'imprimante 3D est trop lente pour une maquette du bâtiment. → On utilise le plan d'évacuation du campus, imprimé en A3, comme carte de jeu.
- Le Sensor Kit ne contient pas de carte Arduino. → Une seule carte (UNO R4 WiFi) pilote les deux kits, à valider par un test de câblage.

Choix techniques (et pourquoi) :
- Jeu coopératif asymétrique sur le modèle de *Keep Talking and Nobody Explodes* plutôt qu'un escape game classique : le QG a la console mais pas les données, les agents ont les données mais pas la console. Les deux équipes doivent se parler pour avancer, ce qui répond directement aux critères « collaboration » et « division des tâches ».
- **QG fixe** (Raspberry Pi + écran + Arduino) branché sur secteur : le Pi 5 demande une alimentation 5 V / 5 A qu'une batterie externe classique ne fournit pas.
- **Agents terrain mobiles** avec des énigmes papier cachées dans les salles et un chat sur téléphone : le campus lui-même devient le décor du jeu.
- Énigmes construites sur des données réelles et sourcées, pour que le joueur reparte avec quelque chose : Code de l'énergie (19 °C en salle occupée, 16 °C en inoccupation courte, 8 °C hors gel au-delà de 48 h), ADEME (−7 % de consommation par degré en moins), RTE (30 g de CO₂ par kWh en France en 2024).
- Une partie de 20 minutes et 3 erreurs maximum : assez court pour enchaîner les équipes, assez de marge pour une première partie.

Pour la suite :
- Installer le Raspberry Pi et tester l'écran tactile ; prendre en main l'Arduino et les deux kits.

---

### Lundi 5 octobre, après-midi — mise en place — pilote : … , secrétaire : …

Fait :
- Création de l'arborescence du projet (`docs/`, `arduino/`, `server/`) et du dépôt Git.
- Installation d'Ubuntu Server sur la carte microSD du Raspberry Pi ; écran tactile branché sur le port DSI : l'affichage et le tactile fonctionnent.
- UNO R4 WiFi vissée sur la base Modulino, les 7 Modulino chaînés sur le connecteur Qwiic ; sketch de test qui interroge chaque Modulino et affiche ses valeurs sur le moniteur série (`arduino/test_modulino/`).
- Shield Grove enfiché sur la R4 et branchement des 6 modules Grove utilisés par le jeu : potentiomètre (A0), capteur de lumière (A3), bouton (D4), buzzer (D5), LED (D6), écran OLED 0,96" (I2C). Le kit ne fournit que 6 câbles Grove : les autres modules restent en réserve.
- Premier test sous tension : la R4 démarre, l'OLED affiche du texte, les LEDs du Modulino Pixels s'allument, le buzzer sonne.

Problèmes rencontrés et solutions :
- Le capteur température / humidité du Sensor Kit change selon la version du kit (DHT11 ou DHT20, ce dernier n'étant pas géré par la bibliothèque) → on utilise le Modulino Thermo, fiable et sur le même bus que les autres Modulino.

Choix techniques (et pourquoi) :
- Pas de MQTT ni de base de messages : un seul serveur Node.js (`serialport` + Express + Socket.io) sur le Pi. Moins de pièces à installer et à déboguer pour une équipe qui découvre l'Arduino, et une seule commande pour tout lancer (`npm start`).
- Arduino relié au Pi en USB : la même liaison fournit l'alimentation et les données, sans configuration Wi-Fi sur la carte.
- Les Grove passent par le bus I2C du shield, les Modulino par le connecteur Qwiic (second bus I2C de la R4) : pas de conflit d'adresses entre les deux kits.
- L'Arduino ne contient aucune règle du jeu : il lit les capteurs et exécute des commandes. Toute la logique est dans le serveur, plus facile à modifier et à tester sans téléverser.

Pour la suite :
- Faire parler l'Arduino au Pi en série, puis coder le premier module.

---

### Mardi 6 octobre, matin — console, serveur et les 5 modules — pilote : … , secrétaire : …

Fait :
- Installation de l'IDE Arduino 2, du support UNO R4 WiFi et des bibliothèques Modulino et Arduino_SensorKit.
- Sketch de la console (`arduino/console/console.ino`) : lecture de tous les capteurs et protocole texte à 115 200 bauds, une commande par ligne, documenté en tête du fichier.
  - Arduino → Pi : `READY` au démarrage, `KNOB` et `KNOBPRESS` (molette), `BTN 0|1|2` (boutons Modulino), `VALID` (bouton Grove), `TEMP` chaque seconde, `DIST` à chaque variation de plus de 5 mm, `POT` toutes les 100 ms, `LIGHT` toutes les 500 ms, `TILT` (console penchée), `PONG`, `ERR` pour une commande inconnue.
  - Pi → Arduino : `LED <n> ON|OFF|OK|KO`, `LEDS OFF`, `MORSE <mot>` / `MORSE STOP`, `OLED <ligne> <texte>`, `OLEDCLR`, `ERRORS <0-3>` (affiché sur la matrice LED de la R4), `BEEP OK|KO`, `GLED ON|OFF`, `PING`.
  - Anti-rebond de 30 ms sur le bouton Grove ; détection de sabotage : la console doit être penchée de plus de 30° sur 5 lectures de suite avant d'envoyer `TILT`, pour ignorer un simple choc.
- Serveur de jeu (`server/index.js`) : chrono (20 min par défaut, `DURATION=` pour changer), compteur d'erreurs (3 maximum, `TILT` compte comme une erreur), enchaînement des salles, écran du QG (`index.html`), page des agents (`agents.html`) et mode test sans Arduino (`/?dev=1`, boutons qui simulent les capteurs).
- Détection automatique du port de l'Arduino par l'identifiant USB du fabricant, et reconnexion si le câble est débranché.
- Les 5 modules, un fichier chacun dans `server/modules/` :
  - **Chauffage** (`chauffage.js`) : 3 tours (Amphi, Salle Info 1, CDI). Le saboteur a mis la consigne à 24 °C ; le QG la règle à la molette (de 5 à 25 °C) et valide en appuyant dessus. Bonne réponse selon la dernière sortie de la salle et l'heure du jeu : 8 °C (Amphi, vide depuis vendredi), 19 °C (Salle Info 1, badge actif), 16 °C (CDI, vide depuis lundi midi).
  - **Éclairage** (`eclairage.js`) : les 8 LEDs du Modulino Pixels représentent les 8 salles du plan, toutes allumées au départ. Le QG déplace un curseur avec les boutons gauche / droite, allume ou éteint avec celui du milieu, et valide avec le bouton Grove. Seules les salles 1, 3, 4 et 7 doivent rester allumées.
  - **Présence** (`presence.js`) : 3 capteurs à recalibrer (C-12, C-27, C-35). Les agents calculent le rayon de détection ; maquette au 1/10, donc rayon en mètres × 100 = distance en millimètres (145, 336 et 220 mm). Le QG tient la main au-dessus du Modulino Distance à ± 2 cm pendant 3 s, avec une jauge de progression à l'écran.
  - **Code de l'armoire** (`code.js`) : le buzzer Grove joue « WATT » en morse en boucle (point 150 ms, trait 450 ms, 1 s entre les lettres, 5 s entre deux répétitions). Les agents le décodent puis le chiffrent par décalage de César, le décalage étant le numéro de la salle où est cachée l'enveloppe 4 (`SALLE_ENVELOPPE`, 3 par défaut → « ZDWW »). Le QG tape le code sur un clavier tactile.
  - **Compteur** (`compteur.js`) : l'OLED affiche deux index du compteur (vendredi 18 h : 48 120 kWh, lundi 8 h : 50 520 kWh). Les agents calculent le CO₂ dû au sabotage : (50 520 − 48 120 − 600) kWh × 30 g = 54 kg. Le QG règle le potentiomètre (0 à 100 kg) à ± 2 kg et valide.
- Débriefing pédagogique en fin de partie : un message par salle, avec la donnée réelle et sa source.
- Partie testée de bout en bout en simulation, puis avec la vraie console branchée sur un PC : les 5 modules fonctionnent.
- PDF à imprimer générés : enveloppes des agents (A4) et plan du campus (A3) dans `docs/impression/`.

Problèmes rencontrés et solutions :
- Installation du support UNO R4 interrompue (« server sent GOAWAY », coupure réseau) → relancée avec succès.
- Bibliothèque Arduino_SensorKit absente à la compilation → installée depuis le gestionnaire de bibliothèques.
- Le serveur cherchait l'Arduino sur `/dev/ttyACM0` (nom Linux) alors qu'il tournait sous Windows (`COM3`…) → détection automatique du port, quel que soit le système.
- Sous Windows, le serveur plantait en sauvegardant la partie (« EPERM rename », fichier ouvert au même moment par l'antivirus ou la synchronisation OneDrive) → écriture directe si le renommage est refusé, et une sauvegarde ratée est signalée sans arrêter le jeu.

Choix techniques (et pourquoi) :
- Chaque module expose la même interface (`init`, `onStart`, `onEvent`, `view`, `debrief`) : le moteur ne connaît aucune salle en particulier, et ajouter une salle ne touche pas au moteur. La liste des salles se choisit au lancement (`MODULES=chauffage,eclairage`), ce qui permet une démo courte.
- Les bonnes réponses restent sur le serveur : `view()` n'envoie aux écrans que ce qu'il faut afficher, jamais la réponse attendue. Impossible de tricher en inspectant la page.
- État de la partie sauvegardé chaque seconde dans un fichier JSON (écriture dans un fichier temporaire puis renommage, pour ne jamais laisser un fichier à moitié écrit). Le chrono n'avance que quand le serveur tourne : une coupure ne fait pas perdre de temps aux joueurs.
- Le module Présence valide sur la durée (3 s dans la tolérance) : un geste au hasard ne suffit pas.
- Les valeurs analogiques (potentiomètre, lumière) sont envoyées à intervalle fixe plutôt qu'à chaque micro-variation, pour ne pas saturer la liaison série.

Pour la suite :
- Corrigé pour les organisateurs, chat temps réel, interface tactile, passage sur le Raspberry Pi.

---

### Mardi 6 octobre, après-midi — chat, interface tactile et séquences de la console — pilote : … , secrétaire : …

Fait :
- Corrigé pour les organisateurs en PDF, avec les codes de l'enveloppe 4 pour chaque salle de cachette possible (1 à 8).
- Chat temps réel QG ↔ agents (`chat.js`, partagé par les deux pages) : messages instantanés et horodatés, historique envoyé à chaque nouveau téléphone qui se connecte, vibration et bip à la réception, bandeau « Connexion perdue » si le Wi-Fi décroche et reconnexion automatique.
- QR code généré par le serveur (bibliothèque `qrcode`) sur l'écran du QG pour ouvrir la page des agents sans taper d'adresse.
- Guide d'installation du Raspberry Pi (`docs/installation-raspberry.md`) ; `npm start` ouvre Chromium en plein écran sur le Pi via `cage`, un compositeur Wayland minimal adapté à Ubuntu Server (pas de bureau à installer).
- Interface aux couleurs du réseau CCI (rose #E50043, bleu marine #004379, turquoise #2BB6B7), pensée pour l'écran 7" en 800 × 480 : gros boutons, pas de zoom ni de sélection de texte, curseur masqué, police lisible à bout de bras. Clavier AZERTY à l'écran pour le code de l'armoire.
- Animations plein écran sur le QG et les téléphones : salle sécurisée, erreur, victoire, black-out.
- Séquence de victoire sur la console à chaque salle réussie (`VICTORY`) : arc-en-ciel qui tourne sur les 8 LEDs à 25 images par seconde, coche sur la matrice LED de la R4 et mélodie sur le Modulino Buzzer, pendant 2,6 s ; en fin de partie (`VICTORY FINAL`), fanfare plus longue de 5 s.
- Séquence de défaite (`DEFEAT`, 3,4 s) : LEDs rouges qui clignotent puis s'éteignent une à une sur un jingle qui descend, croix sur la matrice jusqu'à la partie suivante.

Problèmes rencontrés et solutions :
- Chauffage : en tournant la molette au-delà de 25 °C, la consigne restait bloquée au retour → la référence de la molette est recalée quand on atteint une butée.
- Écran de fin : le titre était coupé en haut quand le débriefing est long → le contenu défile depuis le haut.

Choix techniques (et pourquoi) :
- Chat sur ses propres événements Socket.io (`chat:send`, `chat:message`, `chat:history`) : chaque message part tout de suite, sans renvoyer tout l'état du jeu à chaque fois.
- Sécurité du chat : pseudo uniquement (aucune donnée personnelle), 300 caractères maximum, un message toutes les 0,5 s par appareil, affichage en texte brut (`textContent`, jamais de HTML injecté ; testé avec une balise `<script>`).
- Animations de la console sans `delay()` : chaque séquence avance par petites étapes dans la boucle principale (`millis()`), donc les capteurs restent lus pendant les animations. À la dernière erreur, pas de bip d'erreur pour ne pas couper le jingle de défaite.
- Code couleur constant : rose pour les actions et les alertes, turquoise pour la réussite, compris d'un coup d'œil même en pleine partie.

Pour la suite :
- Installer le jeu sur le Pi, relire tout le code, préparer les livrables.

---

### Mercredi 7 octobre, matin — relecture du code, historique et score — pilote : … , secrétaire : …

Fait :
- Suivi des tâches dans GitHub : une issue par tâche, rangée par étape de la marche à suivre (étiquettes), et un jalon par jour (script `tools/github-issues/`, à lancer avec un jeton personnel).
- Affiche A4 du QR code des agents (`/qr.html`). Adresse du QR code fiabilisée : Wi-Fi en priorité, cartes réseau virtuelles (WSL, VirtualBox, VPN) ignorées, variable `AGENTS_URL` pour forcer l'adresse si besoin. L'écran du QG et l'affiche utilisent la même adresse, fournie par `/api/info`.
- Relecture complète du code (serveur, 5 modules, pages, sketch) et corrections ci-dessous.
- Pilotage réservé à l'écran du QG : les commandes (`start`, `reset`, `code`, `simulate`) ne sont acceptées que depuis le Pi lui-même. Un téléphone qui ouvre la page du QG la voit en lecture seule, avec un bandeau qui l'indique. Abandon d'une partie par un appui long de 3 s sur « BLACK-OUT · QG » (pas de bouton qu'on toucherait par erreur).
- Historique des parties dans MySQL :
  - `server/db/blackout.sql` : table `parties` (début, fin, résultat, raison, durée prévue, temps joué, erreurs, salles réussies, liste des salles, score, drapeau `demo`) et table `etapes` (temps et erreurs de chaque salle) ; 10 parties de démonstration marquées « démo » pour que la page ne soit pas vide.
  - `server/historique.js` : pool de connexions `mysql2`, une ligne créée au lancement de la partie, complétée à la fin avec chaque étape.
  - Page `historique.html` : nombre de parties, taux de victoire, meilleurs scores, temps moyen par salle (la salle la plus difficile ressort tout de suite).
- Score selon la rapidité (`server/score.js`) : victoire = 1 000 + bonus de rapidité (1 000 × temps restant / temps total) − 150 par erreur ; défaite = 100 par salle sécurisée ; jamais en dessous de 0. Exemple : victoire en 12 min sur 20 avec 1 erreur = 1 000 + 400 − 150 = 1 250 points.
- Écran du QG : heure de l'histoire (« Nous sommes mardi 14 h 20 », dans `server/scenario.js`, la même pour toutes les énigmes) à côté du chrono, et encadré d'aide au calcul pour les salles Présence et Compteur (les formules, pas les valeurs).

Problèmes rencontrés et solutions :
- Le serveur plantait au démarrage quand la sauvegarde venait d'une partie avec d'autres salles (ex. démo à 2 salles, puis lancement à 5) → la sauvegarde enregistre la liste des salles et est ignorée si elle ne correspond pas.
- Après un redémarrage du serveur seul, la console restait sur l'ancien affichage → le serveur lui renvoie l'état de la salle en cours dès qu'elle répond `READY`.

Choix techniques (et pourquoi) :
- Commandes acceptées seulement depuis `localhost` : pas de mot de passe à taper sur l'écran tactile, et les agents ne peuvent pas piloter le jeu depuis leur téléphone. Variable `DEV=1` pour lever la restriction pendant le développement.
- MySQL facultatif : si la base est absente ou éteinte, le jeu continue normalement et seule la page historique l'indique.
- Sécurité de la base : requêtes préparées (pas d'injection SQL), utilisateur `blackout` limité à `SELECT` et `INSERT` sur sa seule base, mot de passe dans `server/db/config.json`, exclu du dépôt Git (`config.example.json` sert de modèle).
- Score proportionnel au temps restant : comparable entre une partie de 20 min et une démo de 7 min.
- Aide au calcul sans les données : le jeu devient plus accessible, mais le QG a toujours besoin des agents pour les valeurs.

Pour la suite :
- Installer le jeu sur le Pi, finaliser le scénario et l'interface, préparer la présentation.

---

### Mercredi 7 octobre, après-midi — scénario, installation sur le Pi et présentation — pilote : … , secrétaire : …

Fait :
- Scénario finalisé : tel un gréviste, le saboteur veut consolider le blocus du campus, en soutien aux lycéens mobilisés, en provoquant un black-out général. Un briefing de mission défile sur l'accueil du QG, à droite du QR code ; un toucher le met en pause pour lire tranquillement.
- Générique de fin avec le logo du campus CCI Eure-et-Loir (`img/logo-cci.png`) : en victoire, fond rose CCI, « Vous avez déjoué le blocus ! », score qui défile jusqu'à sa valeur et signature « BLACK-OUT · CCI, le jeu » ; en défaite, fond bleu nuit et « Black-out ». Textes de réussite harmonisés sur le QG et les téléphones (« Blocus déjoué ! »).
- Installation du jeu sur le Raspberry Pi : Node.js, `npm install`, ajout de l'utilisateur au groupe `dialout` pour l'accès au port série, Chromium (snap) et `cage` pour le mode kiosque.
- Version du code (dernier commit Git) affichée en bas de l'accueil, pour vérifier d'un coup d'œil que le Pi est à jour.
- Première partie test sur la console installée sur le Pi.
- Accueil repensé pour le 7" : boutons côte à côte, accès à l'historique, message d'attente dans le chat vide. Après chaque partie, « Nouvelle partie » ramène à l'accueil (QR code, briefing, chat vidé, console remise à zéro : LEDs éteintes, erreurs à 0, morse coupé, OLED « BLACK-OUT ») pour l'équipe suivante.

Problèmes rencontrés et solutions :
- Sur le Pi, Chromium se fermait aussitôt (code 1) sans message → sous `cage` (affichage Wayland), il fallait l'option `--ozone-platform=wayland`. Les dernières lignes d'erreur de Chromium s'affichent maintenant dans le terminal, et le serveur arrête de relancer le navigateur après 3 échecs rapides.
- `sudo npm start` empêchait Chromium de démarrer (refus de tourner en root, et `/run/user/0` inaccessible) → le jeu se lance sans `sudo`, l'accès à l'Arduino passe par le groupe `dialout`, et le serveur affiche un message clair s'il est lancé en root au lieu d'ouvrir le navigateur.
- Le Pi affichait une ancienne version de la page → pages servies avec l'en-tête `Cache-Control: no-store` et Chromium lancé en navigation privée (`--incognito`).
- Au lancement, l'ancienne partie reprenait toute seule (il restait 7 min d'une partie de test) → l'accueil propose « Reprendre » (même salle, même chrono, mêmes erreurs) ou « Nouvelle partie ». Une partie interrompue depuis plus de 2 h n'est plus proposée.
- La zone du briefing poussait les boutons hors de l'écran → hauteur fixe, texte coupé avec un fondu.
- Lancé en SSH, le serveur essayait d'ouvrir Chromium sans écran → l'ouverture du navigateur est ignorée dans une session SSH.

Choix techniques (et pourquoi) :
- Pas de `--no-sandbox` pour Chromium : ce serait désactiver une protection de sécurité juste pour contourner une erreur de lancement.
- Reprise après incident à la demande : après une démo interrompue, on ne retombe pas sur une vieille partie ; après une vraie coupure, un toucher suffit.
- Logo officiel du campus utilisé tel quel, dans un disque blanc pour rester lisible sur le fond rose ; si l'image manque, le générique affiche « BLACK-OUT » à la place.

Pour la suite :
- Peaufiner le jeu sur le vrai matériel, finaliser la présentation et les livrables.

---

### Jeudi 8 octobre, matin — peaufinage de la console, du Pi et de la présentation — pilote : … , secrétaire : …

Fait :
- Console Arduino : sketch `console` retéléversé avec les séquences de victoire et de défaite, vérification de chaque capteur sur la console montée (moniteur série, puis mode test du serveur), réglage du pas de la molette (`KNOB_STEP`) et des tolérances après les parties test, câbles et modules fixés pour le transport.
- Raspberry Pi :
  - démarrage automatique sur la console en plein écran : connexion automatique de l'utilisateur sur la console (`agetty --autologin`) et lancement du jeu depuis `~/.bash_profile` ;
  - MySQL installé, base `blackout` importée, utilisateur aux droits minimaux, page historique vérifiée ;
  - connexion au partage de connexion d'un téléphone via netplan (Ubuntu Server n'a pas NetworkManager) : le QR code suit automatiquement la nouvelle adresse ;
  - test de coupure en pleine partie : au redémarrage, l'accueil propose bien « Reprendre ».
- Présentation (`livrables/Workshop2025-26-M1gX-pres.pptx`, 13 slides) construite sur le sujet : les deux slides obligatoires, la présentation de l'équipe en anglais, les notes de l'orateur sous chaque slide, des captures du vrai jeu. Ajout des noms des membres et du groupe, de la vidéo de fin en avant-dernière slide (14 s, plein écran, avec le son, lecture automatique) et des transitions entre les slides (fondu, fondu au noir sur la première et sur la vidéo, poussée vers le haut sur les slides qui ouvrent une partie).

Problèmes rencontrés et solutions :
- En diaporama, la vidéo de fin restait figée → vidéo réencodée dans les formats les plus sûrs pour PowerPoint (H.264 profil Main, son AAC-LC au lieu de HE-AAC) et insérée comme le fait PowerPoint lui-même, avec un déclenchement automatique à l'arrivée sur la slide. Secours : onglet Lecture → Démarrer : Automatiquement.
- Une version de la présentation modifiée en parallèle par un membre de l'équipe → ses changements (noms, groupe) ont été reportés dans le script qui génère la présentation avant de la régénérer.

Choix techniques (et pourquoi) :
- Présentation générée par script (pptxgenjs, puis python-pptx pour la vidéo et les transitions) : on peut la reconstruire en une commande après chaque changement de contenu, sans refaire la mise en page à la main.

Pour la suite :
- Finitions de l'interface et des fiches, livrables.

---

### Jeudi 8 octobre, après-midi — peaufinage de l'interface et des fiches, livrables — pilote : … , secrétaire : …

Fait :
- Interface : passe complète sur le vrai écran 7" (lisibilité, taille des zones tactiles), parcours testé de bout en bout (accueil → partie → générique de fin → nouvelle partie → accueil), chat testé avec plusieurs téléphones en même temps.
- Fiches : relecture des enveloppes, impression des enveloppes (A4), du plan du campus (A3), du corrigé et de l'affiche QR code ; enveloppes cachées dans les salles et salle de l'enveloppe 4 réglée dans le jeu (`SALLE_ENVELOPPE` dans `code.js`).
- Plan de secours : image de la carte microSD du Pi, jeu d'enveloppes de rechange, jeu installable sur un PC portable (`npm start` fonctionne aussi sous Windows, avec la même console en USB).
- Livrables : finalisation du dossier technique, du poster A3 et de la présentation.
- Documentation à jour : marche à suivre (tableau d'avancement), guide d'installation du Pi (MySQL, mise à jour, tableau « En cas de problème » avec les erreurs rencontrées cette semaine), README.

Pour vendredi :
- Déposer les livrables à l'heure fixée par le coach (dossier `Workshop2025-26-M1g<n>`).
- Installer la console avant la soutenance : Pi, écran, partage de connexion, vérification « Arduino OK » et accès d'un téléphone par le QR code.
- Vérifier sur l'ordinateur de la soutenance que la vidéo démarre seule et que le son sort.

---

## Bilan de la semaine

Ce qui fonctionne :
- Un jeu complet et jouable : 5 salles sur la vraie console (7 Modulino + 6 modules Grove), un QG sur écran tactile, des agents sur téléphone reliés par un chat temps réel, un débriefing pédagogique basé sur des données réelles et sourcées.
- Une architecture simple et modulaire : un seul serveur Node.js, un protocole série lisible, un fichier par salle ; ajouter une salle ne touche ni au moteur ni à l'Arduino.
- Une installation autonome : le Raspberry Pi démarre directement sur la console du QG, propose de reprendre une partie interrompue et garde l'historique et les scores des parties.
- Une sécurité pensée dès le départ : aucune donnée personnelle, réponses gardées sur le serveur, chat protégé, pilotage réservé au QG, réseau fermé, base de données aux droits minimaux, mot de passe hors du dépôt.

Ce qu'on améliorerait avec plus de temps :
- Chiffrer les échanges en HTTPS (aujourd'hui, le jeu tourne sur un réseau local fermé, sans données personnelles).
- Tirer au hasard les valeurs des énigmes (salles, capteurs, mot, index) pour qu'une même équipe puisse rejouer.
- Ajouter des salles et une version accessible aux joueurs daltoniens ou malvoyants (sons, contrastes renforcés).
