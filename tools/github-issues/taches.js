// Liste des issues GitHub du projet Black-out, une par tache, rangees par etape de docs/marche-a-suivre.md.
// "fait" : la tache est terminee -> l'issue est creee (ou mise a jour) puis fermee avec un commentaire.
// "ancienTitre" : l'issue existait sous ce titre sur GitHub -> elle est renommee au lieu d'etre recreee.
// Pour ajouter une tache : copier un bloc, puis relancer creer-issues.js (les issues deja creees sont mises a jour).

const JALONS = [
  { titre: 'Lundi 5 oct — mise en place', echeance: '2026-10-05', description: 'Organisation, Raspberry Pi, découverte de l\'Arduino.', ferme: true },
  { titre: 'Mardi 6 oct — jeu complet sur PC', echeance: '2026-10-06', description: 'Console Arduino, serveur, 5 modules, chat, interface tactile.', ferme: true },
  { titre: 'Mercredi 7 oct — jeu sur le Pi et partie test', echeance: '2026-10-07', description: 'Relecture du code, historique et score, scénario, installation sur le Raspberry Pi, première partie test.', ferme: true },
  { titre: 'Jeudi 8 oct — fiabilité et livrables', echeance: '2026-10-08', description: 'Peaufinage de la console, de l\'interface, du Pi et des fiches ; tests de fiabilité ; dossier, poster, présentation.', ferme: true },
  { titre: 'Vendredi 9 oct — soutenance', echeance: '2026-10-09', description: 'Dépôt des livrables, installation, démo et questions du jury.' },
];

const ETIQUETTES = [
  { nom: 'étape 0', couleur: 'cfd8dc', description: 'S\'organiser' },
  { nom: 'étape 1', couleur: 'b3e5fc', description: 'Préparer le Raspberry Pi' },
  { nom: 'étape 2', couleur: 'b2ebf2', description: 'Découvrir l\'Arduino' },
  { nom: 'étape 3', couleur: 'b2dfdb', description: 'Faire parler l\'Arduino au Pi' },
  { nom: 'étape 4', couleur: 'c8e6c9', description: 'Le jeu sur le Raspberry Pi' },
  { nom: 'étapes 5-6', couleur: 'dcedc8', description: 'Les 5 modules' },
  { nom: 'étape 7', couleur: 'f0f4c3', description: 'Agents terrain et chat' },
  { nom: 'étape 8', couleur: 'ffecb3', description: 'Sécurité et fiabilité' },
  { nom: 'étape 9', couleur: 'ffe0b2', description: 'Test avec de vrais joueurs' },
  { nom: 'étape 10', couleur: 'ffccbc', description: 'Livrables et soutenance' },
  { nom: 'arduino', couleur: '00979d', description: 'Console Arduino (sketch, câblage)' },
  { nom: 'raspberry', couleur: 'c51a4a', description: 'Raspberry Pi (système, réseau, écran)' },
  { nom: 'serveur', couleur: '3c873a', description: 'Serveur Node.js' },
  { nom: 'interface', couleur: 'e50043', description: 'Écran du QG et page des agents' },
  { nom: 'doc', couleur: '004379', description: 'Documentation, journal, impression' },
  { nom: 'test', couleur: '2bb6b7', description: 'Tests et réglages' },
  { nom: 'sécurité', couleur: '6a1b9a', description: 'Sécurité et fiabilité' },
  { nom: 'livrable', couleur: 'f9a825', description: 'Livrables du jeudi et soutenance' },
];

const LUN = JALONS[0].titre, MAR = JALONS[1].titre, MER = JALONS[2].titre, JEU = JALONS[3].titre, VEN = JALONS[4].titre;
const F_LUN = 'lundi 5 octobre', F_MAR = 'mardi 6 octobre', F_MER = 'mercredi 7 octobre', F_JEU = 'jeudi 8 octobre';

// Issues retirees du projet : supprimees de GitHub par le script (ou fermees si le compte n'a pas le droit de supprimer).
const RETIREES = [
  'Configurer Git sur chaque poste (clés SSH, commits signés)',
];

const TACHES = [
  // ---------- Étape 0 ----------
  {
    titre: 'Créer le dépôt GitHub et l\'arborescence du projet',
    etiquettes: ['étape 0', 'doc'], jalon: LUN, fait: F_LUN,
    corps: `Dépôt partagé par les 5 membres, avec l'arborescence du projet.

- [x] Créer le dépôt et inviter les membres
- [x] Arborescence \`arduino/\`, \`server/\`, \`docs/\`
- [x] \`.gitignore\` (node_modules, sauvegarde de partie, mot de passe de la base)

**C'est bon quand** tout le monde peut cloner et pousser.`,
  },
  {
    titre: 'Répartir les rôles et lancer le journal de bord',
    etiquettes: ['étape 0', 'doc'], jalon: LUN, fait: F_LUN,
    corps: `Pilote (clavier, change toutes les heures), copilote, secrétaire, et deux personnes sur ce qui ne bloque pas le pilote.

- [x] Rôles définis
- [x] \`docs/journal-de-bord.md\` créé, une entrée par demi-journée

**C'est bon quand** le journal a sa première entrée.`,
  },

  // ---------- Étape 1 ----------
  {
    titre: 'Installer Ubuntu Server sur le Raspberry Pi 5',
    etiquettes: ['étape 1', 'raspberry'], jalon: LUN, fait: F_LUN,
    corps: `- [x] Carte microSD préparée avec Raspberry Pi Imager
- [x] Premier démarrage, utilisateur créé

**C'est bon quand** le Pi démarre et qu'on peut se connecter.`,
  },
  {
    titre: 'Brancher et tester l\'écran tactile 7"',
    etiquettes: ['étape 1', 'raspberry'], jalon: LUN, fait: F_LUN,
    corps: `Écran Freenove FNK0078 sur le port DSI, avec la nappe prévue pour le Pi 5.

- [x] Le texte de démarrage s'affiche sur l'écran tactile`,
  },

  // ---------- Étape 2 ----------
  {
    titre: 'Installer l\'IDE Arduino 2, le support UNO R4 WiFi et les bibliothèques',
    etiquettes: ['étape 2', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `- [x] Arduino IDE 2 sur un PC
- [x] Gestionnaire de cartes : **Arduino UNO R4 Boards**
- [x] Bibliothèques : **Modulino**, **Arduino_SensorKit**

Problème rencontré : téléchargement interrompu (« GOAWAY »), relancé avec succès.`,
  },
  {
    titre: 'Tester les 7 Modulino',
    etiquettes: ['étape 2', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `Knob, Pixels, Buttons, Buzzer, Distance, Movement, Thermo en chaîne sur le Qwiic (sketch de test : \`arduino/test_modulino/\`).

- [x] R4 vissée sur la base Modulino
- [x] Chaque Modulino réagit dans le sketch console

**C'est bon quand** la fiche matériel est à jour (État → OK).`,
  },
  {
    titre: 'Brancher le shield Grove et tester Grove + Modulino ensemble',
    etiquettes: ['étape 2', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `Modules Grove utilisés : potentiomètre A0, lumière A3, bouton D4, buzzer D5, LED D6, OLED en I2C.

- [x] Shield enfiché sur la R4, Modulino toujours sur le Qwiic
- [x] OLED + bouton + Modulino fonctionnent en même temps`,
  },

  // ---------- Étape 3 ----------
  {
    titre: 'Sketch de la console et protocole série Arduino ↔ serveur',
    etiquettes: ['étape 3', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `\`arduino/console/console.ino\` : lit tous les capteurs et échange une commande texte par ligne à 115 200 bauds (liste en tête du fichier, tableau dans la marche à suivre).

- [x] Capteurs → Pi : KNOB, KNOBPRESS, BTN, VALID, TEMP, DIST, POT, LIGHT, TILT
- [x] Pi → console : LED, LEDS, MORSE, OLED, ERRORS, BEEP, GLED, VICTORY, DEFEAT
- [x] Téléversé, l'OLED affiche « BLACK-OUT »`,
  },

  // ---------- Étape 4 ----------
  {
    titre: 'Rédiger le guide d\'installation du Raspberry Pi',
    etiquettes: ['étape 4', 'doc', 'raspberry'], jalon: MAR, fait: F_MAR,
    corps: `\`docs/installation-raspberry.md\` : outils, clonage, accès des téléphones, écran en plein écran, démarrage automatique, MySQL, mise à jour, dépannage.`,
  },
  {
    titre: 'Installer les outils sur le Pi (git, Node.js, accès USB)',
    etiquettes: ['étape 4', 'raspberry'], jalon: MER, fait: F_MER,
    corps: `Guide : \`docs/installation-raspberry.md\`, section 1.

- [x] \`sudo apt install -y git nodejs npm build-essential python3\`
- [x] \`node -v\` affiche v18 ou plus
- [x] \`sudo usermod -aG dialout $USER\` puis redémarrage (accès à l'Arduino sans \`sudo\`)

**C'est bon quand** \`node -v\` répond.`,
  },
  {
    titre: 'Cloner le dépôt et installer le serveur sur le Pi',
    etiquettes: ['étape 4', 'raspberry', 'serveur'], jalon: MER, fait: F_MER,
    corps: `Guide : sections 2 et 3.

- [x] \`git clone https://github.com/… ~/blackout\`
- [x] \`cd ~/blackout/server && npm install\` (ne pas copier \`node_modules\` depuis Windows)

**C'est bon quand** \`npm run serveur\` affiche « Serveur pret ».`,
  },
  {
    titre: 'Brancher la console sur le Pi et vérifier « Arduino OK »',
    etiquettes: ['étape 4', 'raspberry', 'arduino'], jalon: MER, fait: F_MER,
    corps: `- [x] R4 en USB sur le Pi, \`ls /dev/ttyACM*\` affiche un port
- [x] Le serveur affiche « Arduino connecte sur /dev/ttyACM0 »
- [x] Le badge en haut à droite de l'écran du QG indique « Arduino OK »`,
  },
  {
    titre: 'Afficher la console du QG en plein écran sur l\'écran tactile',
    etiquettes: ['étape 4', 'raspberry', 'interface'], jalon: MER, fait: F_MER,
    corps: `Guide : section 5.

- [x] \`sudo apt install -y cage\` et \`sudo snap install chromium\`
- [x] \`npm start\` lancé **depuis l'écran du Pi** (sans \`sudo\`) ouvre Chromium en plein écran
- [x] Les boutons se touchent facilement, tout est lisible en 800 × 480

Problèmes réglés : Chromium qui se fermait aussitôt sous \`cage\` (option \`--ozone-platform=wayland\`), refus de démarrer en root (\`sudo npm start\`), ancienne version de la page en cache (pages sans cache, navigation privée).`,
  },
  {
    titre: 'Connecter le Pi au partage de connexion d\'un téléphone',
    etiquettes: ['étape 4', 'raspberry'], jalon: JEU, fait: F_JEU,
    corps: `Guide : section 4 (netplan).

- [x] Choisir le téléphone qui fera point d'accès en soutenance
- [x] Wi-Fi configuré dans \`/etc/netplan/\`, puis \`sudo netplan apply\`
- [x] Le serveur affiche la nouvelle adresse des agents, le QR code suit

**C'est bon quand** un téléphone connecté au partage ouvre la page des agents.`,
  },
  {
    titre: 'Démarrage automatique du jeu à l\'allumage du Pi',
    etiquettes: ['étape 4', 'raspberry'], jalon: JEU, fait: F_JEU,
    corps: `Guide : section 6.

- [x] Connexion automatique sur tty1 (\`sudo systemctl edit getty@tty1\`)
- [x] \`npm start\` dans \`~/.bash_profile\`

**C'est bon quand**, après \`sudo reboot\`, la console du QG s'affiche toute seule avec « Arduino OK ».`,
  },

  // ---------- Étapes 5-6 ----------
  {
    titre: 'Module 1 — Chauffage (molette + température)',
    etiquettes: ['étapes 5-6', 'serveur', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `\`server/modules/chauffage.js\`, enveloppe 1. Trois tours : régler la consigne à la molette, valider par appui.

- [x] Module codé et testé avec la vraie console
- [x] Correction : consigne bloquée au-delà de 25 °C`,
  },
  {
    titre: 'Module 2 — Éclairage (LEDs + boutons)',
    etiquettes: ['étapes 5-6', 'serveur', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `\`server/modules/eclairage.js\`, enveloppe 2. Éteindre les salles vides avec les boutons Modulino, valider avec le bouton Grove.`,
  },
  {
    titre: 'Module 3 — Présence (capteur de distance)',
    etiquettes: ['étapes 5-6', 'serveur', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `\`server/modules/presence.js\`, enveloppe 3. Tenir la main à la distance calculée pendant 3 s (± 2 cm).`,
  },
  {
    titre: 'Module 4 — Code de l\'armoire (morse + clavier tactile)',
    etiquettes: ['étapes 5-6', 'serveur', 'interface'], jalon: MAR, fait: F_MAR,
    corps: `\`server/modules/code.js\`, enveloppe 4. Le buzzer joue WATT en morse, les agents chiffrent selon la salle, le QG tape le code sur le clavier AZERTY.`,
  },
  {
    titre: 'Module 5 — Compteur (OLED + potentiomètre)',
    etiquettes: ['étapes 5-6', 'serveur', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `\`server/modules/compteur.js\`, enveloppe 5. Estimer les kg de CO₂ au potentiomètre (54 kg ± 2), valider avec le bouton Grove.`,
  },
  {
    titre: 'Mécaniques communes : chrono, 3 erreurs, anti-sabotage, débriefing',
    etiquettes: ['étapes 5-6', 'serveur'], jalon: MAR, fait: F_MAR,
    corps: `- [x] Chrono de 20 min (\`DURATION\`)
- [x] 3 erreurs max, affichées sur la matrice LED
- [x] Console penchée = erreur (Modulino Movement)
- [x] Débriefing pédagogique en fin de partie
- [x] Sauvegarde chaque seconde et reprise après incident`,
  },
  {
    titre: 'Interface tactile 7" aux couleurs CCI',
    etiquettes: ['étapes 5-6', 'interface'], jalon: MAR, fait: F_MAR,
    corps: `- [x] Rose CCI #E50043, bleu marine, turquoise
- [x] Boutons ≥ 48 px, pas de zoom ni de sélection, curseur masqué sur le Pi
- [x] Clavier AZERTY
- [x] Animations plein écran : salle sécurisée, erreur, victoire, black-out (QG et téléphones)`,
  },
  {
    titre: 'Séquences de victoire et de défaite sur la console',
    etiquettes: ['étapes 5-6', 'arduino'], jalon: MAR, fait: F_MAR,
    corps: `- [x] Salle réussie : LEDs arc-en-ciel, coche sur la matrice, mélodie (\`VICTORY\`, fanfare avec \`VICTORY FINAL\`)
- [x] Partie perdue : LEDs rouges qui s'éteignent une à une, jingle triste, croix sur la matrice (\`DEFEAT\`)`,
  },
  {
    titre: 'Retéléverser le sketch console sur la R4',
    etiquettes: ['étapes 5-6', 'arduino'], jalon: JEU, fait: F_JEU,
    corps: `Le sketch a changé (commandes \`VICTORY\` et \`DEFEAT\`) : il faut le retéléverser depuis un PC.

- [x] Ouvrir \`arduino/console/console.ino\`, téléverser
- [x] Gagner une salle : arc-en-ciel + mélodie
- [x] Faire 3 erreurs : LEDs rouges + jingle de défaite`,
  },
  {
    titre: 'Relecture du code et corrections',
    etiquettes: ['étapes 5-6', 'serveur', 'sécurité'], jalon: MER, fait: F_MER,
    corps: `- [x] Plantage au démarrage quand la sauvegarde vient d'une autre liste de modules (démo jury) : sauvegarde ignorée
- [x] Seul l'écran du QG pilote la partie (\`DEV=1\` pour tester depuis un PC)
- [x] La console reçoit l'état de la partie quand le serveur redémarre
- [x] Abandon d'une partie : appui long de 3 s sur « BLACK-OUT · QG »`,
  },

  // ---------- Étape 7 ----------
  {
    titre: 'Page des agents et chat temps réel',
    etiquettes: ['étape 7', 'interface', 'serveur'], jalon: MAR, fait: F_MAR,
    corps: `- [x] \`agents.html\` : pseudo, chrono, module en cours, enveloppe à chercher
- [x] Chat Socket.io : instantané, horodaté, historique, vibration et bip
- [x] Sécurité : 300 caractères, anti-spam, texte brut`,
  },
  {
    titre: 'QR code d\'accès et affiche A4 pour les agents',
    etiquettes: ['étape 7', 'interface'], jalon: MER, fait: F_MER,
    corps: `- [x] QR code sur l'écran d'accueil du QG
- [x] Affiche A4 à imprimer : \`/qr.html\`
- [x] Adresse Wi-Fi prioritaire, \`AGENTS_URL\` pour forcer l'adresse`,
  },
  {
    titre: 'Historique des parties (MySQL), score et générique de fin',
    etiquettes: ['étape 7', 'serveur', 'interface'], jalon: MER, fait: F_MER,
    corps: `- [x] \`server/db/blackout.sql\` : tables \`parties\` et \`etapes\`, parties de démo fictives
- [x] Enregistrement automatique en fin de partie (requêtes préparées, jeu inchangé si la base est absente)
- [x] Score selon la rapidité (\`server/score.js\`), affiché en fin de partie
- [x] Page \`historique.html\` : statistiques, meilleurs scores, temps moyen par salle
- [x] Générique de fin avec le logo de la CCI et le score`,
  },
  {
    titre: 'Installer MySQL sur le Pi et brancher l\'historique',
    etiquettes: ['étape 7', 'raspberry', 'serveur'], jalon: JEU, fait: F_JEU,
    corps: `Guide : \`docs/installation-raspberry.md\`, section 7.

- [x] \`sudo apt install -y mysql-server\`
- [x] \`sudo mysql < server/db/blackout.sql\`
- [x] Créer l'utilisateur \`blackout\` (droits SELECT et INSERT uniquement)
- [x] \`server/db/config.json\` avec le mot de passe (jamais commité)
- [x] Jouer une partie : elle apparaît sur \`/historique.html\``,
  },
  {
    titre: 'Déposer le logo officiel de la CCI pour le générique de fin',
    etiquettes: ['étape 7', 'interface'], jalon: MER, fait: F_MER,
    corps: `- [x] Logo du campus CCI Eure-et-Loir, version rose
- [x] Déposé dans \`server/public/img/logo-cci.png\`
- [x] Générique de victoire : fond rose CCI, « Vous avez déjoué le blocus ! »`,
  },
  {
    titre: 'Intrigue du blocus et briefing défilant sur l\'accueil du QG',
    etiquettes: ['étape 7', 'interface'], jalon: MER, fait: F_MER,
    corps: `- [x] Briefing de mission qui défile à droite du QR code (toucher pour mettre en pause)
- [x] Textes de victoire : « Blocus déjoué ! »
- [x] Accueil adapté à l'écran 7" : boutons côte à côte, chat vide expliqué`,
  },
  {
    titre: 'Tester le chat avec 3 téléphones',
    etiquettes: ['étape 7', 'test'], jalon: JEU, fait: F_JEU,
    corps: `Sur le partage de connexion qui servira en soutenance.

- [x] 3 téléphones scannent le QR code
- [x] Un message d'un téléphone apparaît sur le QG et sur les autres téléphones, et inversement
- [x] Couper puis remettre le Wi-Fi d'un téléphone : bandeau « Connexion perdue », puis l'historique revient`,
  },

  // ---------- Étape 8 ----------
  {
    titre: 'Reprise à la demande et retour à l\'accueil entre deux équipes',
    etiquettes: ['étape 8', 'serveur', 'interface'], jalon: MER, fait: F_MER,
    corps: `- [x] Au lancement du serveur, l'ancienne partie ne reprend plus toute seule : l'accueil propose « Reprendre » (moins de 2 h) ou « Nouvelle partie »
- [x] En fin de partie, « Nouvelle partie » ramène à l'accueil : QR code, briefing, chat vidé, console remise à zéro`,
  },
  {
    titre: 'Test de reprise : couper le Pi en pleine partie',
    etiquettes: ['étape 8', 'test', 'sécurité'], jalon: JEU, fait: F_JEU,
    corps: `- [x] Lancer une partie, avancer jusqu'au module 2
- [x] Débrancher l'alimentation du Pi, la rebrancher
- [x] L'accueil propose « Partie interrompue · Reprendre »
- [x] Après « Reprendre », même module, même chrono, mêmes erreurs
- [x] Résultat noté dans le journal de bord

**C'est bon quand** le test réussit.`,
  },
  {
    titre: 'Décider pour HTTPS et le justifier dans le dossier',
    etiquettes: ['étape 8', 'sécurité', 'doc'], jalon: JEU, fait: F_JEU,
    corps: `Option A : certificat auto-signé (les téléphones affichent un avertissement à accepter, Chromium du Pi doit l'ignorer).
Option B : rester en HTTP sur un réseau fermé (partage de connexion), sans données personnelles.

- [x] Choix en équipe : option B, HTTPS noté comme amélioration
- [x] Justification écrite dans le dossier (partie sécurité)`,
  },
  {
    titre: 'Plan de secours pour la soutenance',
    etiquettes: ['étape 8', 'sécurité'], jalon: JEU, fait: F_JEU,
    corps: `- [x] Image de la carte microSD du Pi
- [x] Un jeu d'enveloppes de rechange
- [x] Le jeu installé sur un PC portable (\`npm start\` marche aussi sous Windows)`,
  },

  // ---------- Étape 9 ----------
  {
    titre: 'Générer les PDF à imprimer (enveloppes, plan, corrigé)',
    etiquettes: ['étape 9', 'doc'], jalon: MAR, fait: F_MAR,
    corps: `\`docs/impression/\` : enveloppes des agents (A4), plan du campus (A3), corrigé pour les organisateurs (A4).`,
  },
  {
    titre: 'Imprimer les enveloppes, le plan A3 et l\'affiche QR code',
    etiquettes: ['étape 9', 'doc'], jalon: JEU, fait: F_JEU,
    corps: `- [x] Enveloppes des agents (A4)
- [x] Plan du campus (A3)
- [x] Corrigé (pour l'équipe uniquement)
- [x] Affiche QR code : \`/qr.html\` ouvert une fois le Pi sur le réseau final, nom du Wi-Fi écrit, imprimée`,
  },
  {
    titre: 'Cacher les enveloppes et régler la salle de l\'enveloppe 4',
    etiquettes: ['étape 9', 'serveur'], jalon: JEU, fait: F_JEU,
    corps: `- [x] Placer les 5 enveloppes dans les salles prévues
- [x] Mettre dans \`server/modules/code.js\` le numéro de la salle de l'enveloppe 4 (\`SALLE_ENVELOPPE\`)
- [x] Vérifier le code attendu dans le corrigé, commit, \`git pull\` sur le Pi`,
  },
  {
    titre: 'Partie test avec un autre groupe',
    etiquettes: ['étape 9', 'test'], jalon: MER,
    corps: `Faire jouer un groupe extérieur, sans l'aider.

- [ ] Chronométrer chaque module
- [ ] Noter où ils bloquent et ce qu'ils demandent au chat
- [ ] Résumé dans le journal de bord

**C'est bon quand** l'équipe finit la partie en moins de 20 minutes.`,
  },
  {
    titre: 'Ajuster les réglages après la partie test',
    etiquettes: ['étape 9', 'test', 'serveur'], jalon: JEU, fait: F_JEU,
    corps: `- [x] \`KNOB_STEP\` (chauffage) : crans de molette par degré
- [x] \`TOLERANCE\` (présence) et tolérance du compteur
- [x] \`DURATION\` et indices des enveloppes si besoin
- [x] Commit avec message explicite, \`git pull\` sur le Pi`,
  },

  // ---------- Étape 10 ----------
  {
    titre: 'Dossier technique (PDF)',
    etiquettes: ['étape 10', 'livrable', 'doc'], jalon: JEU, fait: F_JEU,
    corps: `Fichier : \`Workshop2025-26-M1g<n>-dossier.pdf\`. Matière : journal de bord, README, marche à suivre.

- [x] Concept et apport pédagogique (thème Environnement)
- [x] Choix technologiques et pourquoi
- [x] Architecture : schéma Arduino → Pi → écran du QG et téléphones
- [x] Algorithmes : protocole série, validation des réponses, reprise après incident
- [x] Sécurité : pas de données personnelles, chat protégé, pilotage réservé au QG, HTTPS (décision)
- [x] Organisation de l'équipe et historique Git`,
  },
  {
    titre: 'Poster scientifique A3',
    etiquettes: ['étape 10', 'livrable'], jalon: JEU, fait: F_JEU,
    corps: `- [x] Problématique (énergie du bâtiment) et concept du jeu
- [x] Schéma d'architecture
- [x] Photos de la console et de l'écran du QG
- [x] Chiffres sourcés (Code de l'énergie, ADEME, RTE)
- [x] Export PDF A3, joint au dossier`,
  },
  {
    titre: 'Présentation de soutenance (pptx)',
    ancienTitre: 'Présentation de soutenance (pptx, en anglais)',
    etiquettes: ['étape 10', 'livrable'], jalon: JEU, fait: F_JEU,
    corps: `Fichier : \`livrables/Workshop2025-26-M1gX-pres.pptx\` (remplacer X par le numéro de groupe).

- [x] 13 slides sur le sujet, notes de l'orateur sous chaque slide
- [x] Slides obligatoires : fonctionnement du jeu, apport pédagogique
- [x] Slide 2 (en anglais) : noms et rôles des cinq membres, groupe « Les Goules » ; tout le reste en français
- [x] Vidéo de fin plein écran en avant-dernière slide (avec le son, lecture automatique)
- [x] Transitions entre les slides`,
  },
  {
    titre: 'Déposer les livrables',
    etiquettes: ['étape 10', 'livrable'], jalon: VEN,
    corps: `À l'heure fixée par le coach, dans le dossier \`Workshop2025-26-M1g<n>\`.

- [ ] \`Workshop2025-26-M1g<n>-dossier.pdf\` (avec le poster A3)
- [ ] \`Workshop2025-26-M1g<n>-pres.pptx\`
- [ ] Le jeu : dépôt Git à jour et Pi prêt à jouer`,
  },
  {
    titre: 'Répéter la soutenance (2 fois, avec la démo)',
    etiquettes: ['étape 10', 'livrable', 'test'], jalon: VEN,
    corps: `- [ ] Répétition 1, tout le monde parle
- [ ] Démo en 2 modules : \`MODULES=chauffage,eclairage DURATION=420 npm start\`
- [ ] Préparer les réponses aux questions probables (sécurité, choix techniques, ce qu'on referait)
- [ ] Répétition 2`,
  },
  {
    titre: 'Jour de la soutenance : installation et démo',
    etiquettes: ['étape 10', 'livrable'], jalon: VEN,
    corps: `- [ ] Pi, écran, console, alimentation, câbles, téléphone pour le partage de connexion
- [ ] Démarrer le Pi en avance, vérifier « Arduino OK » et l'accès d'un téléphone
- [ ] Enveloppes de démo et plan A3 sur la table
- [ ] Plan de secours à portée de main
- [ ] Vérifier que la vidéo de la présentation démarre seule et que le son sort
- [ ] Parties de démo retirées de l'historique (ou présentées comme fictives)`,
  },
];

module.exports = { JALONS, ETIQUETTES, TACHES, RETIREES };
