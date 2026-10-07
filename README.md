# Black-out — Workshop Escape Tech (EPSI M1, 2025-2026)

Jeu coopératif à la *Keep Talking and Nobody Explodes* : un saboteur a piraté les systèmes techniques du campus. Le **QG** manipule la console (Raspberry Pi 5 + écran tactile + Arduino) sans connaître les règles ; les **agents terrain** trouvent les règles sur papier dans les salles. Thème : Environnement (énergie du bâtiment).

## Contenu du dossier

| Chemin | Contenu |
| --- | --- |
| `docs/marche-a-suivre.md` | **À lire en premier** : le guide pas à pas de la semaine |
| `docs/fiche-materiel-workshop.md` | Inventaire du matériel et état de chaque élément |
| `docs/enveloppes-agents-terrain.md` | Les 5 enveloppes à imprimer, le corrigé et le débriefing |
| `docs/installation-raspberry.md` | Installer le jeu sur le Raspberry Pi, accès des téléphones, démarrage automatique |
| `docs/impression/` | PDF à imprimer : enveloppes (A4), plan du campus (A3), corrigé |
| `docs/journal-de-bord.md` | Journal à remplir chaque jour (sert au dossier technique) |
| `docs/Sujet Workshop M1 2025-2026.pdf` | Le sujet officiel |
| `arduino/console/` | Sketch de la console du QG (tous les capteurs + protocole série) |
| `arduino/test_serie/` | Premier sketch : la molette envoie ses valeurs en série (étape 3) |
| `server/` | Serveur du jeu : 5 modules, écran du QG, page des agents, chat temps réel |
| `livrables/` | Livrables : présentation de soutenance (pptx) |
| `server/db/blackout.sql` | Base MySQL de l'historique des parties (tables + parties de démo fictives) |
| `tools/github-issues/` | Script qui crée les issues GitHub du projet (une par tâche, rangées par étape et par jour) |
| `archives/plan_led/` | Ancienne piste (ruban LED + pont MQTT), gardée pour mémoire |

## Lancer le jeu

Sur le Raspberry Pi (ou un PC pour tester), la carte Arduino branchée en USB avec le sketch `arduino/console` :

```bash
cd server
npm install
npm start
```

- Sur le Raspberry Pi, `npm start` ouvre aussi Chromium en plein écran sur la console du QG (serveur seul : `npm run serveur`).
- Écran du QG : `http://<adresse>:3000` · mode test sans Arduino : `http://<adresse>:3000/?dev=1`
- Seul l'écran du QG (le navigateur de la machine qui fait tourner le serveur) pilote la partie ; ailleurs, la page est en lecture seule. Pour tester depuis un autre PC : `DEV=1 npm start`.
- Abandonner une partie en cours : appui long de 3 s sur « BLACK-OUT · QG », puis confirmer.
- Historique des parties et meilleurs scores : `http://<adresse>:3000/historique.html` (base MySQL facultative, voir `docs/installation-raspberry.md`, section 7). Score : victoire = 1 000 points + bonus de rapidité (jusqu'à 1 000) − 150 par erreur ; défaite = 100 points par salle sécurisée.
- Générique de fin avec le logo du campus CCI Eure-et-Loir (`server/public/img/logo-cci.png`) ; en victoire : « Vous avez déjoué le blocus ! ».
- Présentation de soutenance : `livrables/Workshop2025-26-M1gX-pres.pptx` (notes de l'orateur sous chaque slide).
- Téléphones des agents : `http://<adresse>:3000/agents.html` (adresse affichée au démarrage du serveur, QR code sur l'écran du QG)
- Affiche A4 du QR code à imprimer pour les agents : `http://<adresse>:3000/qr.html` (si l'adresse détectée est fausse : `AGENTS_URL=http://192.168.x.x:3000/agents.html npm start`)
- Le port de l'Arduino est détecté tout seul. Pour le forcer : `SERIAL=COM5 npm start` (Git Bash) ou `$env:SERIAL="COM5"; npm start` (PowerShell).
- Démo jury en 2 modules : `MODULES=chauffage,eclairage DURATION=420 npm start`

| Module | Fichier | Réglage à vérifier |
| --- | --- | --- |
| 1. Chauffage | `server/modules/chauffage.js` | `KNOB_STEP` (crans de molette par degré) |
| 2. Éclairage | `server/modules/eclairage.js` | — |
| 3. Présence | `server/modules/presence.js` | `TOLERANCE` (± 2 cm) |
| 4. Code de l'armoire | `server/modules/code.js` | `SALLE_ENVELOPPE` = salle où l'enveloppe 4 est cachée |
| 5. Compteur | `server/modules/compteur.js` | — |

## Livrables (dépôt jeudi)

- `Workshop2025-26-M1g<n>-dossier.pdf` (+ poster A3)
- `Workshop2025-26-M1g<n>-pres.pptx`
- Le jeu fonctionnel

Remplacez `<n>` par le numéro du groupe.
