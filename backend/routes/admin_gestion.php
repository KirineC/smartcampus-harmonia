<?php
// backend/routes/admin_gestion.php

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
        $stmtCours = $pdo->query("
            SELECT 
                c.id, c.code_cours, c.titre, c.type_cours, c.capacite_max, 
                c.jour_semaine, c.heure_debut, c.heure_fin, c.semestre, c.description,
                c.salle_id, c.enseignant_id, u.nom AS prof_nom, u.prenom AS prof_prenom 
            FROM cours c
            LEFT JOIN enseignants e ON c.enseignant_id = e.id          
            LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id        
            ORDER BY c.jour_semaine, c.heure_debut
        ");
        $listeCours = $stmtCours->fetchAll(PDO::FETCH_ASSOC);

        $stmtProfs = $pdo->query("SELECT e.id, u.nom, u.prenom FROM enseignants e JOIN utilisateurs u ON e.utilisateur_id = u.id ORDER BY u.nom");
        $listeProfs = $stmtProfs->fetchAll(PDO::FETCH_ASSOC);

        // C. On récupère TOUTES les infos de la salle, y compris les instruments !
        $stmtSalles = $pdo->query("SELECT id, nom_salle, batiment, capacite_maximale, instruments_presents FROM salles ORDER BY nom_salle");
        $listeSalles = $stmtSalles->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "cours" => $listeCours,
            "enseignants" => $listeProfs,
            "salles" => $listeSalles
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erreur de registre : " . $e->getMessage()]);
    }
    exit;
}

// ============================================================
// ✍️ ACTION 2 : OUVERTURE (POST) OU MODIFICATION D'UNE CHAIRE
// ============================================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // 🔄 CAS A : MODIFICATION D'UN COURS EXISTANT
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
            // 🔎 VERIFICATION CONFLITS ÉDITION : Nettoyée avec salle_id et enseignant_id
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

            // 💾 MISE À JOUR : Nettoyée avec enseignant_id et salle_id
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

    // ➕ CAS B : CRÉATION STANDARD D'UN COURS
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
        // 🔎 VERIFICATION CONFLITS CRÉATION : Nettoyée avec salle_id et enseignant_id
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

        // 💾 INSERTION : Nettoyée avec enseignant_id et salle_id
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
// 🗑️ ACTION 3 : CLÔTURE D'UNE CHAIRE (DELETE)
// ============================================================
if ($method === 'DELETE') {
    if (!isset($_GET['supprimer_cours'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Identifiant manquant."]);
        exit;
    }

    $cours_id = (int)$_GET['supprimer_cours'];

    try {
        $pdo->beginTransaction();

        $stmtInsc = $pdo->prepare("DELETE FROM inscriptions WHERE cours_id = :id");
        $stmtInsc->execute([':id' => $cours_id]);

        $stmtDelete = $pdo->prepare("DELETE FROM cours WHERE id = :id");
        $stmtDelete->execute([':id' => $cours_id]);

        $pdo->commit();
        echo json_encode(["success" => true, "message" => "Le cours a été supprimé."]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erreur de suppression : " . $e->getMessage()]);
    }
    exit;
}