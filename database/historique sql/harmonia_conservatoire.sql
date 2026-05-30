-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:8889
-- Généré le : ven. 29 mai 2026 à 01:45
-- Version du serveur : 8.0.44
-- Version de PHP : 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `harmonia_conservatoire`
--

-- --------------------------------------------------------

--
-- Structure de la table `assiduites`
--

CREATE TABLE `assiduites` (
  `id` int NOT NULL,
  `etudiant_id` int NOT NULL,
  `cours_id` int NOT NULL,
  `date_seance` date NOT NULL,
  `statut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'absent',
  `date_verification` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cours`
--

CREATE TABLE `cours` (
  `id` int NOT NULL,
  `code_cours` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_cours` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacite_max` int NOT NULL,
  `enseignant_id` int NOT NULL,
  `salle_id` int NOT NULL,
  `jour_semaine` int DEFAULT NULL,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `semestre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cours`
--

INSERT INTO `cours` (`id`, `code_cours`, `titre`, `type_cours`, `capacite_max`, `enseignant_id`, `salle_id`, `jour_semaine`, `heure_debut`, `heure_fin`, `semestre`, `description`) VALUES
(1, 'PIA-101', 'Piano Débutant', 'Individuel', 1, 1, 1, 2, '10:00:00', '11:00:00', 'Automne 2026', NULL),
(2, 'VIO-101', 'Violon Intermédiaire', 'Individuel', 1, 1, 1, 3, '14:00:00', '15:00:00', 'Automne 2026', NULL),
(3, 'ORC-101', 'Orchestre Symphonique', 'Ensemble', 50, 1, 6, 1, '15:00:00', '18:00:00', 'Automne 2026', NULL),
(4, 'SOL-101', 'Solfège Débutant', 'Collectif', 25, 1, 3, 4, '09:00:00', '10:00:00', 'Automne 2026', NULL),
(5, 'HAR-101', 'Harmonie Avancée', 'Collectif', 20, 1, 3, 5, '14:00:00', '15:30:00', 'Automne 2026', NULL),
(6, 'CHAMB-101', 'Musique de Chambre', 'Ensemble', 8, 1, 2, 2, '18:00:00', '19:30:00', 'Automne 2026', NULL),
(7, 'FLU-101', 'Cours de Flûte Traversière', 'Individuel', 2, 1, 1, 3, '14:00:00', '15:00:00', 'Automne 2026', 'Cours d\'initiation à la flûte traversière pour débutants.');

-- --------------------------------------------------------

--
-- Structure de la table `enseignants`
--

CREATE TABLE `enseignants` (
  `id` int NOT NULL,
  `utilisateur_id` int NOT NULL,
  `statut_titre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bureau` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `enseignants`
--

INSERT INTO `enseignants` (`id`, `utilisateur_id`, `statut_titre`, `bureau`) VALUES
(1, 2, 'Professeur', 'Bureau 101');

-- --------------------------------------------------------

--
-- Structure de la table `etudiants`
--

CREATE TABLE `etudiants` (
  `id` int NOT NULL,
  `utilisateur_id` int NOT NULL,
  `numero_etudiant` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instrument_principal_id` int DEFAULT NULL,
  `filiere` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `objectif_pratique_hebdomadaire` int DEFAULT '600'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `etudiants`
--

INSERT INTO `etudiants` (`id`, `utilisateur_id`, `numero_etudiant`, `cycle`, `instrument_principal_id`, `filiere`, `objectif_pratique_hebdomadaire`) VALUES
(1, 3, 'STU-2024-001', 'Licence', 1, 'Classique', 600),
(2, 4, 'STU-2024-002', 'Licence', 2, 'Classique', 600),
(3, 5, 'STU-2024-003', 'Master', 1, 'Jazz', 600),
(4, 6, 'STU-2024-TEST', 'Licence', 1, 'Classique', 600);

-- --------------------------------------------------------

--
-- Structure de la table `evenements_concerts`
--

CREATE TABLE `evenements_concerts` (
  `id` int NOT NULL,
  `titre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_evenement` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_evenement` date NOT NULL,
  `heure_debut` time DEFAULT NULL,
  `salle_id` int DEFAULT NULL,
  `max_participants` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `artistes_json` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createur_id` int DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inscriptions`
--

CREATE TABLE `inscriptions` (
  `id` int NOT NULL,
  `etudiant_id` int NOT NULL,
  `cours_id` int NOT NULL,
  `statut_inscription` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'En attente',
  `date_inscription` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `inscriptions`
--

INSERT INTO `inscriptions` (`id`, `etudiant_id`, `cours_id`, `statut_inscription`, `date_inscription`) VALUES
(1, 1, 1, 'Validée', '2026-05-29 01:15:49'),
(2, 1, 3, 'En attente', '2026-05-29 01:15:49'),
(3, 2, 2, 'Validée', '2026-05-29 01:15:49'),
(4, 3, 1, 'Validée', '2026-05-29 01:15:49'),
(5, 4, 1, 'En attente', '2026-05-29 01:15:49');

-- --------------------------------------------------------

--
-- Structure de la table `instruments`
--

CREATE TABLE `instruments` (
  `id` int NOT NULL,
  `nom_instrument` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `famille_instrument` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `instruments`
--

INSERT INTO `instruments` (`id`, `nom_instrument`, `famille_instrument`) VALUES
(1, 'Piano', 'Clavier'),
(2, 'Violon', 'Cordes'),
(3, 'Violoncelle', 'Cordes'),
(4, 'Flûte', 'Vents'),
(5, 'Saxophone', 'Vents'),
(6, 'Trompette', 'Cuivres'),
(7, 'Contrebasse', 'Cordes'),
(8, 'Harpe', 'Cordes');

-- --------------------------------------------------------

--
-- Structure de la table `journal_pratique`
--

CREATE TABLE `journal_pratique` (
  `id` int NOT NULL,
  `etudiant_id` int NOT NULL,
  `date_session` date NOT NULL,
  `duree_minutes` int NOT NULL,
  `instrument_id` int NOT NULL,
  `repertoire_travaille` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `lieu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `journal_pratique`
--

INSERT INTO `journal_pratique` (`id`, `etudiant_id`, `date_session`, `duree_minutes`, `instrument_id`, `repertoire_travaille`, `notes`, `lieu`, `date_creation`) VALUES
(1, 1, '2026-05-27', 120, 1, 'Concerto Rachmaninov n°2', NULL, NULL, '2026-05-29 01:15:49'),
(2, 1, '2026-05-26', 90, 1, 'Gammes C majeur', NULL, NULL, '2026-05-29 01:15:49'),
(3, 2, '2026-05-27', 60, 2, 'Bach Chaconne', NULL, NULL, '2026-05-29 01:15:49');

-- --------------------------------------------------------

--
-- Structure de la table `notes`
--

CREATE TABLE `notes` (
  `id` int NOT NULL,
  `inscription_id` int NOT NULL,
  `valeur_note` decimal(4,2) NOT NULL,
  `type_evaluation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_evaluation` date NOT NULL,
  `commentaires` text COLLATE utf8mb4_unicode_ci,
  `membres_jury` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `est_valide` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reservations_salles`
--

CREATE TABLE `reservations_salles` (
  `id` int NOT NULL,
  `etudiant_id` int NOT NULL,
  `salle_id` int NOT NULL,
  `date_reservation` date NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `usage` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'confirmee'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `salles`
--

CREATE TABLE `salles` (
  `id` int NOT NULL,
  `nom_salle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batiment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacite_maximale` int DEFAULT NULL,
  `type_salle` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instruments_presents` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `salles`
--

INSERT INTO `salles` (`id`, `nom_salle`, `batiment`, `capacite_maximale`, `type_salle`, `instruments_presents`) VALUES
(1, 'Salle Chopin', 'Bâtiment A', 30, 'Cours', NULL),
(2, 'Salle Liszt', 'Bâtiment A', 30, 'Cours', NULL),
(3, 'Salle Debussy', 'Bâtiment B', 40, 'Cours', NULL),
(4, 'Studio MAO', 'Bâtiment B', 15, 'Studio', NULL),
(5, 'Amphithéâtre', 'Bâtiment A', 200, 'Concert', NULL),
(6, 'Salle répétition 1', 'Bâtiment C', 50, 'Répétition', NULL),
(7, 'Salle répétition 2', 'Bâtiment C', 50, 'Répétition', NULL),
(8, 'Salle orchestre', 'Bâtiment C', 80, 'Répétition', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` int NOT NULL,
  `courriel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe_chiffre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('etudiant','enseignant','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actif` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `courriel`, `mot_de_passe_chiffre`, `role`, `prenom`, `nom`, `date_creation`, `actif`) VALUES
(1, 'admin@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'admin', 'Admin', 'Harmonia', '2026-05-29 01:15:49', 1),
(2, 'prof@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'enseignant', 'Jean-Sébastien', 'Bach', '2026-05-29 01:15:49', 1),
(3, 'sophie@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'etudiant', 'Sophie', 'Martin', '2026-05-29 01:15:49', 1),
(4, 'thomas@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'etudiant', 'Thomas', 'Bernard', '2026-05-29 01:15:49', 1),
(5, 'emma@harmonia.edu', '$2y$10$N9qo8uLOickgx2ZMRZoMye3ePx5RZ.oXSxc0i4EEsKAd7nKEOL.Ja', 'etudiant', 'Emma', 'Rousseau', '2026-05-29 01:15:49', 1),
(6, 'test@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'etudiant', 'Test', 'User', '2026-05-29 01:15:49', 1);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `assiduites`
--
ALTER TABLE `assiduites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `etudiant_id` (`etudiant_id`),
  ADD KEY `cours_id` (`cours_id`);

--
-- Index pour la table `cours`
--
ALTER TABLE `cours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_cours` (`code_cours`),
  ADD KEY `enseignant_id` (`enseignant_id`),
  ADD KEY `salle_id` (`salle_id`);

--
-- Index pour la table `enseignants`
--
ALTER TABLE `enseignants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `utilisateur_id` (`utilisateur_id`);

--
-- Index pour la table `etudiants`
--
ALTER TABLE `etudiants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `utilisateur_id` (`utilisateur_id`),
  ADD UNIQUE KEY `numero_etudiant` (`numero_etudiant`),
  ADD KEY `instrument_principal_id` (`instrument_principal_id`);

--
-- Index pour la table `evenements_concerts`
--
ALTER TABLE `evenements_concerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `salle_id` (`salle_id`),
  ADD KEY `createur_id` (`createur_id`);

--
-- Index pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_inscription` (`etudiant_id`,`cours_id`),
  ADD KEY `cours_id` (`cours_id`);

--
-- Index pour la table `instruments`
--
ALTER TABLE `instruments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom_instrument` (`nom_instrument`);

--
-- Index pour la table `journal_pratique`
--
ALTER TABLE `journal_pratique`
  ADD PRIMARY KEY (`id`),
  ADD KEY `etudiant_id` (`etudiant_id`),
  ADD KEY `instrument_id` (`instrument_id`);

--
-- Index pour la table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inscription_id` (`inscription_id`);

--
-- Index pour la table `reservations_salles`
--
ALTER TABLE `reservations_salles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `etudiant_id` (`etudiant_id`),
  ADD KEY `salle_id` (`salle_id`);

--
-- Index pour la table `salles`
--
ALTER TABLE `salles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom_salle` (`nom_salle`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `courriel` (`courriel`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `assiduites`
--
ALTER TABLE `assiduites`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `cours`
--
ALTER TABLE `cours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `enseignants`
--
ALTER TABLE `enseignants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `etudiants`
--
ALTER TABLE `etudiants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `evenements_concerts`
--
ALTER TABLE `evenements_concerts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `instruments`
--
ALTER TABLE `instruments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `journal_pratique`
--
ALTER TABLE `journal_pratique`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reservations_salles`
--
ALTER TABLE `reservations_salles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `salles`
--
ALTER TABLE `salles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `assiduites`
--
ALTER TABLE `assiduites`
  ADD CONSTRAINT `assiduites_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assiduites_ibfk_2` FOREIGN KEY (`cours_id`) REFERENCES `cours` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `cours`
--
ALTER TABLE `cours`
  ADD CONSTRAINT `cours_ibfk_1` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `cours_ibfk_2` FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`) ON DELETE RESTRICT;

--
-- Contraintes pour la table `enseignants`
--
ALTER TABLE `enseignants`
  ADD CONSTRAINT `enseignants_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `etudiants`
--
ALTER TABLE `etudiants`
  ADD CONSTRAINT `etudiants_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `etudiants_ibfk_2` FOREIGN KEY (`instrument_principal_id`) REFERENCES `instruments` (`id`);

--
-- Contraintes pour la table `evenements_concerts`
--
ALTER TABLE `evenements_concerts`
  ADD CONSTRAINT `evenements_concerts_ibfk_1` FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `evenements_concerts_ibfk_2` FOREIGN KEY (`createur_id`) REFERENCES `enseignants` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  ADD CONSTRAINT `inscriptions_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscriptions_ibfk_2` FOREIGN KEY (`cours_id`) REFERENCES `cours` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `journal_pratique`
--
ALTER TABLE `journal_pratique`
  ADD CONSTRAINT `journal_pratique_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_pratique_ibfk_2` FOREIGN KEY (`instrument_id`) REFERENCES `instruments` (`id`);

--
-- Contraintes pour la table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`inscription_id`) REFERENCES `inscriptions` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservations_salles`
--
ALTER TABLE `reservations_salles`
  ADD CONSTRAINT `reservations_salles_ibfk_1` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_salles_ibfk_2` FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
