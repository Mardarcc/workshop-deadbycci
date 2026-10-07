# Issues GitHub du projet

Crée sur GitHub une issue par tâche de la marche à suivre (43 tâches), rangées par **étape** (étiquettes) et par **jour** (jalons). Les tâches déjà faites sont créées puis fermées, pour garder l'historique.

## Une seule fois : installer et connecter GitHub CLI

```powershell
winget install GitHub.cli
```

Rouvrez le terminal, puis :

```bash
gh auth login
```

Choisir **GitHub.com**, **HTTPS**, puis **Login with a web browser** : on copie le code affiché et on valide dans le navigateur avec le compte qui a les droits sur le dépôt. Aucun mot de passe n'est tapé dans le terminal.

## Créer les issues

Depuis le dossier du projet :

```bash
node tools/github-issues/creer-issues.js --essai   # aperçu, rien n'est créé
node tools/github-issues/creer-issues.js           # création (environ 1 min 30)
```

Le dépôt est lu dans `git remote` ; pour en viser un autre : `--repo compte/depot`.

Relancer le script ne crée pas de doublons : les issues et jalons déjà présents (même titre) sont ignorés. Pour ajouter une tâche, ajoutez un bloc dans `taches.js` puis relancez.

## Ensuite

- Assignez chaque issue ouverte à un membre (colonne de droite sur GitHub).
- Cochez les sous-tâches au fur et à mesure, et fermez l'issue quand « C'est bon quand… » est validé.
- Dans un message de commit, `Closes #12` ferme l'issue n° 12 au moment du push.
