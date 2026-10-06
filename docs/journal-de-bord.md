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

### Mardi matin — console et serveur — pilote : … , secrétaire : …

Fait :
- Installation de l'IDE Arduino 2, du support de la carte UNO R4 WiFi et des bibliothèques Modulino et Arduino_SensorKit.
- Sketch de la console (`arduino/console/`) : lit tous les capteurs (7 Modulino + 6 Grove) et échange avec le Raspberry Pi par un protocole texte, une commande par ligne (liste en tête du fichier).
- Serveur de jeu (`server/`) : chrono, compteur d'erreurs, enchaînement des modules, module Chauffage complet (3 tours), écran du QG, page des agents avec chat, et mode test sans Arduino (`/?dev=1`).

Problèmes rencontrés et solutions :
- Installation du support UNO R4 interrompue (« server sent GOAWAY ») → coupure réseau pendant le téléchargement ; installation relancée avec succès.

Choix techniques (et pourquoi) :
- Les bonnes réponses restent sur le serveur : les écrans ne reçoivent jamais la consigne attendue, impossible de tricher en regardant la page.
- État de la partie sauvegardé chaque seconde (écriture atomique) et chrono qui n'avance que quand le serveur tourne : après une coupure, la partie reprend au même endroit. Testé en arrêtant puis relançant le serveur en pleine partie.
- Un fichier par module dans `server/modules/` : ajouter un module ne touche pas au moteur.
- Chat : pseudo uniquement, messages limités à 300 caractères et affichés en texte brut (pas d'injection de code HTML).

Pour la prochaine fois :
- Téléverser `console`, brancher la R4 sur le Pi et jouer le module Chauffage avec l'enveloppe 1.
- Modules suivants : Éclairage, Compteur, Code de l'armoire, Présence.

---

### Mardi après-midi — tous les modules — pilote : … , secrétaire : …

Fait :
- Console Arduino validée : le sketch `console` compile et tourne sur la R4 (bibliothèque Arduino_SensorKit ajoutée).
- Serveur lancé sur un PC avec la console branchée en USB : le module Chauffage fonctionne avec le vrai matériel.
- Ajout des 4 autres modules : Éclairage (LEDs + boutons), Présence (capteur de distance, main tenue 3 s), Code de l'armoire (morse + clavier sur l'écran tactile), Compteur (OLED + potentiomètre).
- Débriefing pédagogique affiché à la fin de la partie, gagnée ou perdue.
- Partie complète testée de bout en bout en mode simulation (5 modules, erreurs, fin de partie).

Problèmes rencontrés et solutions :
- Bibliothèque Arduino_SensorKit absente à la compilation → installée depuis le gestionnaire de bibliothèques.
- Le serveur cherchait l'Arduino sur `/dev/ttyACM0` (nom Linux) alors qu'il tournait sous Windows (port COM) → détection automatique du port de la carte (identifiant USB du fabricant Arduino).

Choix techniques (et pourquoi) :
- Les modules se jouent l'un après l'autre et partagent les commandes ; la liste des modules se choisit au lancement (`MODULES=…`), ce qui permet une démo courte pour le jury.
- Le module Présence valide sur la durée (3 s dans la tolérance), vérifiée chaque seconde par le serveur : un geste au hasard ne suffit pas.
- L'écran du QG n'est redessiné que quand son contenu change, pour que le clavier tactile reste utilisable.

Pour la prochaine fois :
- Installer le serveur sur le Raspberry Pi et afficher la console en plein écran sur l'écran tactile.
- Jouer une partie complète avec les enveloppes imprimées, puis régler `SALLE_ENVELOPPE` et `KNOB_STEP`.

---

### Mardi fin d'après-midi — tests sur matériel et préparation du Pi — pilote : … , secrétaire : …

Fait :
- Partie testée avec la vraie console branchée sur un PC : les 5 modules fonctionnent.
- PDF à imprimer : enveloppes des agents (A4), plan du campus (A3), corrigé pour les organisateurs (`docs/impression/`).
- Chat temps réel entre le QG et les agents (Socket.io) : messages diffusés instantanément, horodatés, historique envoyé à chaque nouveau téléphone, vibration et bip à la réception.
- QR code sur l'écran du QG pour ouvrir la page des agents sur téléphone.
- Guide d'installation sur le Raspberry Pi (`docs/installation-raspberry.md`) : serveur, accès des téléphones, démarrage automatique, mode kiosque.

Problèmes rencontrés et solutions :
- Sous Windows, le serveur plantait en sauvegardant la partie (« EPERM rename ») : le fichier était lu au même moment par un autre programme (antivirus ou synchronisation). → Une seule sauvegarde par seconde, écriture directe si le renommage est refusé, et une sauvegarde ratée ne fait plus planter le jeu.
- Chauffage : en tournant la molette au-delà de 25 °C, la consigne restait bloquée au retour. → La référence de la molette est recalée en butée.
- Le capteur de distance semblait ne pas réagir : il ne sert que dans le module 3 (Présence).

Choix techniques (et pourquoi) :
- Le chat a ses propres événements Socket.io (`chat:send`, `chat:message`, `chat:history`) au lieu de passer par l'état du jeu : chaque message part tout de suite, sans renvoyer tout l'état.
- Sécurité du chat : pseudo uniquement, 300 caractères maximum, 1 message toutes les 0,5 s par appareil (anti-spam), affichage en texte brut (pas d'injection HTML, testé avec une balise `<img onerror>`).
- Pas d'IDE Arduino sur le Pi : le sketch reste dans la mémoire de la carte ; on ne retéléverse depuis un PC que si on le modifie.
- Accès des téléphones par le réseau local (partage de connexion d'un téléphone en soutenance) plutôt que par Internet : rien à exposer en ligne, et ça ne dépend pas du réseau de l'école.

Pour la prochaine fois :
- Installer le serveur sur le Pi (guide) et le lancer au démarrage.
- Tester le chat avec plusieurs téléphones sur le partage de connexion.
- Sécurité : HTTPS (étape 8 du guide), puis livrables de jeudi.

---

### Mardi soir — interface tactile et séquence de victoire — pilote : … , secrétaire : …

Fait :
- `npm start` ouvre automatiquement Chromium en plein écran sur le Raspberry Pi (via `cage` sous Ubuntu Server), avec réouverture si le navigateur se ferme.
- Nouvelle interface aux couleurs du réseau CCI : rose institutionnel (Pantone 192C, #E50043), bleu marine et turquoise de la charte CCI.
- Interface pensée pour l'écran tactile 7" (800 × 480) : boutons d'au moins 48 px de haut, textes plus grands, pas de zoom ni de sélection de texte, curseur masqué sur le Pi.
- Clavier AZERTY pour le module Code de l'armoire.
- Animations plein écran : « Salle sécurisée ! » à chaque salle réussie, « Erreur » en cas de mauvaise réponse, « Black-out évité ! » en fin de partie, sur l'écran du QG et sur les téléphones.
- Séquence de victoire sur la console à chaque salle réussie : les 8 LEDs tournent en arc-en-ciel, coche sur la matrice LED, la LED Grove clignote, et le buzzer joue do-mi-sol-do (fanfare plus longue à la fin de la partie).
- Séquence de défaite (3 erreurs ou temps écoulé) : les 8 LEDs clignotent en rouge sur trois notes qui descendent, puis s'éteignent une à une pendant une dernière note qui tremble (le « black-out »). Une croix reste sur la matrice LED jusqu'à la partie suivante. Les écrans du QG et des téléphones clignotent en rouge puis passent au noir.
- Écran de fin : le titre était coupé en haut sur l'écran 7" quand le débriefing est long ; corrigé (le contenu défile désormais depuis le haut).

Choix techniques (et pourquoi) :
- Les animations de victoire et de défaite ne bloquent pas la console (pas de `delay`) : les capteurs restent lus pendant la séquence.
- À la dernière erreur, le serveur n'envoie pas le bip d'erreur : il couperait le début du jingle de défaite.
- Pendant l'animation, la console mémorise l'état voulu des LEDs et le réaffiche à la fin : la salle suivante (Éclairage) démarre avec le bon affichage.
- Couleur de la charte : le rose est réservé aux actions principales et aux alertes, le turquoise à la réussite, pour que le joueur comprenne d'un coup d'œil.

Pour la prochaine fois :
- Retéléverser le sketch `console` (nouvelles commandes VICTORY et DEFEAT).
- Vérifier sur le vrai écran 7" que tout est lisible et que les boutons se touchent facilement.
