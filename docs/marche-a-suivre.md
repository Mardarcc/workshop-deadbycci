# Black-out — Marche à suivre

Guide pas à pas pour construire le jeu **tous ensemble**, étape par étape. On ne passe à l'étape suivante que quand la case « C'est bon quand… » est validée.

> Repères : **Pi** = Raspberry Pi 5 (poste QG) · **R4** = Arduino UNO R4 WiFi · **Modulino** = modules du kit Plug and Make · **Grove** = modules du Sensor Kit.

## Où on en est (mercredi matin)

On a **un jour d'avance** : le jeu complet tourne sur PC avec la vraie console. Il reste à le passer sur le Pi, à le jouer en vrai dans les salles, puis à préparer les livrables.

| Étape | État |
| --- | --- |
| 0. S'organiser, dépôt Git | ✅ Fait (lundi) |
| 1. Préparer le Raspberry Pi | ✅ Ubuntu Server installé, écran tactile OK |
| 2. Découvrir l'Arduino | ✅ Modulino et Grove testés ensemble |
| 3. Faire parler l'Arduino | ✅ Liaison série validée sur PC (sur le Pi : étape 4) |
| 4. Le jeu sur le Pi | ⏳ **À faire maintenant** |
| 5–6. Les 5 modules | ✅ Codés et testés sur PC avec la vraie console |
| 7. Agents et chat | ✅ Chat, QR code, affiche QR · ⏳ test à plusieurs téléphones |
| 7 bis. Historique, score, générique de fin | ✅ Codés, logo du campus en place · ⏳ MySQL sur le Pi |
| 8. Sécurité et fiabilité | ⏳ En partie (voir la liste) |
| 9. Test avec de vrais joueurs | ⏳ |
| 10. Livrables | ⏳ |

---

## Étape 0 — S'organiser ✅

- **Pilote** : il tient le clavier. On change de pilote toutes les heures, pour que tout le monde touche au Pi et à l'Arduino.
- **Copilote** : il lit ce guide et la doc, et repère les erreurs.
- **Secrétaire** : il tient le **journal de bord** (`docs/journal-de-bord.md`). C'est la matière du dossier technique, et la grille note « journal » et « Git ».
- Les deux autres préparent ce qui ne bloque pas le pilote : impression, enveloppes, poster, présentation.

**Git** : un commit par avancée, avec un message qui dit ce qui a changé (`ADD affiche QR code`, `FIX consigne bloquée à 25 °C`). Évitez les messages `...` : le jury lit l'historique.

---

## Étapes 1 à 3 — Pi, Arduino, liaison série ✅

Faites lundi et mardi matin (détails dans le journal de bord). Ce qu'il faut retenir :

- Le Pi tourne sous **Ubuntu Server** ; l'écran tactile s'affiche.
- La R4 se programme **depuis un PC** avec l'IDE Arduino 2 (bibliothèques **Modulino** et **Arduino_SensorKit**). Le sketch reste dans la carte : pas d'IDE sur le Pi.
- **Après chaque modification de `arduino/console/console.ino`, il faut le retéléverser depuis un PC.** Dernière modification : séquences de victoire et de défaite (`VICTORY`, `DEFEAT`).

---

## Étape 4 — Le jeu sur le Raspberry Pi ⏳ (mercredi matin)

Suivez **`docs/installation-raspberry.md`** dans l'ordre. En résumé :

1. Installer `git`, `nodejs`, `npm`, ajouter l'utilisateur au groupe `dialout`, redémarrer.
2. Cloner le dépôt, puis `cd server && npm install`.
3. Brancher la R4 en USB sur le Pi, lancer `npm start` **depuis l'écran du Pi** : Chromium s'ouvre en plein écran sur la console du QG.
4. Connecter le Pi au partage de connexion d'un téléphone de l'équipe (réseau de la soutenance).
5. Démarrage automatique à l'allumage (connexion automatique + `npm start`).

✅ **C'est bon quand**, après un `sudo reboot`, la console du QG s'affiche toute seule en plein écran, avec « Arduino OK » en haut à droite.

---

## Étapes 5 et 6 — Les 5 modules ✅

| Module | Matériel | Réglage à vérifier en partie réelle |
| --- | --- | --- |
| 1. Chauffage | Molette (Knob) + Thermo | `KNOB_STEP` : crans de molette par degré |
| 2. Éclairage | Pixels + Buttons + bouton Valider | — |
| 3. Présence | Distance (main tenue 3 s) | `TOLERANCE` (± 2 cm) |
| 4. Code de l'armoire | Buzzer Grove (morse) + clavier AZERTY tactile | `SALLE_ENVELOPPE` = salle où l'enveloppe 4 est cachée |
| 5. Compteur | OLED + potentiomètre + Valider | — |
| Commun | Chrono, 3 erreurs (matrice LED), anti-sabotage (Movement), séquences de victoire et de défaite | `DURATION` (20 min par défaut) |

### Le protocole série (pièce du dossier)

Une ligne de texte par message, 115 200 bauds. La liste complète est en tête de `arduino/console/console.ino`.

| Sens | Message | Signification |
| --- | --- | --- |
| Arduino → Pi | `READY` | La carte vient de démarrer (le serveur lui renvoie l'état de la partie) |
| Arduino → Pi | `KNOB 19` / `KNOBPRESS` | Molette : valeur, appui |
| Arduino → Pi | `BTN 0` / `BTN 1` / `BTN 2` | Boutons Modulino ◀ / milieu / ▶ |
| Arduino → Pi | `VALID` | Bouton Grove « Valider » |
| Arduino → Pi | `TEMP 23.4` · `DIST 143` · `POT 512` · `LIGHT 300` | Température (°C), distance (mm), potentiomètre et lumière (0–1023) |
| Arduino → Pi | `TILT` | Console penchée de plus de 30° (sabotage) |
| Pi → Arduino | `LED 3 ON` / `OFF` / `OK` / `KO` · `LEDS OFF` | LEDs du Modulino Pixels (blanc, éteint, vert, rouge) |
| Pi → Arduino | `MORSE WATT` / `MORSE STOP` | Mot en morse sur le buzzer Grove |
| Pi → Arduino | `OLED 2 <texte>` · `OLEDCLR` | Écrire sur une ligne de l'OLED, l'effacer |
| Pi → Arduino | `ERRORS 2` · `BEEP OK` / `BEEP KO` | Erreurs sur la matrice LED, bip de réussite ou d'erreur |
| Pi → Arduino | `VICTORY` / `VICTORY FINAL` · `DEFEAT` | Séquences de victoire (arc-en-ciel + mélodie) et de défaite (LEDs rouges + jingle) |

---

## Étape 7 — Agents terrain et chat ✅ (test à faire)

Déjà en place : page `agents.html` (pseudo, chrono, module en cours, chat), QR code sur l'écran d'accueil du QG, affiche A4 du QR code (`http://<adresse>:3000/qr.html`).

1. Une fois le Pi sur le réseau final, ouvrir `qr.html`, écrire le nom du Wi-Fi, imprimer.
2. Connecter **trois téléphones** au même Wi-Fi, scanner le QR code, s'envoyer des messages avec le QG.
3. Couper le Wi-Fi d'un téléphone puis le remettre : le bandeau « Connexion perdue » apparaît puis disparaît, l'historique revient.

✅ **C'est bon quand** un message tapé sur un téléphone apparaît sur l'écran du QG et sur les autres téléphones, et inversement.

---

## Étape 7 bis — Historique des parties, score et générique de fin (mercredi)

Déjà en place dans le code :

- **Score** (`server/score.js`) : victoire = 1 000 points + bonus de rapidité (1 000 × temps restant ÷ temps total) − 150 points par erreur ; défaite = 100 points par salle sécurisée. Affiché sur l'écran de fin.
- **Historique** dans MySQL (`server/db/blackout.sql`) : table `parties` (résultat, temps, erreurs, score…) et table `etapes` (temps et erreurs de chaque salle). Page `historique.html` : statistiques, 5 meilleurs scores, temps moyen par salle, 50 dernières parties. Bouton « Historique des parties » sur l'accueil et l'écran de fin du QG.
- **Intrigue et briefing** : tel un gréviste, le saboteur veut consolider le blocus du campus, en soutien aux lycéens mobilisés, en provoquant un black-out général. L'accueil du QG fait défiler ce briefing à droite du QR code (toucher pour mettre en pause).
- **Générique de fin** : après l'animation de victoire ou de défaite, le logo du campus CCI Eure-et-Loir apparaît avec le résultat et le score qui défile (8 s, toucher pour fermer), sur le QG et les téléphones.

À faire :

1. Installer MySQL sur le Pi, créer la base et l'utilisateur du jeu : `docs/installation-raspberry.md`, section 7.
2. ✅ Logo du campus en place (`server/public/img/logo-cci.png`). En victoire : fond rose CCI et « Vous avez déjoué le blocus ! ».
3. Jouer une partie et vérifier qu'elle apparaît dans l'historique.
4. Avant la soutenance : retirer les parties de démo (`DELETE FROM parties WHERE demo = TRUE;`) ou les montrer en expliquant qu'elles sont fictives (elles sont marquées « démo »).

✅ **C'est bon quand** une partie jouée sur le Pi apparaît sur la page historique avec son score.

---

## Étape 8 — Sécurité et fiabilité (jeudi matin)

Ce sont des points de la grille. Notez-les dans le dossier.

- [x] **Pas de données personnelles** : les agents tapent seulement un pseudo ; le chat repart à zéro à chaque partie.
- [x] **Chat protégé** : 300 caractères maximum, anti-spam, affichage en texte brut (pas d'injection HTML).
- [x] **Pas de triche** : les bonnes réponses restent sur le serveur, et seul l'écran du QG (le Pi lui-même) peut lancer, réinitialiser ou simuler. Un téléphone qui ouvre la page du QG est en lecture seule.
- [x] **Arduino débranché** : le serveur réessaie toutes les 2 secondes, puis renvoie l'état de la partie à la console.
- [x] **Reprise après incident** : l'état est sauvegardé chaque seconde et relu au démarrage (une sauvegarde faite avec d'autres modules est ignorée).
- [x] **Base de données** : requêtes préparées (pas d'injection SQL), utilisateur MySQL limité à lire et ajouter, mot de passe hors du dépôt (`server/db/config.json` dans `.gitignore`), et le jeu continue si la base est absente.
- [ ] **Test sur le Pi** : débrancher l'alimentation du Pi en pleine partie ; au redémarrage, la partie doit reprendre au même endroit.
- [ ] **HTTPS** (optionnel, à décider en équipe) : certificat auto-signé. Les téléphones affichent un avertissement à accepter, et Chromium sur le Pi doit être lancé avec l'option qui ignore cet avertissement. À ne faire que s'il reste du temps après le test joueurs ; sinon, expliquer au jury pourquoi le réseau local fermé (partage de connexion) suffit.
- [ ] **Plan de secours** : image de la carte microSD, un jeu d'enveloppes de rechange, le jeu installé aussi sur un PC portable (`npm start` marche aussi sous Windows).

✅ **C'est bon quand** le test « débrancher le Pi en pleine partie » réussit.

---

## Étape 9 — Tester avec de vrais joueurs (mercredi après-midi ou jeudi midi)

1. Imprimer `docs/impression/` : enveloppes (A4), plan du campus (A3), corrigé (pour vous) et l'affiche QR code.
2. Cacher les enveloppes dans les salles, régler `SALLE_ENVELOPPE` dans `server/modules/code.js` selon la salle choisie pour l'enveloppe 4.
3. Faire jouer **un autre groupe**, sans les aider. Noter où ils bloquent et combien de temps prend chaque module.
4. Ajuster : `KNOB_STEP`, tolérances, durée, indices. Commit + `git pull` sur le Pi.

✅ **C'est bon quand** une équipe extérieure finit la partie en moins de 20 minutes.

Pendant une partie, pour **abandonner et revenir à l'accueil** : appui long de 3 secondes sur « BLACK-OUT · QG », puis confirmer.

---

## Étape 10 — Livrables et soutenance (jeudi → vendredi)

**Dépôt jeudi**, à l'heure fixée par le coach, dans le dossier `Workshop2025-26-M1g<n>` :

- [ ] Le jeu fonctionnel (le dépôt Git et le Pi prêt à jouer)
- [ ] `Workshop2025-26-M1g<n>-dossier.pdf` : choix technologiques, architecture (schéma Arduino → Pi → écrans et téléphones → MySQL), algorithmes (protocole série, validation des réponses, reprise après incident, calcul du score), modèle de données (tables `parties` et `etapes`), sécurité, + poster scientifique A3. Le journal de bord fournit la matière.
- [ ] `Workshop2025-26-M1g<n>-pres.pptx` : présentation de chaque membre **en anglais**, fonctionnement du jeu, apport pédagogique

**Soutenance vendredi** : 5 min de pitch (tout le monde parle) + 10 min de questions. Démo courte en 2 modules :

```bash
MODULES=chauffage,eclairage DURATION=420 npm start
```

Répétez au moins deux fois jeudi soir, chrono en main.

---

## Planning récapitulatif (mis à jour mercredi)

| Jour | Prévu | Objectif du soir |
| --- | --- | --- |
| Lundi | 0, 1, 2 | ✅ Pi prêt, écran OK, chaque module Arduino testé |
| Mardi | 3 → 7 | ✅ Partie complète jouable sur PC, chat, interface tactile, séquences de victoire et de défaite |
| Mercredi | 4, 7, 7 bis, 9 | Jeu installé sur le Pi avec MySQL, partie test dans les salles, réglages ; début du dossier |
| Jeudi | 8, 10 | Test de reprise, livrables déposés, répétition de la soutenance |
| Vendredi | Soutenance | — |
