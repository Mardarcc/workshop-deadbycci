-- Base de donnees de l'historique des parties Black-out (MySQL 8 ou MariaDB)
--
-- Installation (sur le Pi ou un PC) :
--   sudo mysql < server/db/blackout.sql
-- puis creer l'utilisateur du jeu (voir docs/installation-raspberry.md, section MySQL).
--
-- Relancer ce fichier remet la base a zero : il supprime les tables et reinsere les parties de demo.

CREATE DATABASE IF NOT EXISTS blackout CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blackout;

DROP TABLE IF EXISTS etapes;
DROP TABLE IF EXISTS parties;

-- Une ligne par partie terminee (gagnee ou perdue)
CREATE TABLE parties (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  debut           DATETIME NOT NULL,
  fin             DATETIME NOT NULL,
  resultat        ENUM('gagnee', 'perdue') NOT NULL,
  raison          VARCHAR(120) NULL,                 -- raison de la defaite (trois erreurs, temps ecoule)
  duree_max_s     SMALLINT UNSIGNED NOT NULL,        -- chrono de depart (1200 s = 20 min)
  temps_s         SMALLINT UNSIGNED NOT NULL,        -- temps reellement joue
  erreurs         TINYINT UNSIGNED NOT NULL,
  salles_reussies TINYINT UNSIGNED NOT NULL,
  salles_total    TINYINT UNSIGNED NOT NULL,
  modules         VARCHAR(100) NOT NULL,             -- modules joues, dans l'ordre (ex. chauffage,eclairage)
  score           SMALLINT UNSIGNED NOT NULL,        -- calcule par server/score.js
  demo            BOOLEAN NOT NULL DEFAULT FALSE,    -- TRUE = partie fictive inseree par ce fichier
  PRIMARY KEY (id),
  INDEX idx_parties_score (score),
  INDEX idx_parties_fin (fin)
) ENGINE=InnoDB;

-- Une ligne par salle jouee : temps et erreurs de chaque module
CREATE TABLE etapes (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partie_id INT UNSIGNED NOT NULL,
  ordre     TINYINT UNSIGNED NOT NULL,               -- 1 = premiere salle
  module    VARCHAR(20) NOT NULL,
  temps_s   SMALLINT UNSIGNED NOT NULL,
  erreurs   TINYINT UNSIGNED NOT NULL,
  reussie   BOOLEAN NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_etapes_partie FOREIGN KEY (partie_id) REFERENCES parties (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Donnees de demonstration (FICTIVES, colonne demo = TRUE)
-- La page historique les marque « démo ». Pour les supprimer :
--   DELETE FROM parties WHERE demo = TRUE;
-- ---------------------------------------------------------------------------

INSERT INTO parties
  (id, debut, fin, resultat, raison, duree_max_s, temps_s, erreurs, salles_reussies, salles_total, modules, score, demo)
VALUES
  (1, '2026-10-05 16:10:00', '2026-10-05 16:25:35', 'perdue', 'Trois erreurs : le saboteur a gagné', 1200, 935, 3, 3, 5, 'chauffage,eclairage,presence,code,compteur', 300, 1),
  (2, '2026-10-05 16:45:00', '2026-10-05 17:03:20', 'gagnee', NULL, 1200, 1100, 2, 5, 5, 'chauffage,eclairage,presence,code,compteur', 783, 1),
  (3, '2026-10-06 10:05:00', '2026-10-06 10:25:00', 'perdue', 'Temps écoulé', 1200, 1200, 2, 2, 5, 'chauffage,eclairage,presence,code,compteur', 200, 1),
  (4, '2026-10-06 11:20:00', '2026-10-06 11:35:40', 'gagnee', NULL, 1200, 940, 1, 5, 5, 'chauffage,eclairage,presence,code,compteur', 1067, 1),
  (5, '2026-10-06 14:00:00', '2026-10-06 14:04:00', 'gagnee', NULL, 420, 240, 0, 2, 2, 'chauffage,eclairage', 1429, 1),
  (6, '2026-10-06 14:30:00', '2026-10-06 14:35:10', 'gagnee', NULL, 420, 310, 2, 2, 2, 'chauffage,eclairage', 962, 1),
  (7, '2026-10-06 15:10:00', '2026-10-06 15:16:40', 'perdue', 'Trois erreurs : le saboteur a gagné', 1200, 400, 3, 1, 5, 'chauffage,eclairage,presence,code,compteur', 100, 1),
  (8, '2026-10-07 09:40:00', '2026-10-07 09:54:10', 'gagnee', NULL, 1200, 850, 1, 5, 5, 'chauffage,eclairage,presence,code,compteur', 1142, 1),
  (9, '2026-10-07 10:15:00', '2026-10-07 10:33:40', 'gagnee', NULL, 1200, 1120, 2, 5, 5, 'chauffage,eclairage,presence,code,compteur', 767, 1),
  (10, '2026-10-07 11:00:00', '2026-10-07 11:03:35', 'gagnee', NULL, 420, 215, 0, 2, 2, 'chauffage,eclairage', 1488, 1);

INSERT INTO etapes (partie_id, ordre, module, temps_s, erreurs, reussie)
VALUES
  (1, 1, 'chauffage', 260, 1, 1),
  (1, 2, 'eclairage', 170, 0, 1),
  (1, 3, 'presence', 205, 1, 1),
  (1, 4, 'code', 300, 1, 0),
  (2, 1, 'chauffage', 240, 0, 1),
  (2, 2, 'eclairage', 190, 1, 1),
  (2, 3, 'presence', 230, 0, 1),
  (2, 4, 'code', 210, 0, 1),
  (2, 5, 'compteur', 230, 1, 1),
  (3, 1, 'chauffage', 310, 1, 1),
  (3, 2, 'eclairage', 250, 1, 1),
  (3, 3, 'presence', 640, 0, 0),
  (4, 1, 'chauffage', 200, 0, 1),
  (4, 2, 'eclairage', 150, 0, 1),
  (4, 3, 'presence', 180, 0, 1),
  (4, 4, 'code', 240, 1, 1),
  (4, 5, 'compteur', 170, 0, 1),
  (5, 1, 'chauffage', 130, 0, 1),
  (5, 2, 'eclairage', 110, 0, 1),
  (6, 1, 'chauffage', 150, 1, 1),
  (6, 2, 'eclairage', 160, 1, 1),
  (7, 1, 'chauffage', 280, 2, 1),
  (7, 2, 'eclairage', 120, 1, 0),
  (8, 1, 'chauffage', 180, 0, 1),
  (8, 2, 'eclairage', 140, 0, 1),
  (8, 3, 'presence', 170, 1, 1),
  (8, 4, 'code', 210, 0, 1),
  (8, 5, 'compteur', 150, 0, 1),
  (9, 1, 'chauffage', 220, 0, 1),
  (9, 2, 'eclairage', 200, 0, 1),
  (9, 3, 'presence', 260, 1, 1),
  (9, 4, 'code', 250, 1, 1),
  (9, 5, 'compteur', 190, 0, 1),
  (10, 1, 'chauffage', 120, 0, 1),
  (10, 2, 'eclairage', 95, 0, 1);

-- Les vraies parties commenceront apres les parties de demo
ALTER TABLE parties AUTO_INCREMENT = 100;
