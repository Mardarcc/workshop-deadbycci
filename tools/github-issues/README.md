# Issues GitHub du projet

Crée ou met à jour sur GitHub une issue par tâche de la marche à suivre (47 tâches), rangées par **étape** (étiquettes) et par **jour** (jalons). Les tâches faites sont fermées avec un commentaire, pour garder l'historique.

## Une seule fois : installer et connecter GitHub CLI

```powershell
winget install GitHub.cli
```

Rouvrez le terminal, puis :

```bash
gh auth login
```

Choisir **GitHub.com**, **HTTPS**, puis **Login with a web browser** : on copie le code affiché et on valide dans le navigateur avec le compte qui a les droits sur le dépôt. Aucun mot de passe n'est tapé dans le terminal.

## Créer ou mettre à jour les issues

Depuis le dossier du projet :

```bash
node tools/github-issues/creer-issues.js --essai   # aperçu, rien n'est créé
node tools/github-issues/creer-issues.js           # création ou mise à jour (environ 1 min 30)
```

Le dépôt est lu dans `git remote` ; pour en viser un autre : `--repo compte/depot`.

Le script se relance autant de fois que l'on veut, sans créer de doublons :

- une issue déjà présente (même titre) est mise à jour : texte, jalon, étiquettes, et fermeture si la tâche est passée en `fait` dans `taches.js` ;
- une issue fermée à la main n'est jamais rouverte ;
- pour renommer une issue, indiquez l'ancien titre dans `ancienTitre` ;
- les issues listées dans `RETIREES` sont supprimées (il faut être administrateur du dépôt ; sinon elles sont fermées comme « non prévues »).

Pour ajouter une tâche, ajoutez un bloc dans `taches.js` puis relancez.

## Ensuite

- Assignez chaque issue ouverte à un membre (colonne de droite sur GitHub).
- Cochez les sous-tâches au fur et à mesure, et fermez l'issue quand « C'est bon quand… » est validé.
- Dans un message de commit, `Closes #12` ferme l'issue n° 12 au moment du push.
