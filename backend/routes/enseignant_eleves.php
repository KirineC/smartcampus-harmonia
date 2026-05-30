<?php
// Sécurité : il faut être connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Non autorisé'
    ]);
    exit();
}

// ============================================================
// CAS 1 : l'enseignant récupère les élèves et les demandes
// ============================================================
if ($method === 'GET') {
    $prof_utilisateur_id = $_GET['liste_eleves_prof'] ?? null;

    if (!$prof_utilisateur_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Identifiant enseignant manquant.'
        ]);
        exit();
    }

    // Sécurité : un professeur ne peut consulter que ses propres données
    if ((int)$prof_utilisateur_id !== (int)$_SESSION['user_id']) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Accès interdit aux données d’un autre enseignant.'
        ]);
        exit();
    }

    try {
        // 📊 REQUÊTE AUGMENTÉE : Ajout de capacite_max et du sous-SELECT pour compter les places
        $stmt = $pdo->prepare("
            SELECT 
                i.id AS inscription_id,
                i.statut_inscription AS statut,

                e.id AS etudiant_id,
                u_eleve.nom AS nom,
                u_eleve.prenom AS prenom,
                u_eleve.courriel AS courriel,

                c.id AS cours_id,
                c.titre AS cours,
                c.code_cours,
                c.type_cours,
                c.jour_semaine,
                c.heure_debut,
                c.heure_fin,
                c.capacite_max,
                (SELECT COUNT(*) FROM inscriptions WHERE cours_id = i.cours_id AND statut_inscription = 'Validée') AS inscrits_actifs,

                n.valeur_note AS note
            FROM inscriptions i
            JOIN etudiants e ON i.etudiant_id = e.id
            JOIN utilisateurs u_eleve ON e.utilisateur_id = u_eleve.id
            JOIN cours c ON i.cours_id = c.id
            JOIN enseignants prof ON c.enseignant_id = prof.id
            LEFT JOIN notes n ON n.inscription_id = i.id
            WHERE prof.utilisateur_id = ?
            ORDER BY 
                CASE 
                    WHEN i.statut_inscription = 'En attente' THEN 0
                    WHEN i.statut_inscription = 'Validée' THEN 1
                    ELSE 2
                END,
                c.titre,
                u_eleve.nom,
                u_eleve.prenom
        ");

        $stmt->execute([$prof_utilisateur_id]);
        $listeEleves = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'etudiants' => $listeEleves
        ]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Erreur de base de données : ' . $e->getMessage()
        ]);
        exit();
    }
}

// ============================================================
// CAS 2 : l'enseignant accepte ou refuse une demande
// ============================================================
if ($method === 'POST') {
    $action = $data['action'] ?? null;
    $inscription_id = $data['inscription_id'] ?? null;

    if (!$action || !$inscription_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Données incomplètes.'
        ]);
        exit();
    }

    if (!in_array($action, ['accepter_inscription', 'refuser_inscription'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Action inconnue.'
        ]);
        exit();
    }

    try {
        // Vérifier que cette demande concerne bien un cours de l'enseignant connecté
        $stmt = $pdo->prepare("
            SELECT 
                i.id,
                i.cours_id,
                i.statut_inscription,
                c.capacite_max
            FROM inscriptions i
            JOIN cours c ON i.cours_id = c.id
            JOIN enseignants prof ON c.enseignant_id = prof.id
            WHERE i.id = ?
            AND prof.utilisateur_id = ?
        ");

        $stmt->execute([$inscription_id, $_SESSION['user_id']]);
        $inscription = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$inscription) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Cette demande ne concerne pas vos cours.'
            ]);
            exit();
        }

        // Accepter la demande
        if ($action === 'accepter_inscription') {
            // Vérifier la capacité uniquement sur les inscriptions validées
            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM inscriptions
                WHERE cours_id = ?
                AND statut_inscription = 'Validée'
            ");
            $stmt->execute([$inscription['cours_id']]);
            $placesOccupees = (int)$stmt->fetchColumn();

            if ($placesOccupees >= (int)$inscription['capacite_max']) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Capacité maximale atteinte pour ce cours.'
                ]);
                exit();
            }

            $stmt = $pdo->prepare("
                UPDATE inscriptions
                SET statut_inscription = 'Validée'
                WHERE id = ?
            ");
            $stmt->execute([$inscription_id]);

            echo json_encode([
                'success' => true,
                'message' => 'Inscription validée.'
            ]);
            exit();
        }

        // Refuser la demande : on garde une trace en statut Refusée
        if ($action === 'refuser_inscription') {
            $stmt = $pdo->prepare("
                UPDATE inscriptions
                SET statut_inscription = 'Refusée'
                WHERE id = ?
            ");
            $stmt->execute([$inscription_id]);

            echo json_encode([
                'success' => true,
                'message' => 'Demande refusée.'
            ]);
            exit();
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Erreur de base de données : ' . $e->getMessage()
        ]);
        exit();
    }
}

http_response_code(405);
echo json_encode([
    'success' => false,
    'error' => 'Méthode non autorisée.'
]);
?>