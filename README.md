# Black-out — Workshop Escape Tech (EPSI M1, 2025-2026)

Jeu coopératif à la *Keep Talking and Nobody Explodes* : un saboteur a piraté les systèmes techniques du campus. Le **QG** manipule la console (Raspberry Pi 5 + écran tactile + Arduino) sans connaître les règles ; les **agents terrain** trouvent les règles sur papier dans les salles. Thème : Environnement (énergie du bâtiment).

## Contenu du dossier

| Chemin | Contenu |
| --- | --- |
| `docs/marche-a-suivre.md` | **À lire en premier** : le guide pas à pas de la semaine |
| `docs/fiche-materiel-workshop.md` | Inventaire du matériel et état de chaque élément |
| `docs/enveloppes-agents-terrain.md` | Les 5 enveloppes à imprimer, le corrigé et le débriefing |
| `docs/journal-de-bord.md` | Journal à remplir chaque jour (sert au dossier technique) |
| `docs/Sujet Workshop M1 2025-2026.pdf` | Le sujet officiel |
| `arduino/test_serie/` | Premier sketch : la molette envoie ses valeurs en série (étape 3) |
| `server/` | Serveur Node.js minimal + page de la console (étape 4) |
| `archives/plan_led/` | Ancienne piste (ruban LED + pont MQTT), gardée pour mémoire |

## Démarrage rapide (sur le Raspberry Pi)

```bash
cd server
npm install
npm start          # puis ouvrir http://blackout.local:3000
```

## Livrables (dépôt jeudi)

- `Workshop2025-26-M1g<n>-dossier.pdf` (+ poster A3)
- `Workshop2025-26-M1g<n>-pres.pptx`
- Le jeu fonctionnel

Remplacez `<n>` par le numéro du groupe.
