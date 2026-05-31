-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:8889
-- Généré le : dim. 31 mai 2026 à 02:09
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
  `description` text COLLATE utf8mb4_unicode_ci,
  `statut` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Actif',
  `instrument_requis` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cours`
--

INSERT INTO `cours` (`id`, `code_cours`, `titre`, `type_cours`, `capacite_max`, `enseignant_id`, `salle_id`, `jour_semaine`, `heure_debut`, `heure_fin`, `semestre`, `description`, `statut`, `instrument_requis`) VALUES
(1, 'PIA-101', 'Piano Débutant', 'Individuel', 1, 1, 1, 2, '10:00:00', '11:00:00', 'Automne 2026', NULL, 'Actif', 'Piano'),
(2, 'VIO-101', 'Violon Intermédiaire', 'Individuel', 1, 2, 1, 3, '14:00:00', '15:00:00', 'Automne 2026', NULL, 'Actif', 'Violon'),
(3, 'ORC-101', 'Orchestre Symphonique', 'Ensemble', 50, 1, 6, 1, '15:00:00', '18:00:00', 'Automne 2026', NULL, 'Actif', NULL),
(4, 'SOL-101', 'Solfège Débutant', 'Collectif', 25, 3, 3, 4, '09:00:00', '10:00:00', 'Automne 2026', NULL, 'Actif', NULL),
(5, 'HAR-101', 'Harmonie Avancée', 'Collectif', 20, 3, 3, 5, '14:00:00', '15:30:00', 'Automne 2026', NULL, 'Actif', NULL),
(6, 'CHAMB-101', 'Musique de Chambre', 'Ensemble', 8, 1, 2, 2, '18:00:00', '19:30:00', 'Automne 2026', NULL, 'Actif', NULL),
(7, 'FLU-101', 'Cours de Flûte Traversière', 'Individuel', 2, 1, 1, 3, '14:00:00', '15:00:00', 'Automne 2026', 'Cours d\'initiation à la flûte traversière pour débutants.', 'Actif', 'Flûte Traversière'),
(9, 'HRM-202', 'Haute Contre et Chant Baroque', 'Masterclass', 20, 2, 2, 4, '10:30:00', '12:00:00', '1', '', 'Révoqué', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `enseignants`
--

CREATE TABLE `enseignants` (
  `id` int NOT NULL,
  `utilisateur_id` int NOT NULL,
  `statut_titre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bureau` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `biographie` text COLLATE utf8mb4_unicode_ci,
  `specialite` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `enseignants`
--

INSERT INTO `enseignants` (`id`, `utilisateur_id`, `statut_titre`, `bureau`, `telephone`, `biographie`, `specialite`) VALUES
(1, 2, 'Professeur', 'Bureau 101', NULL, NULL, NULL),
(2, 7, 'Maître de Conférence', 'Bureau 204', NULL, NULL, NULL),
(3, 8, 'Professeur Émérite', 'Bureau 102', NULL, NULL, NULL);

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
  `objectif_pratique_hebdomadaire` int DEFAULT '600',
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `biographie` text COLLATE utf8mb4_unicode_ci,
  `instrument_majeur` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `etudiants`
--

INSERT INTO `etudiants` (`id`, `utilisateur_id`, `numero_etudiant`, `cycle`, `instrument_principal_id`, `filiere`, `objectif_pratique_hebdomadaire`, `telephone`, `biographie`, `instrument_majeur`) VALUES
(1, 3, 'STU-2024-001', 'Licence', 1, 'Classique', 600, NULL, '', 'Violon'),
(2, 4, 'STU-2024-002', 'Licence', 2, 'Classique', 600, NULL, NULL, 'Piano'),
(3, 5, 'STU-2024-003', 'Master', 1, 'Jazz', 600, NULL, NULL, 'Flûte Traversière'),
(4, 6, 'STU-2024-TEST', 'Licence', 1, 'Classique', 600, NULL, NULL, 'Piano');

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
(24, 1, 2, 'En attente', '2026-05-31 02:01:12'),
(25, 1, 3, 'Validée', '2026-05-31 02:01:17'),
(26, 1, 6, 'Validée', '2026-05-31 02:01:26'),
(27, 2, 1, 'En attente', '2026-05-31 02:01:51'),
(28, 2, 4, 'Validée', '2026-05-31 02:01:53'),
(29, 2, 6, 'Validée', '2026-05-31 02:02:00'),
(30, 3, 7, 'En attente', '2026-05-31 02:02:23'),
(31, 3, 5, 'Validée', '2026-05-31 02:02:25'),
(32, 3, 3, 'Validée', '2026-05-31 02:02:47'),
(33, 4, 5, 'En attente', '2026-05-31 02:03:15'),
(34, 4, 1, 'Validée', '2026-05-31 02:03:17');

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
(3, 2, '2026-05-27', 60, 2, 'Bach Chaconne', NULL, NULL, '2026-05-29 01:15:49'),
(4, 1, '2026-05-29', 30, 1, 'Nocturne Op 9 No 2 - Chopin', 'Retravailler le lyrisme de la main droite', NULL, '2026-05-29 23:58:04');

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
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `utilisateur_id` int NOT NULL,
  `message` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `lu` tinyint(1) DEFAULT '0',
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `utilisateur_id`, `message`, `lu`, `date_creation`) VALUES
(11, 7, '🎵 Cher Maître, l\'administration a clôturé votre chaire d\'enseignement pour le cours \'Haute Contre et Chant Baroque\'.', 1, '2026-05-30 23:25:05'),
(12, 3, '⚠️ Le cours auquel vous étiez inscrit (\'Haute Contre et Chant Baroque\') a été révoqué par l\'administration.', 1, '2026-05-30 23:25:05'),
(13, 3, '🎵 Une nouvelle note a été attribuée à votre partition de \'Haute Contre et Chant Baroque\'. Consultez votre livret !', 1, '2026-05-30 23:27:42'),
(14, 4, '🎵 Une nouvelle note a été attribuée à votre partition de \'Violon Intermédiaire\'. Consultez votre livret !', 1, '2026-05-30 23:27:42'),
(15, 2, '🎻 Nouvelle demande : Thomas Bernard souhaite s\'inscrire à votre cours de \'Musique de Chambre\'.', 1, '2026-05-31 00:29:49'),
(16, 7, '🎻 Nouvelle demande : Sophie Martin souhaite s\'inscrire à votre cours de \'Violon Intermédiaire\'.', 0, '2026-05-31 02:01:12'),
(17, 2, '🎻 Nouvelle demande : Sophie Martin souhaite s\'inscrire à votre cours de \'Orchestre Symphonique\'.', 0, '2026-05-31 02:01:17'),
(18, 2, '🎻 Nouvelle demande : Sophie Martin souhaite s\'inscrire à votre cours de \'Musique de Chambre\'.', 0, '2026-05-31 02:01:26'),
(19, 2, '🎻 Nouvelle demande : Thomas Bernard souhaite s\'inscrire à votre cours de \'Piano Débutant\'.', 0, '2026-05-31 02:01:51'),
(20, 8, '🎻 Nouvelle demande : Thomas Bernard souhaite s\'inscrire à votre cours de \'Solfège Débutant\'.', 1, '2026-05-31 02:01:53'),
(21, 2, '🎻 Nouvelle demande : Thomas Bernard souhaite s\'inscrire à votre cours de \'Musique de Chambre\'.', 0, '2026-05-31 02:02:00'),
(22, 2, '🎻 Nouvelle demande : Emma Rousseau souhaite s\'inscrire à votre cours de \'Cours de Flûte Traversière\'.', 0, '2026-05-31 02:02:23'),
(23, 8, '🎻 Nouvelle demande : Emma Rousseau souhaite s\'inscrire à votre cours de \'Harmonie Avancée\'.', 1, '2026-05-31 02:02:25'),
(24, 2, '🎻 Nouvelle demande : Emma Rousseau souhaite s\'inscrire à votre cours de \'Orchestre Symphonique\'.', 0, '2026-05-31 02:02:47'),
(25, 8, '🎻 Nouvelle demande : Test User souhaite s\'inscrire à votre cours de \'Harmonie Avancée\'.', 1, '2026-05-31 02:03:15'),
(26, 2, '🎻 Nouvelle demande : Test User souhaite s\'inscrire à votre cours de \'Piano Débutant\'.', 0, '2026-05-31 02:03:17');

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
(3, 'Salle Debussy', 'Bâtiment B', 40, 'Cours', 'Piano'),
(4, 'Studio MAO', 'Bâtiment B', 15, 'Studio', 'Piano, Flûte'),
(5, 'Amphithéâtre', 'Bâtiment A', 200, 'Concert', 'Piano à queue, Pupitres'),
(6, 'Salle répétition 1', 'Bâtiment C', 50, 'Répétition', 'Flûte'),
(7, 'Salle répétition 2', 'Bâtiment C', 50, 'Répétition', NULL),
(8, 'Salle orchestre', 'Bâtiment C', 80, 'Répétition', 'Piano à queue, Pupitres');

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
(1, 'admin@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'admin', 'Admin', 'Harmonia', '2026-05-29 01:15:49', 1),
(2, 'prof@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'enseignant', 'Jean-Sébastien', 'Bach', '2026-05-29 01:15:49', 1),
(3, 'sophie@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'etudiant', 'Sophie', 'Martin', '2026-05-29 01:15:49', 1),
(4, 'thomas@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'etudiant', 'Thomas', 'Bernard', '2026-05-29 01:15:49', 1),
(5, 'emma@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'etudiant', 'Emma', 'Rousseau', '2026-05-29 01:15:49', 1),
(6, 'test@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'etudiant', 'Test', 'User', '2026-05-29 01:15:49', 1),
(7, 'vivaldi@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'enseignant', 'Antonio', 'Vivaldi', '2026-05-30 10:14:04', 1),
(8, 'mozart@harmonia.edu', '$2y$10$4nlrxt0bFmNS5EH4d13NSOlQrlbfHoh.2MlaHSowrnhj5/Tem5sKe', 'enseignant', 'Wolfgang', 'Mozart', '2026-05-30 10:14:04', 1);

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
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `utilisateur_id` (`utilisateur_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT pour la table `enseignants`
--
ALTER TABLE `enseignants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT pour la table `instruments`
--
ALTER TABLE `instruments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `journal_pratique`
--
ALTER TABLE `journal_pratique`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

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
