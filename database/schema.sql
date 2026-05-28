-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : jeu. 28 mai 2026 à 15:24
-- Version du serveur : 8.4.7
-- Version de PHP : 8.3.28

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
-- Structure de la table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courriel` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe_chiffre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('etudiant','enseignant','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actif` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `courriel` (`courriel`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `courriel`, `mot_de_passe_chiffre`, `role`, `prenom`, `nom`, `date_creation`, `actif`) VALUES
(1, 'admin@harmonia.edu', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'admin', 'Admin', 'Harmonia', '2026-05-28 10:03:52', 1),
(2, 'martin.dupont@harmonia.edu', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'enseignant', 'Martin', 'Dupont', '2026-05-28 10:03:52', 1),
(3, 'sophie.martin@harmonia.edu', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'etudiant', 'Sophie', 'Martin', '2026-05-28 10:03:52', 1),
(4, 'thomas.bernard@harmonia.edu', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'etudiant', 'Thomas', 'Bernard', '2026-05-28 10:03:52', 1),
(5, 'emma.rousseau@harmonia.edu', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'etudiant', 'Emma', 'Rousseau', '2026-05-28 10:03:52', 1);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
