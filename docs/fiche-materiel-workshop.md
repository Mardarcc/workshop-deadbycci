# Workshop Escape Tech — Fiche matériel

5 octobre 2026 · Romain

## Vue d'ensemble

Cette fiche recense tout le matériel du groupe pour le workshop : ce qu'on a, à quoi ça sert dans le jeu, et son état vérifié.

Le jeu suit le principe de *Keep Talking and Nobody Explodes*. Le **QG** est un poste fixe branché sur secteur : il manipule la console (Raspberry Pi, écran tactile, Arduino et capteurs) sans en connaître les règles. Les **agents terrain** se déplacent dans le campus : dans chaque salle, ils trouvent des documents papier (fiches, extraits de plan, énigmes) qui donnent les règles d'un module. Ils restent en contact avec le QG par le chat du jeu sur téléphone.

Pour la soutenance, les documents sont regroupés sur une table, une enveloppe par salle du plan imprimé en A3.

Colonne **État** : `À vérifier` · `OK` · `Manquant` · `HS`. Passez chaque ligne à OK après l'avoir testée.

## Raspberry Pi 5 et écran

Le Raspberry Pi 5 est le cerveau du jeu : il héberge le serveur et affiche la console du QG sur l'écran tactile. Il reste fixe au poste QG : une seule prise secteur alimente le Pi, l'écran et l'Arduino (en USB).

| Élément | Qté | Détails | Rôle dans le jeu | État |
| --- | --- | --- | --- | --- |
| Raspberry Pi 5 8 Go | 1 | Wi-Fi intégré, port DSI pour l'écran | Serveur du jeu (Node + Socket.io, broker MQTT, SQLite) et affichage console | À vérifier |
| Alimentation USB-C 27 W | 1 | Officielle 5 V / 5 A | Alimente le Pi, l'écran et l'Arduino ; une batterie externe classique ne fournit pas les 5 A demandés | À vérifier |
| Carte microSD 64 Go | 1 | Raspberry Pi OS 64 bits | Système et sauvegardes de partie | À vérifier |
| Lecteur de carte SD USB | 1 | — | Flasher l'OS (Raspberry Pi Imager) et garder une image de secours | À vérifier |
| Radiateur / ventilateur | 1 | Refroidissement actif | Évite le ralentissement du Pi pendant la démo | À vérifier |
| Coque plastique | 1 | — | Protection ; vérifier qu'elle laisse passer la nappe de l'écran | À vérifier |
| Câble HDMI | 1 | Côté Pi 5 : micro-HDMI, à vérifier | Écran externe pour le dev ou la projection au jury | À vérifier |
| [Écran tactile Freenove FNK0078](https://store.freenove.com/products/fnk0078) | 1 | 800×480, tactile capacitif 5 points, nappe DSI, sans pilote ; taille 5" ou 7" à noter | Écran de la console QG : chrono, affichages des modules, clavier de saisie | À vérifier |

## Kit Arduino Plug and Make

C'est le seul kit qui contient une carte : l'**UNO R4 WiFi**. Ses 7 modules Modulino se branchent sans soudure en I2C (câbles Qwiic, chaînables). [Source](https://store.arduino.cc/products/plug-and-make-kit)

| Élément | Qté | Détails | Rôle dans le jeu | État |
| --- | --- | --- | --- | --- |
| Arduino UNO R4 WiFi | 1 | Wi-Fi, matrice de 12×8 LEDs intégrée, connecteur Qwiic, USB-C | Carte de la console ; reliée au Pi en USB (alimentation et données série) ; la matrice affiche les erreurs | À vérifier |
| Modulino Knob | 1 | Encodeur rotatif avec bouton | Module Chauffage : régler la consigne de température | À vérifier |
| Modulino Pixels | 1 | 8 LEDs RGB adressables | Module Éclairage : 8 salles du plan, une LED par salle | À vérifier |
| Modulino Distance | 1 | Capteur de distance à temps de vol | Module Présence : placer la main à la bonne distance | À vérifier |
| Modulino Movement | 1 | Centrale inertielle 6 axes | Anti-sabotage : la console penchée = une erreur | À vérifier |
| Modulino Buzzer | 1 | Buzzer piézo | Sons d'erreur, d'alarme et de réussite | À vérifier |
| Modulino Thermo | 1 | Température + humidité | Module Chauffage : mesure réelle (on souffle ou on pose le doigt pour la faire monter) | À vérifier |
| Modulino Buttons | 1 | 3 boutons avec LED jaune | Module Éclairage : couper ou rallumer les salles | À vérifier |
| Base Modulino | 1 | Plaque de montage orange à trous | Châssis de la console | À vérifier |
| Câble USB-C + adaptateur USB-A | 1 | — | Programmation et alimentation de la carte | À vérifier |
| Câbles Qwiic | 7 | I2C | Relier les modules en chaîne | À vérifier |
| Visserie M3 | 24 vis, 20 écrous, 4 entretoises | Vis de 10 mm | Fixer carte et modules sur la base | À vérifier |

## Kit Arduino Sensor Kit

**Ce kit ne contient pas de carte Arduino.** Son shield Grove s'enfiche sur l'UNO R4 WiFi du kit Plug and Make, ou sur une UNO à emprunter au myDiL. [Source](https://store.arduino.cc/products/sensor-kit-base)

| Élément | Qté | Détails | Rôle dans le jeu | État |
| --- | --- | --- | --- | --- |
| Base Shield Grove | 1 | 16 connecteurs : 7 numériques, 4 analogiques, 4 I2C, 1 UART | Branche tous les modules Grove sur la carte | À vérifier |
| Grove LED | 1 | Numérique | Voyant « module désamorcé » | À vérifier |
| Grove Button | 1 | Numérique | Bouton « Valider » de la console | À vérifier |
| Grove Potentiometer | 1 | Analogique | Module Compteur : régler la valeur calculée (kWh → CO₂) | À vérifier |
| Grove Buzzer | 1 | Numérique | Module Code : joue une séquence en morse à décoder | À vérifier |
| Grove Light Sensor | 1 | Analogique | Module Éclairage : cacher ou éclairer le capteur | À vérifier |
| Grove Sound Sensor | 1 | Analogique | Module Code (variante) : taper un rythme dans les mains | À vérifier |
| Grove Air Pressure | 1 | I2C | Réserve | À vérifier |
| Grove Temperature & Humidity | 1 | I2C | Réserve (doublon du Modulino Thermo) | À vérifier |
| Grove Accelerometer | 1 | I2C | Réserve (doublon du Modulino Movement) | À vérifier |
| Grove OLED | 1 | Écran I2C | Module Compteur : affiche l'index du compteur électrique | À vérifier |
| Câbles Grove | 6 | — | Utiles si on détache les modules du shield | À vérifier |

## Répartition par module du jeu

Cinq modules, un par membre du groupe ; chaque module représente un système du campus piraté par le saboteur (proposition à valider).

| Module | Console QG : voit / fait | Agents terrain : trouvent sur papier (en salle) | Matériel |
| --- | --- | --- | --- |
| 1. Chauffage | Salle et température mesurée à l'écran ; tourne la molette | Grille des consignes par type de salle et par horaire | Modulino Thermo, Modulino Knob |
| 2. Éclairage | 8 LEDs = 8 salles du plan ; appuie sur les boutons | Planning d'occupation : quelles salles éteindre | Modulino Pixels, Modulino Buttons, Grove Light Sensor |
| 3. Présence | Un code capteur à l'écran ; place la main à la bonne distance | Table code → distance en cm | Modulino Distance |
| 4. Code de l'armoire | Entend une séquence en morse ; tape le code sur l'écran | Alphabet morse + règle de transformation | Grove Buzzer, écran tactile |
| 5. Compteur | Index kWh sur l'OLED ; règle le potentiomètre puis valide | Facteur d'émission CO₂ et formule | Grove OLED, Grove Potentiometer, Grove Button |
| Commun | Chrono, erreurs (3 = black-out), console à garder à plat | Chat avec le QG | Écran, matrice LED de la R4, Modulino Buzzer, Modulino Movement, Grove LED |

## À prévoir et points d'attention

Le principal risque est d'avoir une seule carte Arduino pour deux kits : à tester dès le premier jour.

- [ ] Tester le shield Grove enfiché sur l'UNO R4 WiFi, avec les Modulino branchés en même temps sur le connecteur Qwiic
- [ ] Vérifier que la bibliothèque Arduino Sensor Kit fonctionne sur la R4 ; sinon, emprunter une UNO au myDiL pour les modules Grove
- [ ] Brancher l'écran avec la nappe prévue pour le Pi 5 (son connecteur DSI est plus petit que sur les anciens Pi)
- [ ] Vérifier que le Wi-Fi de l'école laisse les appareils se parler ; sinon, passer le Pi en point d'accès Wi-Fi
- [ ] Prévoir une multiprise au poste QG et les téléphones chargés des agents terrain
- [ ] Imprimer le plan du campus (plan d'évacuation) en A3, et les fiches et énigmes papier : une enveloppe par salle, plus un jeu de secours
- [ ] Faire une image de la carte microSD une fois le Pi configuré (plan de secours)
