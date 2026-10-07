# Journal de bord — Black-out

Une entrée par demi-journée. Le secrétaire du moment la remplit ; elle servira telle quelle pour le dossier technique.

## Modèle d'entrée

```
### <jour> <matin/après-midi> — pilote : <prénom>, secrétaire : <prénom>

Fait :
-

Problèmes rencontrés et solutions :
-

Choix techniques (et pourquoi) :
-

Pour la prochaine fois :
-
```

---

### Lundi matin — cadrage du projet — pilote : … , secrétaire : …

Fait :
- Lecture du sujet « Escape Tech » et de la grille d'évaluation.
- Choix du concept **Black-out** : un saboteur a piraté les systèmes techniques du campus (chauffage, éclairage, détecteurs, armoire électrique, compteur). Thème imposé retenu : Environnement (énergie du bâtiment).
- Inventaire du matériel disponible : Raspberry Pi 5 8 Go, écran tactile Freenove FNK0078, kit Arduino Plug and Make (UNO R4 WiFi + 7 Modulino), kit Arduino Sensor Kit (modules Grove). Voir `fiche-materiel-workshop.md`.
- Rédaction des 5 enveloppes des agents terrain, avec corrigé et débriefing pédagogique. Voir `enveloppes-agents-terrain.md`.

Problèmes rencontrés et solutions :
- Pas de découpeuse laser, et l'imprimante 3D est trop lente pour une maquette du bâtiment → on utilise le plan d'évacuation du campus, imprimé en A3.
- Le Sensor Kit ne contient pas de carte Arduino → une seule carte (UNO R4 WiFi) pour les deux kits. À tester : shield Grove et Modulino branchés en même temps.

Choix techniques (et pourquoi) :
- Jeu coopératif asymétrique sur le modèle de *Keep Talking and Nobody Explodes* plutôt qu'un escape game classique : les deux équipes doivent communiquer pour avancer, ce qui répond aux critères « collaboration » et « division des tâches ».
- **QG fixe** (Raspberry Pi + écran + Arduino) branché sur secteur : le Pi 5 demande une alimentation 5 V / 5 A qu'une batterie externe classique ne fournit pas.
- **Agents terrain mobiles** avec des énigmes papier cachées dans les salles et un chat sur téléphone : le campus devient le décor du jeu.
- Énigmes basées sur des données réelles et sourcées : Code de l'énergie (19 / 16 / 8 °C), ADEME (−7 % par degré), RTE (30 g de CO₂ par kWh en 2024).

Pour la prochaine fois :
- Installer le Raspberry Pi et tester l'écran tactile.
- Prendre en main l'Arduino.

---

### Lundi après-midi — mise en place — pilote : … , secrétaire : …

Fait :
- Organisation : on avance tous ensemble, étape par étape, avec un pilote au clavier qui change toutes les heures. Voir `marche-a-suivre.md`.
- Création du dossier du projet (`docs/`, `arduino/`, `server/`) et préparation du dépôt Git.
- Installation du Raspberry Pi en cours (Ubuntu Server).
- Écran tactile Freenove branché sur le port DSI du Raspberry Pi : l'affichage fonctionne.
- UNO R4 WiFi vissée sur la base Modulino. Sketch de test de tous les Modulino prêt (`arduino/test_modulino/`).
- Schéma de branchement du Sensor Kit : le shield Grove s'enfiche sur la R4 ; les modules sont déjà câblés sur la carte (bouton D4, buzzer D5, LED D6, potentiomètre A0, son A2, lumière A3, OLED / accéléromètre / pression en I2C).
- Branchement des 6 modules Grove utilisés par le jeu (potentiomètre A0, lumière A3, bouton D4, buzzer D5, LED D6, OLED en I2C). Le kit ne fournit que 6 câbles Grove : les autres modules (son, pression, accéléromètre, température) restent en réserve.
- Premier test sous tension : la R4 s'allume, l'écran OLED affiche des valeurs de capteurs (un programme était déjà présent sur la carte), les Modulino Knob et Thermo sont allumés.

Problèmes rencontrés et solutions :
- Le capteur température / humidité du Sensor Kit change selon la version (DHT11 sur D3 ou DHT20 en I2C, non géré par la bibliothèque `Arduino_SensorKit`) → pour le jeu, on utilise le Modulino Thermo.
- Le Sensor Kit n'est pas annoncé compatible UNO R4 → à valider par un test (bouton + OLED) avec les Modulino branchés en même temps.

Choix techniques (et pourquoi) :
- Pas de MQTT : un seul serveur Node.js (serialport + Express + Socket.io) sur le Pi. Moins de pièces à installer et à déboguer pour une équipe qui découvre l'Arduino.
- L'Arduino est relié au Pi en USB : la même liaison fournit l'alimentation et les données (série), sans configuration Wi-Fi.
- Les Grove passent par le bus I2C du shield, les Modulino par le connecteur Qwiic : deux bus séparés, donc pas de conflit d'adresses entre les deux kits.
- Si l'écran tactile ne fonctionne pas sous Ubuntu Server en moins d'une heure → passage à Raspberry Pi OS avec bureau (écran et mode kiosque plus simples).

Pour la prochaine fois :
- Téléverser `test_modulino` et vérifier chaque Modulino (mettre à jour la fiche matériel).
- Tester le shield Grove en même temps que les Modulino.
- Étape 3 du guide : faire parler l'Arduino au Pi en série.

---

### Mardi matin — console, serveur et les 5 modules — pilote : … , secrétaire : …

Fait :
- Installation de l'IDE Arduino 2, du support de la carte UNO R4 WiFi et des bibliothèques Modulino et Arduino_SensorKit.
- Sketch de la console (`arduino/console/`) : lit tous les capteurs (7 Modulino + 6 Grove) et échange avec le Raspberry Pi par un protocole texte, une commande par ligne (liste en tête du fichier). Téléversé sur la R4 : l'OLED affiche « BLACK-OUT ».
- Serveur de jeu (`server/`) : chrono, compteur d'erreurs, enchaînement des modules, écran du QG, page des agents avec chat, mode test sans Arduino (`/?dev=1`).
- Les 5 modules : Chauffage (molette, 3 tours), Éclairage (LEDs + boutons), Présence (capteur de distance, main tenue 3 s), Code de l'armoire (morse + clavier sur l'écran tactile), Compteur (OLED + potentiomètre).
- Débriefing pédagogique affiché à la fin de la partie, gagnée ou perdue.
- Partie testée de bout en bout en simulation, puis avec la vraie console branchée sur un PC : les 5 modules fonctionnent.
- PDF à imprimer : enveloppes des agents (A4) et plan du campus (A3) dans `docs/impression/`.
- Commit `ADD all épreuves ok, arduino ok, fiches ok` (13 h 48).

Problèmes rencontrés et solutions :
- Installation du support UNO R4 interrompue (« server sent GOAWAY ») → coupure réseau pendant le téléchargement ; installation relancée avec succès.
- Bibliothèque Arduino_SensorKit absente à la compilation → installée depuis le gestionnaire de bibliothèques.
- Le serveur cherchait l'Arduino sur `/dev/ttyACM0` (nom Linux) alors qu'il tournait sous Windows (port COM) → détection automatique du port de la carte (identifiant USB du fabricant Arduino).
- Sous Windows, le serveur plantait en sauvegardant la partie (« EPERM rename ») : le fichier était lu au même moment par un autre programme (antivirus ou synchronisation). → Une seule sauvegarde par seconde, écriture directe si le renommage est refusé, et une sauvegarde ratée ne fait plus planter le jeu.

Choix techniques (et pourquoi) :
- Les bonnes réponses restent sur le serveur : les écrans ne reçoivent jamais la consigne attendue, impossible de tricher en regardant la page.
- État de la partie sauvegardé chaque seconde (écriture atomique) et chrono qui n'avance que quand le serveur tourne : après une coupure, la partie reprend au même endroit. Testé en arrêtant puis relançant le serveur en pleine partie.
- Un fichier par module dans `server/modules/` : ajouter un module ne touche pas au moteur. La liste des modules se choisit au lancement (`MODULES=…`), ce qui permet une démo courte pour le jury.
- Le module Présence valide sur la durée (3 s dans la tolérance), vérifiée chaque seconde par le serveur : un geste au hasard ne suffit pas.
- L'écran du QG n'est redessiné que quand son contenu change, pour que le clavier tactile reste utilisable.

Pour la prochaine fois :
- Corrigé pour les organisateurs, puis passage sur le Raspberry Pi.

---

### Mardi après-midi — fiabilité, chat, Raspberry Pi et interface — pilote : … , secrétaire : …

Fait :
- Corrigé pour les organisateurs en PDF (A4), avec les codes de l'enveloppe 4 pour chaque salle possible.
- Chat temps réel entre le QG et les agents (Socket.io) : messages diffusés instantanément, horodatés, historique envoyé à chaque nouveau téléphone, vibration et bip à la réception, bandeau « Connexion perdue » si le Wi-Fi décroche.
- QR code sur l'écran du QG pour ouvrir la page des agents sur téléphone.
- Guide d'installation sur le Raspberry Pi (`docs/installation-raspberry.md`) : outils, clonage, accès des téléphones (partage de connexion d'un téléphone recommandé), démarrage automatique.
- `npm start` ouvre automatiquement Chromium en plein écran sur le Pi (via `cage` sous Ubuntu Server), avec réouverture si le navigateur se ferme ; `npm run serveur` lance le serveur seul.
- Nouvelle interface aux couleurs du réseau CCI : rose institutionnel (Pantone 192C, #E50043), bleu marine et turquoise de la charte CCI.
- Interface pensée pour l'écran tactile 7" (800 × 480) : boutons d'au moins 48 px de haut, textes plus grands, pas de zoom ni de sélection de texte, curseur masqué sur le Pi.
- Clavier AZERTY pour le module Code de l'armoire.
- Animations plein écran sur l'écran du QG et sur les téléphones : « Salle sécurisée ! », « Erreur », « Black-out évité ! » et « BLACK-OUT » (l'écran clignote en rouge puis passe au noir).
- Séquence de victoire sur la console à chaque salle réussie : les 8 LEDs tournent en arc-en-ciel, coche sur la matrice LED, la LED Grove clignote, et le buzzer joue do-mi-sol-do (fanfare plus longue à la fin de la partie).
- Séquence de défaite (3 erreurs ou temps écoulé) : les 8 LEDs clignotent en rouge sur trois notes qui descendent, puis s'éteignent une à une pendant une dernière note qui tremble (le « black-out »). Une croix reste sur la matrice LED jusqu'à la partie suivante.
- Commits de l'après-midi : `ADD added corrigé`, `FIX fix temp on gale 1`, puis interface, chat et séquences.

Problèmes rencontrés et solutions :
- Chauffage : en tournant la molette au-delà de 25 °C, la consigne restait bloquée au retour. → La référence de la molette est recalée en butée.
- Le capteur de distance semblait ne pas réagir : il ne sert que dans le module 3 (Présence).
- Écran de fin : le titre était coupé en haut sur l'écran 7" quand le débriefing est long. → Le contenu défile désormais depuis le haut.

Choix techniques (et pourquoi) :
- Le chat a ses propres événements Socket.io (`chat:send`, `chat:message`, `chat:history`) au lieu de passer par l'état du jeu : chaque message part tout de suite, sans renvoyer tout l'état.
- Sécurité du chat : pseudo uniquement, 300 caractères maximum, 1 message toutes les 0,5 s par appareil (anti-spam), affichage en texte brut (pas d'injection HTML, testé avec une balise `<img onerror>`).
- Pas d'IDE Arduino sur le Pi : le sketch reste dans la mémoire de la carte ; on ne retéléverse depuis un PC que si on le modifie.
- Accès des téléphones par le réseau local plutôt que par Internet : rien à exposer en ligne, et ça ne dépend pas du réseau de l'école.
- Les animations de victoire et de défaite ne bloquent pas la console (pas de `delay`) : les capteurs restent lus pendant la séquence. La console mémorise l'état voulu des LEDs et le réaffiche à la fin.
- À la dernière erreur, le serveur n'envoie pas le bip d'erreur : il couperait le début du jingle de défaite.
- Couleurs de la charte : le rose est réservé aux actions principales et aux alertes, le turquoise à la réussite, pour que le joueur comprenne d'un coup d'œil.

Pour la prochaine fois :
- Retéléverser le sketch `console` (nouvelles commandes VICTORY et DEFEAT).
- Installer le serveur sur le Pi et le lancer au démarrage.
- Vérifier sur le vrai écran 7" que tout est lisible ; tester le chat avec plusieurs téléphones.
- Sécurité (HTTPS), puis livrables de jeudi.

---

### Mercredi matin — affiche QR code et relecture du code — pilote : … , secrétaire : …

Fait :
- Affiche A4 du QR code des agents (`/qr.html`, à imprimer et à poser dans le hall) et correction de l'adresse du QR code : le Wi-Fi passe en premier, les cartes réseau virtuelles (VirtualBox, Hyper-V, Docker…) sont ignorées, et `AGENTS_URL` force l'adresse si besoin. Commit `ADD affiche QR code des agents + FIX adresse du QR code`.
- Relecture complète du code (serveur, 5 modules, pages web, sketch) et corrections ci-dessous.
- L'écran du QG est le seul à piloter la partie : un téléphone qui ouvre la page du QG ou `/?dev=1` voit un bandeau « Lecture seule » et ses commandes sont refusées. `DEV=1` autorise les tests depuis un PC.
- Abandonner une partie sans clavier : appui long de 3 s sur « BLACK-OUT · QG », puis confirmation.
- Historique des parties dans MySQL : fichier `server/db/blackout.sql` (tables `parties` et `etapes`, 10 parties fictives de démonstration marquées `demo`), enregistrement automatique à la fin de chaque partie, page `historique.html` (statistiques, meilleurs scores, temps moyen par salle, dernières parties).
- Score calculé selon la rapidité : victoire = 1 000 + bonus de rapidité (jusqu'à 1 000, au prorata du temps restant) − 150 par erreur ; défaite = 100 par salle sécurisée. Affiché sur l'écran de fin et dans l'historique.
- Testé avec une base MariaDB (compatible MySQL) : partie gagnée et partie perdue enregistrées, score vérifié à la main, jeu sans base, mot de passe faux (le jeu continue, l'erreur est affichée).
- Écran du QG : l'heure de l'histoire (« Nous sommes mardi 14 h 20 ») s'affiche à côté du chrono, et les modules Présence et Compteur montrent une aide au calcul (les formules, sans les valeurs, qui restent dans les enveloppes des agents).
- Tests : partie complète gagnée en simulation (5 modules, séquences de victoire), chat depuis un téléphone, commandes refusées depuis un autre appareil, `DEV=1`, reprise après redémarrage du serveur.

Problèmes rencontrés et solutions :
- Le serveur plantait au démarrage quand la sauvegarde venait d'une partie avec une autre liste de modules (ex. démo jury `MODULES=chauffage,eclairage` après une partie à 5 modules) : il cherchait un module qui n'existait plus. Avec le démarrage automatique du Pi, il aurait planté en boucle. → La sauvegarde garde la liste des modules ; si elle ne correspond pas, elle est ignorée et une partie neuve démarre.
- Après un redémarrage du serveur seul, la console Arduino ne recevait pas l'état de la partie (elle ne l'envoyait qu'au démarrage de la carte). → Le serveur renvoie l'état dès qu'il se connecte à l'Arduino, écran de fin compris.

Choix techniques (et pourquoi) :
- Commandes réservées à l'écran du QG en vérifiant que la connexion vient du Pi lui-même (`localhost`) : pas de mot de passe à taper sur l'écran tactile, et les agents ne peuvent ni relancer, ni réinitialiser, ni simuler des capteurs depuis leur téléphone.
- MySQL plutôt qu'un fichier : historique interrogeable (meilleurs scores, temps moyen par salle) et modèle de données à présenter dans le dossier. La base reste facultative : si elle est absente ou injoignable, le jeu continue et seule la page historique l'indique.
- Sécurité de la base : requêtes préparées (pas d'injection SQL), utilisateur MySQL qui ne peut que lire et ajouter, mot de passe dans `server/db/config.json` exclu du dépôt Git.
- Score proportionnel au temps restant plutôt qu'au temps joué : il reste comparable entre une partie de 20 min et la démo jury de 7 min.
- L'aide au calcul donne au QG les formules mais pas les données : le jeu reste plus accessible sans que le QG puisse se passer des agents.

Pour la prochaine fois :
- Installer le jeu sur le Pi, imprimer enveloppes, plan, corrigé et affiche QR, puis jouer une vraie partie dans les salles.
- Régler `KNOB_STEP`, `SALLE_ENVELOPPE` et les tolérances après la partie test.
- Commencer le dossier, le poster A3 et la présentation.
- Installer MySQL sur le Pi (guide, section 7).

---

### Mercredi après-midi — intrigue du blocus, générique de fin et présentation — pilote : … , secrétaire : …

Fait :
- Intrigue : tel un gréviste, le saboteur veut consolider le blocus du campus, en soutien aux lycéens mobilisés, en provoquant un black-out général. Sur l'écran d'accueil du QG, un briefing de mission défile à droite du QR code (un toucher le met en pause pour le lire).
- Générique de fin : après l'animation de victoire ou de défaite, le logo du campus CCI Eure-et-Loir (version rose, `server/public/img/logo-cci.png`) apparaît dans un disque cerclé de bleu marine, avec le résultat et le score qui défile, sur le QG et les téléphones. En cas de victoire : fond rose CCI, « Vous avez déjoué le blocus ! » et la signature « BLACK-OUT · CCI, le jeu ».
- Textes de réussite harmonisés autour du blocus : « Blocus déjoué ! » sur l'animation de victoire, l'écran de fin du QG et les téléphones.
- Interface tactile : boutons « Lancer la partie » et « Historique » côte à côte sur l'accueil (le briefing tient sans faire sortir les boutons de l'écran), message d'attente quand le chat est vide, sur le QG et les téléphones.
- Présentation de soutenance (`livrables/Workshop2025-26-M1gX-pres.pptx`) : 12 slides construites sur le sujet (dont « Fonctionnement du jeu » et « Apport pédagogique », obligatoires), présentation de l'équipe en anglais, captures d'écran du vrai jeu, notes de l'orateur sous chaque slide avec qui parle et la durée.

Problèmes rencontrés et solutions :
- La zone du briefing s'étirait au lieu de couper le texte et poussait les boutons hors de l'écran 7". → Hauteur fixe de la zone, texte coupé avec un fondu en haut et en bas.
- Sur le Pi (Ubuntu Server), Chromium se fermait aussitôt (« Navigateur fermé (code 1) ») et ses erreurs étaient invisibles. Cause probable : sous `cage` (affichage Wayland), Chromium cherche un serveur X11 et quitte. → Option `--ozone-platform=wayland`, erreurs de cage et Chromium affichées dans le terminal, et message clair quand le serveur est lancé par SSH (pas d'écran). À vérifier sur le Pi.
- Sur le Pi, `sudo npm start` empêchait Chromium de démarrer (« Running as root without --no-sandbox is not supported »). → On lance le jeu sans `sudo` (droits sur le port de l'Arduino via le groupe `dialout`) ; le serveur détecte maintenant un lancement en root et explique quoi faire. On n'a pas désactivé la protection de Chromium (`--no-sandbox`) : ce serait une faille de sécurité.
- Au lancement du serveur, l'ancienne partie reprenait toute seule (on retombait sur une partie à 7 min de la fin). → Le serveur démarre toujours sur l'accueil ; si une partie a été interrompue en cours de jeu (moins de 2 h), un bandeau « Partie interrompue · salle 2/5 · 19:53 restantes » propose **Reprendre**, sinon « Nouvelle partie » repart de zéro. La reprise après incident demandée par le sujet est conservée, mais c'est le QG qui décide.
- Le Pi affichait une ancienne page (sans briefing ni QR code). → Pages du jeu servies sans cache, Chromium en navigation privée, et version du code (dernier commit) affichée en bas de l'accueil du QG pour vérifier que le Pi est à jour.

Choix techniques (et pourquoi) :
- Le logo n'est pas redessiné dans le code : on utilise le fichier officiel du campus, posé dans un disque blanc pour rester lisible sur le fond rose.
- Reprise après incident à la demande plutôt qu'automatique : après une démo ou un test interrompu, on ne veut pas retomber sur une vieille partie ; après une vraie coupure, un seul toucher suffit pour reprendre.
- Le briefing défile tout seul pour accrocher les joueurs pendant l'installation, mais se met en pause au toucher : chacun lit à son rythme (accessibilité).
- Rose CCI en couleur principale de la victoire, bleu marine en secondaire, et contraste fort (texte blanc, score sur fond bleu) pour une lecture à distance.

Pour la prochaine fois :
- Compléter la présentation : numéro de groupe, noms et rôles des membres, notes « À ADAPTER » (slides 10 et 11).
- Répéter la soutenance chrono en main ; installer MySQL sur le Pi.
