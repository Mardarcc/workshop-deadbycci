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
