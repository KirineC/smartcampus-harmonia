<?php
// backend/routes/admin_gestion.php

// 🎯 CONFIGURATION NETTE POUR LA DÉMO JURY
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 1. Sécurité : Vérification de l'accès Administrateur
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "error" => "Accès réservé aux secrétariats de l'Académie."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// 📁 ACTION 1 : RÉCUPÉRATION DES DONNÉES DU HUB (GET)
// ============================================================
if ($method === 'GET') {
    try {
        // A. On récupère la liste complète des cours
        $stmtCours = $pdo->query("
            SELECT 
                c.id, c.code_cours, c.titre, c.type_cours, c.capacite_max, 
                c.jour_semaine, c.heure_debut, c.heure_fin, c.semestre, c.description, c.salle_id, c.enseignant_id, u.nom AS prof_nom, u.prenom AS prof_prenom, c.statut
            FROM cours c
            LEFT JOIN enseignants e ON c.enseignant_id = e.id          
            LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id          
            ORDER BY c.jour_semaine, c.heure_debut
        ");
        $listeCours = $stmtCours->fetchAll(PDO::FETCH_ASSOC);

        // B. On récupère la liste complète des profs
        $stmtProfs = $pdo->query("SELECT e.id, u.nom, u.prenom FROM enseignants e JOIN utilisateurs u ON e.utilisateur_id = u.id ORDER BY u.nom");
        $listeProfs = $stmtProfs->fetchAll(PDO::FETCH_ASSOC);

        // C. On récupère TOUTES les infos de la salle
        $stmtSalles = $pdo->query("SELECT id, nom_salle, batiment, capacite_maximale, instruments_presents FROM salles ORDER BY nom_salle");
        $listeSalles = $stmtSalles->fetchAll(PDO::FETCH_ASSOC);

        // D. L'ANNUAIRE ÉTUDIANT COMPLET
        $stmtStudents = $pdo->query("
            SELECT 
                e.id, 
                e.numero_etudiant, 
                e.filiere, 
                e.instrument_majeur, 
                u.nom, 
                u.prenom, 
                u.courriel 
            FROM etudiants e 
            JOIN utilisateurs u ON e.utilisateur_id = u.id 
            ORDER BY u.nom
        ");
        $listeEtudiants = $stmtStudents->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "cours" => $listeCours,
            "enseignants" => $listeProfs,
            "salles" => $listeSalles,
            "etudiants" => $listeEtudiants 
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erreur de registre : " . $e->getMessage()]);
    }
    exit;
}

// ============================================================
// ✍️ ACTION 2 : ACTIONS D'ÉCRITURE ADMIN (POST)
// ============================================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // 👤 SOUS-ACTION A : CRÉATION D'UN COMPTE
    if (isset($data['action']) && $data['action'] === 'creer_utilisateur') {
        if (empty($data['email']) || empty($data['password']) || empty($data['role']) || empty($data['prenom']) || empty($data['nom'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Données d'identité incomplètes."]);
            exit;
        }

        $email = htmlspecialchars(trim($data['email']));
        $password = password_hash($data['password'], PASSWORD_BCRYPT);
        $role = htmlspecialchars($data['role']); 
        $prenom = htmlspecialchars(trim($data['prenom']));
        $nom = htmlspecialchars(trim($data['nom']));

        $stmtCheckEmail = $pdo->prepare("SELECT id FROM utilisateurs WHERE courriel = ?");
        $stmtCheckEmail->execute([$email]);
        if ($stmtCheckEmail->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(["success" => false, "error" => "Cette adresse courriel est déjà enregistrée à l'Académie."]);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmtUser = $pdo->prepare("
                INSERT INTO utilisateurs (courriel, mot_de_passe_chiffre, role, prenom, nom)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmtUser->execute([$email, $password, $role, $prenom, $nom]);
            $newUserId = $pdo->lastInsertId();

            if ($role === 'etudiant') {
                $filiere = htmlspecialchars($data['filiere'] ?? 'Classique');
                $instrument = htmlspecialchars($data['instrument_majeur'] ?? 'Piano');
                $numeroEtudiant = 'E2026-' . rand(1000, 9999);

                $stmtEtudiant = $pdo->prepare("
                    INSERT INTO etudiants (utilisateur_id, filiere, instrument_majeur, numero_etudiant)
                    VALUES (?, ?, ?, ?)
                ");
                $stmtEtudiant->execute([$newUserId, $filiere, $instrument, $numeroEtudiant]);

            } else if ($role === 'enseignant') {
                $stmtEnseignant = $pdo->prepare("
                    INSERT INTO enseignants (utilisateur_id)
                    VALUES (?)
                ");
                $stmtEnseignant->execute([$newUserId]);
            }

            $pdo->commit();
            echo json_encode(["success" => true, "message" => "Le compte de " . $prenom . " " . $nom . " a été inscrit au registre officiel."]);

        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Erreur lors de la génération du profil : " . $e->getMessage()]);
        }
        exit;
    }

    // 🔄 SOUS-ACTION B : MODIFICATION D'UN COURS EXISTANT
    if (isset($data['action']) && $data['action'] === 'modifier_cours') {
        if (empty($data['id']) || empty($data['code_cours']) || empty($data['titre']) || empty($data['salle_id']) || empty($data['enseignant_id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Données incomplètes pour la modification."]);
            exit;
        }

        $id = (int)$data['id'];
        $code = htmlspecialchars($data['code_cours']);
        $titre = htmlspecialchars($data['titre']);
        $type = htmlspecialchars($data['type_cours']);
        $capacite = (int)$data['capacite_max'];
        $enseignant_id = (int)$data['enseignant_id'];
        $salle_id = htmlspecialchars($data['salle_id']); 
        $jour = (int)$data['jour_semaine'];
        $debut = $data['heure_debut'];
        $fin = $data['heure_fin'];
        $semestre = (int)$data['semestre'];
        $description = htmlspecialchars($data['description'] ?? '');

        try {
            $sqlConflit = "
                SELECT titre FROM cours 
                WHERE jour_semaine = :jour 
                  AND (heure_debut < :fin AND heure_fin > :debut)
                  AND (salle_id = :salle_id OR enseignant_id = :enseignant_id)
                  AND id != :id
            ";
            $stmtCheck = $pdo->prepare($sqlConflit);
            $stmtCheck->execute([':jour' => $jour, ':debut' => $debut, ':fin' => $fin, ':salle_id' => $salle_id, ':enseignant_id' => $enseignant_id, ':id' => $id]);

            if ($stmtCheck->rowCount() > 0) {
                $conflit = $stmtCheck->fetch(PDO::FETCH_ASSOC);
                http_response_code(409);
                echo json_encode(["success" => false, "error" => "Conflit ! La salle ou l'enseignant est déjà pris par '{$conflit['titre']}'."]);
                exit;
            }

            $sqlUpdate = "
                UPDATE cours 
                SET code_cours = :code, titre = :titre, type_cours = :type, capacite_max = :capacite, 
                    enseignant_id = :enseignant_id, salle_id = :salle_id, jour_semaine = :jour, 
                    heure_debut = :debut, heure_fin = :fin, semestre = :semestre, description = :description
                WHERE id = :id
            ";
            $stmtUpdate = $pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([
                ':code' => $code, ':titre' => $titre, ':type' => $type, ':capacite' => $capacite,
                ':enseignant_id' => $enseignant_id, ':salle_id' => $salle_id, ':jour' => $jour,
                ':debut' => $debut, ':fin' => $fin, ':semestre' => $semestre, ':description' => $description, ':id' => $id
            ]);

            echo json_encode(["success" => true, "message" => "La chaire a été modifiée avec succès."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Erreur de mise à jour : " . $e->getMessage()]);
        }
        exit;
    }

    // ➕ SOUS-ACTION C : CRÉATION STANDARD D'UN COURS
    if (
        empty($data['code_cours']) || empty($data['titre']) || empty($data['type_cours']) ||
        empty($data['capacite_max']) || empty($data['enseignant_id']) || empty($data['salle_id']) ||
        empty($data['jour_semaine']) || empty($data['heure_debut']) || empty($data['heure_fin'])
    ) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Toutes les lignes doivent être renseignées."]);
        exit;
    }

    $code = htmlspecialchars($data['code_cours']);
    $titre = htmlspecialchars($data['titre']);
    $type = htmlspecialchars($data['type_cours']);
    $capacite = (int)$data['capacite_max'];
    $enseignant_id = (int)$data['enseignant_id'];
    $salle_id = htmlspecialchars($data['salle_id']); 
    $jour = (int)$data['jour_semaine'];
    $debut = $data['heure_debut'];
    $fin = $data['heure_fin'];
    $semestre = isset($data['semestre']) ? (int)$data['semestre'] : 1;
    $description = isset($data['description']) ? htmlspecialchars($data['description']) : '';

    try {
        $sqlConflit = "
            SELECT titre, code_cours FROM cours 
            WHERE jour_semaine = :jour 
              AND (heure_debut < :fin AND heure_fin > :debut)
              AND (salle_id = :salle_id OR enseignant_id = :enseignant_id)
        ";
        $stmtCheck = $pdo->prepare($sqlConflit);
        $stmtCheck->execute([':jour' => $jour, ':debut' => $debut, ':fin' => $fin, ':salle_id' => $salle_id, ':enseignant_id' => $enseignant_id]);

        if ($stmtCheck->rowCount() > 0) {
            $conflit = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            http_response_code(409);
            echo json_encode(["success" => false, "error" => "Conflit temporel ! La salle ou l'enseignant est déjà requis pour '{$conflit['titre']}'."]);
            exit;
        }

        $sqlInsert = "
            INSERT INTO cours (code_cours, titre, type_cours, capacite_max, enseignant_id, salle_id, jour_semaine, heure_debut, heure_fin, semestre, description)
            VALUES (:code, :titre, :type, :capacite, :enseignant_id, :salle_id, :jour, :debut, :fin, :semestre, :description)
        ";
        $stmtInsert = $pdo->prepare($sqlInsert);
        $stmtInsert->execute([
            ':code' => $code, ':titre' => $titre, ':type' => $type, ':capacite' => $capacite,
            ':enseignant_id' => $enseignant_id, ':salle_id' => $salle_id, ':jour' => $jour,
            ':debut' => $debut, ':fin' => $fin, ':semestre' => $semestre, ':description' => $description
        ]);

        echo json_encode(["success" => true, "message" => "Leçon ajoutée au registre avec succès."]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erreur d'écriture : " . $e->getMessage()]);
    }
    exit;
}

// ============================================================
// 🗑️ ACTION 3 : SUPPRESSIONS ET RÉVOCATIONS (DELETE)
// ============================================================
if ($method === 'DELETE') {
    
    // 👥 CAS A : SUPPRESSION DÉFINITIVE D'UN ÉTUDIANT (MÉTHODE NETTOYÉE ET DIRECTE)
    if (isset($_GET['supprimer_etudiant'])) {
        $etudiant_id = (int)$_GET['supprimer_etudiant'];

        try {
            $pdo->beginTransaction();

            // 1. Trouver l'id utilisateur central lié à cette fiche
            $stmtGetUid = $pdo->prepare("SELECT utilisateur_id FROM etudiants WHERE id = ?");
            $stmtGetUid->execute([$etudiant_id]);
            $utilisateur_id = $stmtGetUid->fetchColumn();

            if (!$utilisateur_id) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Étudiant introuvable."]);
                exit;
            }

            // 2. ⚡ DESACTIVATION DES CONTRAINTES DE CLES ETRANGERES
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

            // 3. 🎯 NETTOYAGE INTELLIGENT : Suppression par 'etudiant_id' si la colonne existe
            $tablesEtudiantId = ['notes', 'inscriptions', 'pratiques', 'pratique', 'seances_pratique', 'pratique_heures', 'heures_pratique'];
            foreach ($tablesEtudiantId as $table) {
                $checkTable = $pdo->query("SHOW TABLES LIKE '{$table}'")->rowCount();
                if ($checkTable > 0) {
                    // On essaye de nettoyer avec etudiant_id
                    try {
                        $stmt = $pdo->prepare("DELETE FROM {$table} WHERE etudiant_id = ?");
                        $stmt->execute([$etudiant_id]);
                    } catch (PDOException $ex) {
                        // Si la colonne 'etudiant_id' n'existe pas dans cette table, on essaye utilisateur_id
                        try {
                            $stmt = $pdo->prepare("DELETE FROM {$table} WHERE utilisateur_id = ?");
                            $stmt->execute([$utilisateur_id]);
                        } catch (PDOException $ex2) {
                            // On ignore si aucune colonne ne match pour éviter de bloquer
                        }
                    }
                }
            }

            // Nettoyage de la table notifications (basée sur utilisateur_id)
            $checkNotifs = $pdo->query("SHOW TABLES LIKE 'notifications'")->rowCount();
            if ($checkNotifs > 0) {
                $stmtNotif = $pdo->prepare("DELETE FROM notifications WHERE utilisateur_id = ?");
                $stmtNotif->execute([$utilisateur_id]);
            }

            // 4. Suppression des fiches principales
            $stmtDelEtudiant = $pdo->prepare("DELETE FROM etudiants WHERE id = ?");
            $stmtDelEtudiant->execute([$etudiant_id]);

            $stmtDelUser = $pdo->prepare("DELETE FROM utilisateurs WHERE id = ?");
            $stmtDelUser->execute([$utilisateur_id]);

            // 5. ⚡ RÉACTIVATION DES CLÉS ÉTRANGÈRES
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

            $pdo->commit();
            echo json_encode(["success" => true, "message" => "Le profil académique a été supprimé de la base de données."]);

        } catch (PDOException $e) {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Erreur fatale : " . $e->getMessage()]);
        }
        exit;
    }

    // 🎻 CAS B : RÉVOCATION / FERMETURE D'UNE CHAIRE DE COURS
    if (isset($_GET['supprimer_cours'])) {
        $cours_id = (int)$_GET['supprimer_cours'];

        try {
            $pdo->beginTransaction();

            $stmtCoursInfo = $pdo->prepare("SELECT c.titre, e.utilisateur_id AS prof_user_id FROM cours c LEFT JOIN enseignants e ON c.enseignant_id = e.id WHERE c.id = ?");
            $stmtCoursInfo->execute([$cours_id]);
            $coursInfo = $stmtCoursInfo->fetch(PDO::FETCH_ASSOC);
            
            $titreCours = $coursInfo ? $coursInfo['titre'] : "Cours inconnu";
            $profUserId = $coursInfo ? $coursInfo['prof_user_id'] : null;

            $stmtDelete = $pdo->prepare("UPDATE cours SET statut = 'Révoqué' WHERE id = :id");
            $stmtDelete->execute([':id' => $cours_id]);

            $stmtNotif = $pdo->prepare("INSERT INTO notifications (utilisateur_id, message) VALUES (?, ?)");

            if ($profUserId) {
                $msgProf = "🎵 Cher Maître, l'administration a clôturé votre chaire d'enseignement pour le cours '" . $titreCours . "'.";
                $stmtNotif->execute([$profUserId, $msgProf]);
            }

            $stmtEleves = $pdo->prepare("SELECT e.utilisateur_id FROM inscriptions i JOIN etudiants e ON i.etudiant_id = e.id WHERE i.cours_id = ?");
            $stmtEleves->execute([$cours_id]);
            $eleves = $stmtEleves->fetchAll(PDO::FETCH_ASSOC);

            foreach ($eleves as $eleve) {
                $msgEleve = "⚠️ Le cours auquel vous étiez inscrit ('" . $titreCours . "') a été révoqué par l'administration.";
                $stmtNotif->execute([$eleve['utilisateur_id'], $msgEleve]);
            }

            $pdo->commit();
            echo json_encode(["success" => true, "message" => "La chaire a été révoquée. L'enseignant et les élèves ont été notifiés."]);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Erreur lors de la révocation : " . $e->getMessage()]);
        }
        exit;
    }
}
?>