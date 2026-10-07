// Historique des parties dans MySQL (facultatif : sans base, le jeu marche normalement).
//
// Configuration : copier db/config.example.json en db/config.json et y mettre le mot de passe
// de l'utilisateur MySQL du jeu. db/config.json n'est pas versionne (.gitignore).
// Variables possibles a la place du fichier : DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const CONFIG_FILE = path.join(__dirname, 'db', 'config.json');
let pool = null;
let raison = 'non configure';   // pourquoi l'historique est indisponible (affiche sur la page)

function lireConfig() {
  let c = {};
  try { c = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { /* pas de fichier : variables seules */ }
  const env = process.env;
  if (!fs.existsSync(CONFIG_FILE) && !env.DB_HOST && !env.DB_USER) return null;
  return {
    host: env.DB_HOST || c.host || 'localhost',
    port: Number(env.DB_PORT || c.port || 3306),
    user: env.DB_USER || c.user || 'blackout',
    password: env.DB_PASSWORD ?? c.password ?? '',
    database: env.DB_NAME || c.database || 'blackout',
  };
}

async function demarrer() {
  const config = lireConfig();
  if (!config) {
    raison = 'base MySQL non configurée (server/db/config.json absent)';
    console.log(`Historique desactive : ${raison}`);
    return;
  }
  pool = mysql.createPool({ ...config, connectionLimit: 3, connectTimeout: 3000, dateStrings: true });
  try {
    await pool.query('SELECT 1 FROM parties LIMIT 1');
    raison = null;
    console.log(`Historique : base MySQL "${config.database}" sur ${config.host}`);
  } catch (e) {
    raison = `base MySQL injoignable (${e.code || e.message})`;
    console.log(`Historique indisponible pour l'instant : ${raison}`);
  }
}

// Enregistre une partie terminee. Ne bloque jamais le jeu : une erreur est seulement affichee.
async function enregistrer(p) {
  if (!pool) return;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO parties (debut, fin, resultat, raison, duree_max_s, temps_s, erreurs,
         salles_reussies, salles_total, modules, score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.debut, p.fin, p.resultat, p.raison, p.dureeMaxS, p.tempsS, p.erreurs,
        p.sallesReussies, p.sallesTotal, p.modules, p.score]);
    for (const [i, e] of p.etapes.entries()) {
      await conn.query(
        'INSERT INTO etapes (partie_id, ordre, module, temps_s, erreurs, reussie) VALUES (?, ?, ?, ?, ?, ?)',
        [r.insertId, i + 1, e.module, e.tempsS, e.erreurs, e.reussie]);
    }
    await conn.commit();
    raison = null;
    console.log(`Partie enregistree dans l'historique (n° ${r.insertId}, ${p.score} points)`);
  } catch (e) {
    if (conn) await conn.rollback().catch(() => {});
    raison = `enregistrement impossible (${e.code || e.message})`;
    console.error(`Historique : ${raison}`);
  } finally {
    if (conn) conn.release();
  }
}

// Donnees de la page historique (requetes preparees uniquement : pas d'injection SQL possible)
async function lire() {
  if (!pool) return { active: false, raison };
  try {
    const [parties] = await pool.query(
      `SELECT id, debut, resultat, raison, duree_max_s, temps_s, erreurs, salles_reussies,
              salles_total, modules, score, demo
       FROM parties ORDER BY fin DESC LIMIT 50`);
    const [top] = await pool.query(
      `SELECT id, debut, temps_s, erreurs, salles_total, score, demo
       FROM parties WHERE resultat = 'gagnee' ORDER BY score DESC, temps_s ASC LIMIT 5`);
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(resultat = 'gagnee'), 0) AS gagnees,
              MIN(CASE WHEN resultat = 'gagnee' AND salles_total >= 5 THEN temps_s END) AS meilleur_temps_complet,
              ROUND(AVG(score)) AS score_moyen
       FROM parties`);
    const [modules] = await pool.query(
      `SELECT module, ROUND(AVG(temps_s)) AS temps_moyen, ROUND(AVG(erreurs), 1) AS erreurs_moyennes,
              COUNT(*) AS jouees
       FROM etapes GROUP BY module ORDER BY MIN(ordre), module`);
    raison = null;
    return { active: true, parties, top, stats, modules };
  } catch (e) {
    return { active: false, raison: `base MySQL injoignable (${e.code || e.message})` };
  }
}

module.exports = { demarrer, enregistrer, lire };
