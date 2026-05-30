-- ============================================================
-- HARMONIA - SCHEMA COMPLET (12 tables) - FINAL
-- ============================================================
-- Base : harmonia_conservatoire
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================
-- 1. UTILISATEURS (table mère)
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courriel VARCHAR(100) UNIQUE NOT NULL,
  mot_de_passe_chiffre VARCHAR(255) NOT NULL,
  `role` ENUM('etudiant','enseignant','admin') NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actif TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. INSTRUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS instruments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_instrument VARCHAR(100) UNIQUE NOT NULL,
  famille_instrument VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. ENSEIGNANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS enseignants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNIQUE NOT NULL,
  statut_titre VARCHAR(100),
  bureau VARCHAR(50),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. ETUDIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS etudiants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNIQUE NOT NULL,
  numero_etudiant VARCHAR(20) UNIQUE NOT NULL,
  cycle VARCHAR(50),
  instrument_principal_id INT,
  filiere VARCHAR(50),
  objectif_pratique_hebdomadaire INT DEFAULT 600,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (instrument_principal_id) REFERENCES instruments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. SALLES
-- ============================================================
CREATE TABLE IF NOT EXISTS salles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_salle VARCHAR(100) NOT NULL UNIQUE,
  batiment VARCHAR(50),
  capacite_maximale INT,
  type_salle VARCHAR(50),
  instruments_presents VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. COURS
-- ============================================================
CREATE TABLE IF NOT EXISTS cours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code_cours VARCHAR(20) UNIQUE NOT NULL,
  titre VARCHAR(150) NOT NULL,
  type_cours VARCHAR(50),
  capacite_max INT NOT NULL,
  enseignant_id INT NOT NULL,
  salle_id INT NOT NULL,
  jour_semaine INT,
  heure_debut TIME,
  heure_fin TIME,
  semestre VARCHAR(50),
  description TEXT,
  FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE RESTRICT,
  FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. INSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS inscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id INT NOT NULL,
  cours_id INT NOT NULL,
  statut_inscription VARCHAR(50) DEFAULT 'En attente',
  date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_inscription (etudiant_id, cours_id),
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inscription_id INT NOT NULL,
  valeur_note DECIMAL(4, 2) NOT NULL,
  type_evaluation VARCHAR(100),
  date_evaluation DATE NOT NULL,
  commentaires TEXT,
  membres_jury VARCHAR(255),
  est_valide BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. JOURNAL_PRATIQUE
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_pratique (
  id INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id INT NOT NULL,
  date_session DATE NOT NULL,
  duree_minutes INT NOT NULL,
  instrument_id INT NOT NULL,
  repertoire_travaille VARCHAR(255),
  notes TEXT,
  lieu VARCHAR(50),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (instrument_id) REFERENCES instruments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. RESERVATIONS_SALLES
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations_salles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id INT NOT NULL,
  salle_id INT NOT NULL,
  date_reservation DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  `usage` VARCHAR(50),
  `statut` VARCHAR(50) DEFAULT 'confirmee',
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. EVENEMENTS_CONCERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS evenements_concerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titre VARCHAR(150) NOT NULL,
  type_evenement VARCHAR(50),
  date_evenement DATE NOT NULL,
  heure_debut TIME,
  salle_id INT,
  max_participants INT,
  description TEXT,
  artistes_json VARCHAR(255),
  createur_id INT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE SET NULL,
  FOREIGN KEY (createur_id) REFERENCES enseignants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ASSIDUITES
-- ============================================================
CREATE TABLE IF NOT EXISTS assiduites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id INT NOT NULL,
  cours_id INT NOT NULL,
  date_seance DATE NOT NULL,
  `statut` VARCHAR(50) DEFAULT 'absent',
  date_verification TIMESTAMP,
  FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
  FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DONNEES DE TEST
-- ============================================================

-- Instruments (8)
INSERT INTO instruments (nom_instrument, famille_instrument) VALUES
('Piano', 'Clavier'),
('Violon', 'Cordes'),
('Violoncelle', 'Cordes'),
('Flûte', 'Vents'),
('Saxophone', 'Vents'),
('Trompette', 'Cuivres'),
('Contrebasse', 'Cordes'),
('Harpe', 'Cordes');

-- Salles (8)
INSERT INTO salles (nom_salle, batiment, capacite_maximale, type_salle) VALUES
('Salle Chopin', 'Bâtiment A', 30, 'Cours'),
('Salle Liszt', 'Bâtiment A', 30, 'Cours'),
('Salle Debussy', 'Bâtiment B', 40, 'Cours'),
('Studio MAO', 'Bâtiment B', 15, 'Studio'),
('Amphithéâtre', 'Bâtiment A', 200, 'Concert'),
('Salle répétition 1', 'Bâtiment C', 50, 'Répétition'),
('Salle répétition 2', 'Bâtiment C', 50, 'Répétition'),
('Salle orchestre', 'Bâtiment C', 80, 'Répétition');

-- Utilisateurs
INSERT INTO utilisateurs (courriel, mot_de_passe_chiffre, `role`, prenom, nom, actif) VALUES
('admin@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'admin', 'Admin', 'Harmonia', 1),
('prof@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'enseignant', 'Jean-Sébastien', 'Bach', 1),
('sophie@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'etudiant', 'Sophie', 'Martin', 1),
('thomas@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'etudiant', 'Thomas', 'Bernard', 1),
('emma@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'etudiant', 'Emma', 'Rousseau', 1),
('test@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'etudiant', 'Test', 'User', 1);

-- Enseignants
INSERT INTO enseignants (utilisateur_id, statut_titre, bureau) VALUES
(2, 'Professeur', 'Bureau 101');

-- Etudiants
INSERT INTO etudiants (utilisateur_id, numero_etudiant, cycle, instrument_principal_id, filiere) VALUES
(3, 'STU-2024-001', 'Licence', 1, 'Classique'),
(4, 'STU-2024-002', 'Licence', 2, 'Classique'),
(5, 'STU-2024-003', 'Master', 1, 'Jazz'),
(6, 'STU-2024-TEST', 'Licence', 1, 'Classique');

-- Cours (6)
INSERT INTO cours (code_cours, titre, type_cours, capacite_max, enseignant_id, salle_id, jour_semaine, heure_debut, heure_fin, semestre) VALUES
('PIA-101', 'Piano Débutant', 'Individuel', 1, 1, 1, 2, '10:00:00', '11:00:00', 'Automne 2026'),
('VIO-101', 'Violon Intermédiaire', 'Individuel', 1, 1, 1, 3, '14:00:00', '15:00:00', 'Automne 2026'),
('ORC-101', 'Orchestre Symphonique', 'Ensemble', 50, 1, 6, 1, '15:00:00', '18:00:00', 'Automne 2026'),
('SOL-101', 'Solfège Débutant', 'Collectif', 25, 1, 3, 4, '09:00:00', '10:00:00', 'Automne 2026'),
('HAR-101', 'Harmonie Avancée', 'Collectif', 20, 1, 3, 5, '14:00:00', '15:30:00', 'Automne 2026'),
('CHAMB-101', 'Musique de Chambre', 'Ensemble', 8, 1, 2, 2, '18:00:00', '19:30:00', 'Automne 2026');

-- Inscriptions
INSERT INTO inscriptions (etudiant_id, cours_id, statut_inscription) VALUES
(1, 1, 'Validée'),
(1, 3, 'En attente'),
(2, 2, 'Validée'),
(3, 1, 'Validée'),
(4, 1, 'En attente');

-- Journal pratique
INSERT INTO journal_pratique (etudiant_id, date_session, duree_minutes, instrument_id, repertoire_travaille) VALUES
(1, '2026-05-27', 120, 1, 'Concerto Rachmaninov n°2'),
(1, '2026-05-26', 90, 1, 'Gammes C majeur'),
(2, '2026-05-27', 60, 2, 'Bach Chaconne');

COMMIT;