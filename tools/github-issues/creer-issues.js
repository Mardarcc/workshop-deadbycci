// Cree ou met a jour sur GitHub les etiquettes, les jalons (un par jour) et une issue par tache de taches.js.
// Les taches deja faites sont fermees avec un commentaire, pour garder l'historique du projet.
//
// Prerequis : GitHub CLI installe (https://cli.github.com) et connecte une fois avec "gh auth login".
// Lancer depuis le dossier du projet (PowerShell ou Git Bash) :
//   node tools/github-issues/creer-issues.js --essai     affiche ce qui serait cree, sans rien creer
//   node tools/github-issues/creer-issues.js            cree pour de vrai
//   node tools/github-issues/creer-issues.js --repo compte/depot   pour viser un autre depot
//
// On peut le relancer sans risque, autant de fois que l'on veut :
//   - une issue qui existe deja (meme titre) n'est pas recreee : son texte, son jalon et ses etiquettes
//     sont mis a jour, et elle est fermee si la tache est maintenant "fait" ;
//   - une issue fermee a la main n'est jamais rouverte ;
//   - les issues de la liste RETIREES sont supprimees (ou fermees si le compte n'a pas le droit de supprimer).

const { execFileSync } = require('child_process');
const { JALONS, ETIQUETTES, TACHES, RETIREES = [] } = require('./taches');

const args = process.argv.slice(2);
const ESSAI = args.includes('--essai');
const repoArg = args.includes('--repo') ? args[args.indexOf('--repo') + 1] : null;

function gh(params, input) {
  return execFileSync('gh', params, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);   // evite la limite anti-spam de GitHub

function stop(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

// ---------- Verifications ----------
try {
  gh(['--version']);
} catch {
  stop('GitHub CLI (gh) introuvable. Installez-le : winget install GitHub.cli (puis rouvrez le terminal).');
}
try {
  gh(['auth', 'status']);
} catch {
  stop('GitHub CLI n\'est pas connecte. Lancez : gh auth login (choisir GitHub.com, puis la connexion par navigateur).');
}

function depotParDefaut() {
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
    const m = url.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const REPO = repoArg || depotParDefaut();
if (!REPO) stop('Depot introuvable : lancez le script depuis le dossier du projet, ou ajoutez --repo compte/depot.');
console.log(`Depot : ${REPO}${ESSAI ? '  (mode essai : rien ne sera cree)' : ''}\n`);

// ---------- Etiquettes ----------
console.log(`Etiquettes (${ETIQUETTES.length})`);
for (const e of ETIQUETTES) {
  if (!ESSAI) gh(['label', 'create', e.nom, '--repo', REPO, '--color', e.couleur, '--description', e.description, '--force']);
  console.log(`  ${e.nom}`);
}

// ---------- Jalons (un par jour) ----------
console.log(`\nJalons (${JALONS.length})`);
const existants = ESSAI ? [] : JSON.parse(gh(['api', `repos/${REPO}/milestones?state=all&per_page=100`]));
const numeroJalon = {};
for (const j of JALONS) {
  const deja = existants.find((m) => m.title === j.titre);
  if (deja) {
    numeroJalon[j.titre] = deja.number;
    // Un jalon ferme n'accepte plus d'issues : on le rouvre le temps de la mise a jour (referme a la fin)
    if (deja.state === 'closed') gh(['api', '-X', 'PATCH', `repos/${REPO}/milestones/${deja.number}`, '-f', 'state=open']);
    console.log(`  deja present : ${j.titre}`);
    continue;
  }
  if (!ESSAI) {
    const cree = JSON.parse(gh(['api', `repos/${REPO}/milestones`, '-f', `title=${j.titre}`,
      '-f', `description=${j.description}`, '-f', `due_on=${j.echeance}T17:00:00Z`]));
    numeroJalon[j.titre] = cree.number;
  }
  console.log(`  cree : ${j.titre}`);
}

// ---------- Issues ----------
const existantes = ESSAI ? [] : JSON.parse(gh(['issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '500',
  '--json', 'number,title,state,url']));
const trouver = (titre) => existantes.find((i) => i.title === titre);
let crees = 0, misesAJour = 0, fermees = 0;
console.log(`\nIssues (${TACHES.length})`);
for (const t of TACHES) {
  const etat = t.fait ? 'faite' : 'a faire';
  const deja = trouver(t.titre) || (t.ancienTitre && trouver(t.ancienTitre));
  if (ESSAI) {
    console.log(`  [${etat}] ${t.titre}  (${t.etiquettes.join(', ')} · ${t.jalon})`);
    continue;
  }
  if (deja) {
    // Mise a jour : titre (si renomme), texte, jalon, etiquettes
    const params = ['issue', 'edit', String(deja.number), '--repo', REPO, '--body-file', '-', '--milestone', t.jalon];
    if (deja.title !== t.titre) params.push('--title', t.titre);
    for (const e of t.etiquettes) params.push('--add-label', e);
    gh(params, t.corps);
    misesAJour++;
    let note = 'mise a jour';
    if (t.fait && deja.state === 'OPEN') {
      gh(['issue', 'close', String(deja.number), '--repo', REPO, '--comment', `Fait ${t.fait} (voir docs/journal-de-bord.md).`]);
      fermees++;
      note = 'mise a jour et fermee';
    }
    console.log(`  [${etat}] ${t.titre}  #${deja.number} ${note}`);
  } else {
    const params = ['issue', 'create', '--repo', REPO, '--title', t.titre, '--body-file', '-', '--milestone', t.jalon];
    for (const e of t.etiquettes) params.push('--label', e);
    const url = gh(params, t.corps);
    crees++;
    if (t.fait) {
      gh(['issue', 'close', url, '--repo', REPO, '--comment', `Fait ${t.fait} (voir docs/journal-de-bord.md).`]);
      fermees++;
    }
    console.log(`  [${etat}] ${t.titre}  ${url}`);
  }
  pause(1500);
}

// ---------- Issues retirees du projet ----------
let retirees = 0;
if (RETIREES.length) console.log(`\nIssues retirees (${RETIREES.length})`);
for (const titre of RETIREES) {
  const i = trouver(titre);
  if (ESSAI) { console.log(`  a retirer : ${titre}`); continue; }
  if (!i) { console.log(`  absente : ${titre}`); continue; }
  try {
    gh(['issue', 'delete', String(i.number), '--repo', REPO, '--yes']);
    console.log(`  supprimee : ${titre}`);
  } catch {
    // Supprimer une issue demande les droits d'administrateur du depot : a defaut, on la ferme
    if (i.state === 'OPEN') gh(['issue', 'close', String(i.number), '--repo', REPO, '--reason', 'not planned', '--comment', 'Retirée du projet.']);
    console.log(`  fermee (pas le droit de la supprimer) : ${titre}`);
  }
  retirees++;
}

// ---------- Jalons termines ----------
if (!ESSAI) {
  for (const j of JALONS.filter((x) => x.ferme)) {
    if (numeroJalon[j.titre]) gh(['api', '-X', 'PATCH', `repos/${REPO}/milestones/${numeroJalon[j.titre]}`, '-f', 'state=closed']);
  }
}

const nbFaites = TACHES.filter((t) => t.fait).length;
console.log(ESSAI
  ? `\nEssai termine : ${TACHES.length} taches (${nbFaites} faites, ${TACHES.length - nbFaites} a faire), ${RETIREES.length} issue(s) a retirer.`
  : `\nTermine : ${crees} issues creees, ${misesAJour} mises a jour, ${fermees} fermees car faites, ${retirees} retiree(s).\nVoir : https://github.com/${REPO}/issues`);
