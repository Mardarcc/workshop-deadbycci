# Black-out — Enveloppes des agents terrain

5 octobre 2026 · Romain

## Mode d'emploi

Cinq enveloppes, une par module, cachées dans cinq salles du campus ; chacune contient la fiche de règles et l'énigme d'un module de la console.

- **Imprimer** : chaque enveloppe ci-dessous tient sur une page A4. Ne pas imprimer le corrigé.
- **Cacher** : notez la salle de chaque enveloppe sur le plan A3. Le numéro de la salle sert dans l'enveloppe 4, gardez donc le même plan partout.
- **Soutenance** : les cinq enveloppes sont posées sur une table, chacune sur sa salle du plan A3.

**Règles communes de la console**

- Chrono : 20 minutes en jeu complet, 7 minutes en démo jury (2 modules).
- Les modules se jouent **un par un** : l'écran indique le module actif. Les commandes (molette, boutons) sont donc partagées entre modules.
- Mauvaise validation = 1 erreur. 3 erreurs = black-out, partie perdue.
- Console penchée de plus de 30° (sabotage) = 1 erreur.
- Les agents terrain ne voient jamais la console ; le QG ne lit jamais les enveloppes. Ils communiquent par le chat du jeu.

---

## Enveloppe 1 — Chauffage

*Le saboteur a poussé le chauffage à fond dans tout le campus. Retrouvez la température autorisée pour chaque salle que le QG vous annonce.*

**Ce que dit la loi** (Code de l'énergie, art. R241-26) pour les locaux d'enseignement, de bureaux et recevant du public :

| Situation de la salle | Température maximale |
| --- | --- |
| Occupée | 19 °C |
| Inoccupée depuis 24 h à moins de 48 h | 16 °C |
| Inoccupée depuis 48 h ou plus | 8 °C |

Règle du jeu : une salle vide depuis moins de 24 h compte comme occupée.

**Énigme**

Le QG voit sur l'écran le nom de la salle, le jour et l'heure de la console, et l'heure de la dernière sortie enregistrée par le badge. Il ne connaît pas la loi.

1. Demandez au QG ces trois informations.
2. Calculez depuis combien d'heures la salle est vide.
3. Donnez-lui la température à régler avec la molette, puis faites-lui appuyer sur la molette pour valider.
4. Recommencez pour chaque salle (3 salles).

**Le saviez-vous ?** Baisser le chauffage de 1 °C économise environ 7 % d'énergie (ADEME).

---

## Enveloppe 2 — Éclairage

*Le saboteur a allumé toutes les lumières du campus. Seules les salles occupées doivent rester allumées.*

Sur la console, les 8 LEDs correspondent aux 8 salles du plan, de gauche à droite :

| LED | Salle |
| --- | --- |
| 1 | Accueil |
| 2 | CDI |
| 3 | Salle Info 1 |
| 4 | Salle Info 2 |
| 5 | Cafétéria |
| 6 | Amphi |
| 7 | Administration |
| 8 | myDiL |

**Énigme : qui est où en ce moment ?**

Demandez d'abord au QG le jour et l'heure affichés sur la console. Puis servez-vous de ces informations du planning :

1. L'accueil est ouvert de 8 h à 18 h, du lundi au samedi.
2. La cafétéria ferme à 14 h.
3. Le CDI est fermé le mardi après-midi.
4. L'amphi ne sert que le vendredi, pour les soutenances.
5. Le groupe de M1 travaille soit dans l'amphi, soit en Info 1.
6. Le coach du myDiL est en réunion à l'administration tout l'après-midi ; sans lui, le myDiL est fermé.
7. Quand le myDiL est fermé, ses étudiants travaillent en Info 2.

Indiquez au QG les salles à éteindre. Il déplace le curseur avec les boutons ◀ et ▶, allume ou éteint avec le bouton du milieu, puis valide avec le bouton « Valider ».

**Le saviez-vous ?** Éteindre une salle vide est l'économie d'énergie la plus simple qui soit : un interrupteur ou un détecteur de présence suffit.

---

## Enveloppe 3 — Présence

*Le saboteur a déréglé les détecteurs de présence : les lumières ne s'éteignent plus jamais. Recalibrez-les.*

Un détecteur fixé au plafond surveille un cône. Au sol, ce cône forme un cercle dont le rayon se calcule ainsi :

> **rayon = hauteur × tan(angle)**

| Capteur | Emplacement | Hauteur de fixation | Angle du cône |
| --- | --- | --- | --- |
| C-12 | Couloir | 2,50 m | 30° |
| C-27 | Amphi | 4,00 m | 40° |
| C-35 | Hall d'entrée | 2,20 m | 45° |

| Angle | 20° | 30° | 40° | 45° | 60° |
| --- | --- | --- | --- | --- | --- |
| tan | 0,36 | 0,58 | 0,84 | 1,00 | 1,73 |

**Énigme**

1. Demandez au QG le code du capteur affiché à l'écran.
2. Calculez le rayon de détection de ce capteur, en mètres.
3. La console est une maquette au 1/10 : convertissez ce rayon en centimètres sur la maquette.
4. Le QG doit tenir sa main immobile à cette distance au-dessus du capteur pendant 3 secondes (à 2 cm près).
5. Recommencez pour chaque capteur annoncé (3 capteurs).

**Le saviez-vous ?** Un détecteur mal placé laisse des zones aveugles ou se déclenche pour rien : son réglage se calcule, comme ici.

---

## Enveloppe 4 — Code de l'armoire

*Le saboteur a verrouillé l'armoire électrique. La console laisse fuiter un signal sonore : c'est le mot de passe, mais chiffré.*

**Énigme**

1. Le QG entend une suite de bips courts (•) et longs (—). Il vous la transmet lettre par lettre dans le chat.
2. Décodez le mot avec l'alphabet morse ci-dessous.
3. Chiffrez-le : avancez chaque lettre d'autant de rangs que le **numéro de la salle où vous avez trouvé cette enveloppe** (voir la liste des salles de l'enveloppe 2). Après Z, on repart à A.
4. Le QG tape le code obtenu sur l'écran tactile.

Exemple avec un décalage de 2 : CHAUD devient EJCWF.

`A B C D E F G H I J K L M N O P Q R S T U V W X Y Z`

| Lettre | Morse | Lettre | Morse |
| --- | --- | --- | --- |
| A | • — | N | — • |
| B | — • • • | O | — — — |
| C | — • — • | P | • — — • |
| D | — • • | Q | — — • — |
| E | • | R | • — • |
| F | • • — • | S | • • • |
| G | — — • | T | — |
| H | • • • • | U | • • — |
| I | • • | V | • • • — |
| J | • — — — | W | • — — |
| K | — • — | X | — • • — |
| L | • — • • | Y | — • — — |
| M | — — | Z | — — • • |

**Le saviez-vous ?** Le watt (W) mesure une puissance, le kilowattheure (kWh) une énergie : un appareil de 1 000 W allumé pendant 1 heure consomme 1 kWh.

---

## Enveloppe 5 — Compteur

*Pour prouver le sabotage, il faut chiffrer les dégâts : combien de CO₂ le saboteur a-t-il fait émettre ce week-end ?*

**Données**

- Un week-end normal, le campus consomme 600 kWh (serveurs, veilles, éclairage de sécurité).
- Produire 1 kWh d'électricité en France a émis en moyenne 30 g de CO₂ en 2024, sur tout le cycle de vie des centrales (RTE).
- 1 kg = 1 000 g.

**Énigme**

1. Le QG lit sur le petit écran du compteur deux index : celui du vendredi 18 h et celui du lundi 8 h. Demandez-les-lui.
2. Calculez la consommation du week-end en kWh.
3. Retirez la consommation normale : il reste ce qui est dû au sabotage.
4. Convertissez en kg de CO₂.
5. Le QG règle le potentiomètre sur ce nombre de kg (à 2 kg près), puis appuie sur « Valider ».

**Le saviez-vous ?** L'électricité française émet peu de CO₂ grâce au nucléaire, à l'hydraulique et aux renouvelables. Gaspiller coûte quand même : de l'argent, et de l'électricité qui manque lors des pics de consommation en hiver.

---

## Corrigé et comportement de la console

**À ne pas imprimer.** Ce tableau donne aux développeurs ce que la console affiche et la réponse qu'elle attend, pour la partie de démo (mardi 14 h 20).

| Module | La console affiche | Réponse attendue | Validation |
| --- | --- | --- | --- |
| 1. Chauffage (tour 1) | Amphi ; dernière sortie vendredi 18 h 00 | 92 h 20 de vide → **8 °C** | Molette 5–25 °C par pas de 1, appui sur la molette |
| 1. Chauffage (tour 2) | Info 1 ; badge actif | Occupée → **19 °C** | Idem |
| 1. Chauffage (tour 3) | CDI ; dernière sortie lundi 12 h 00 | 26 h 20 de vide → **16 °C** | Idem |
| 2. Éclairage | 8 LEDs allumées | Éteindre **2, 5, 6, 8** ; garder 1, 3, 4, 7 | Boutons ◀ ▶ et basculer, puis « Valider » |
| 3. Présence (tour 1) | C-12 | 2,50 × 0,58 = 1,45 m → **14,5 cm** | Main entre 12,5 et 16,5 cm pendant 3 s |
| 3. Présence (tour 2) | C-27 | 4,00 × 0,84 = 3,36 m → **33,6 cm** | Entre 31,6 et 35,6 cm pendant 3 s |
| 3. Présence (tour 3) | C-35 | 2,20 × 1,00 = 2,20 m → **22 cm** | Entre 20 et 24 cm pendant 3 s |
| 4. Code de l'armoire | Le buzzer joue WATT en boucle | Décalage N = numéro de la salle de cachette ; avec N = 3 : **ZDWW** | Saisie sur l'écran tactile |
| 5. Compteur | Vendredi 18 h : 048 120 kWh ; lundi 8 h : 050 520 kWh | 2 400 − 600 = 1 800 kWh × 30 g = **54 kg** | Potentiomètre 0–100 kg, accepté de 52 à 56, puis « Valider » |

Logique de l'enveloppe 2 : l'amphi est vide (on n'est pas vendredi), donc le groupe de M1 est en Info 1. Le coach est à l'administration, donc le myDiL est fermé et ses étudiants sont en Info 2.

Morse : point 150 ms, trait 450 ms, 1 s entre deux lettres, le mot reprend toutes les 5 s.

Pour rejouer, le serveur peut tirer au hasard les valeurs (salles, capteurs, mot, index) dans une petite liste ; seules les fiches restent fixes.

## Débriefing pédagogique

Affiché sur l'écran à la fin de la partie, gagnée ou perdue, et lu à voix haute avec les joueurs (environ 3 minutes).

| Module | Ce qu'on retient | À faire dans la vraie vie |
| --- | --- | --- |
| Chauffage | La loi plafonne le chauffage à 19 °C, et moins quand les locaux sont vides. 1 °C de moins ≈ 7 % d'énergie en moins. | Vérifier le thermostat de sa chambre, baisser avant de partir en week-end. |
| Éclairage | Une lumière dans une salle vide est un gaspillage pur. | Éteindre en sortant, signaler une salle restée allumée. |
| Présence | Un capteur automatique ne marche bien que s'il est bien réglé ; ce réglage se calcule. | Repérer les détecteurs du lycée et ce qu'ils couvrent. |
| Code de l'armoire | Puissance (W) et énergie (kWh) sont deux grandeurs différentes. | Lire la puissance sur l'étiquette d'un appareil et estimer ce qu'il consomme. |
| Compteur | L'électricité française émet peu de CO₂, mais chaque kWh gaspillé compte quand même. | Relever le compteur de chez soi deux jours de suite et comparer. |

Question finale aux joueurs : « Quel geste de la partie pourriez-vous faire dès demain dans votre lycée ? »

## Sources

- [Chauffage dans les bâtiments — Ministère de la Transition écologique](https://www.ecologie.gouv.fr/politiques-publiques/chauffage-batiments) : 19 °C, 16 °C et 8 °C (Code de l'énergie, art. R241-26)
- [Comment réduire sa consommation de chauffage ? — Connaissance des Énergies](https://www.connaissancedesenergies.org/questions-et-reponses-energies/comment-reduire-sa-consommation-de-chauffage) : 1 °C de moins = 7 % d'économie, selon l'ADEME
- [Bilan électrique 2024, chapitre Émissions — RTE](https://assets.rte-france.com/analyse-et-donnees/2025-03/BE2024%20-%20Chapitre%20%C3%89missions.pdf) : 30,2 gCO₂éq/kWh en cycle de vie (21,7 g en émissions directes)

Les plannings, capteurs et index de compteur sont fictifs, inventés pour le jeu.
