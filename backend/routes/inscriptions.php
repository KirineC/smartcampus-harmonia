<?php
require_once __DIR__ . '/../models/Inscription.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Non autorisé'
    ]);
    exit();
}

$inscriptionModel = new Inscription($pdo);

function getEtudiantConnecte($pdo) {
    $stmt = $pdo->prepare("
        SELECT id
        FROM etudiants
        WHERE utilisateur_id = ?
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function annulerDemandeEnAttente($pdo, $etudiant_id, $cours_id) {
    $stmtCheck = $pdo->prepare("
        SELECT id, statut_inscription
        FROM inscriptions
        WHERE etudiant_id = ?
        AND cours_id = ?
        LIMIT 1
    ");

    $stmtCheck->execute([$etudiant_id, $cours_id]);
    $inscription = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$inscription) {
        return [
            'success' => false,
            'error' => 'Aucune demande trouvée pour ce cours.'
        ];
    }

    $statut = trim($inscription['statut_inscription']);

    if ($statut === 'Validée') {
        return [
            'success' => false,
            'error' => 'Une inscription déjà acceptée ne peut pas être annulée depuis le catalogue.'
        ];
    }

    if ($statut !== 'En attente') {
        return [
            'success' => false,
            'error' => 'Cette inscription ne peut plus être annulée.'
        ];
    }

    $stmtDelete = $pdo->prepare("
        DELETE FROM inscriptions
        WHERE id = ?
        LIMIT 1
    ");

    $stmtDelete->execute([$inscription['id']]);

    return [
        'success' => true,
        'message' => 'Demande d’inscription annulée avec succès.'
    ];
}

// ============================================================
// GET : consulter les inscriptions de l'étudiant
// ============================================================
if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT
            i.*,
            c.titre,
            c.type_cours,
            c.semestre,
            c.jour_semaine,
            c.heure_debut,
            c.heure_fin,
            s.nom_salle,
            c.statut AS cours_statut
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        LEFT JOIN salles s ON c.salle_id = s.id
        JOIN etudiants e ON i.etudiant_id = e.id
        WHERE e.utilisateur_id = ?
        ORDER BY c.jour_semaine, c.heure_debut
    ");

    $stmt->execute([$_SESSION['user_id']]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit();
}

// ============================================================
// POST : inscription ou annulation
// ============================================================
if ($method === 'POST') {
    $etudiant = getEtudiantConnecte($pdo);

    if (!$etudiant) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Cet utilisateur n\'est pas un étudiant.'
        ]);
        exit();
    }

    $etudiant_id = $etudiant['id'];
    $cours_id = $data['cours_id'] ?? null;
    $action = $data['action'] ?? null;

    if (!$cours_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Données incomplètes : cours_id manquant.'
        ]);
        exit();
    }

    if ($action === 'annuler_inscription') {
        echo json_encode(annulerDemandeEnAttente($pdo, $etudiant_id, $cours_id));
        exit();
    }

    $resultat = $inscriptionModel->inscrire($etudiant_id, $cours_id);

    if ($resultat && isset($resultat['success']) && $resultat['success'] === true) {
        try {
            $stmtInfos = $pdo->prepare("
                SELECT
                    c.titre AS nom_cours,
                    ens.utilisateur_id AS prof_user_id,
                    u.nom AS eleve_nom,
                    u.prenom AS eleve_prenom
                FROM cours c
                LEFT JOIN enseignants ens ON c.enseignant_id = ens.id
                CROSS JOIN utilisateurs u
                WHERE c.id = ?
                AND u.id = ?
                LIMIT 1
            ");

            $stmtInfos->execute([$cours_id, $_SESSION['user_id']]);
            $infos = $stmtInfos->fetch(PDO::FETCH_ASSOC);

            if ($infos && !empty($infos['prof_user_id'])) {
                $nomEleve = $infos['eleve_prenom'] . " " . $infos['eleve_nom'];
                $msgProf = "🎻 Nouvelle demande : " . $nomEleve . " souhaite s'inscrire à votre cours de '" . $infos['nom_cours'] . "'.";

                $stmtNotifProf = $pdo->prepare("
                    INSERT INTO notifications (utilisateur_id, message, lu)
                    VALUES (?, ?, 0)
                ");

                $stmtNotifProf->execute([$infos['prof_user_id'], $msgProf]);
            }
        } catch (PDOException $e) {
            error_log("Erreur lors de l'envoi de la notification enseignant : " . $e->getMessage());
        }
    }

    echo json_encode($resultat);
    exit();
}

// ============================================================
// DELETE : annulation de secours
// ============================================================
if ($method === 'DELETE') {
    $etudiant = getEtudiantConnecte($pdo);

    if (!$etudiant) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Cet utilisateur n\'est pas un étudiant.'
        ]);
        exit();
    }

    $cours_id = $data['cours_id'] ?? $_GET['cours_id'] ?? null;

    if (!$cours_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Données incomplètes.'
        ]);
        exit();
    }

    echo json_encode(annulerDemandeEnAttente($pdo, $etudiant['id'], $cours_id));
    exit();
}

http_response_code(405);
echo json_encode([
    'success' => false,
    'error' => 'Méthode non autorisée.'
]);
?>