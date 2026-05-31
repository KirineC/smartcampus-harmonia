<?php
require_once __DIR__ . '/../models/Inscription.php';

// Sécurité globale : il faut être connecté pour toucher aux inscriptions
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non autorisé']);
    exit();
}

$inscriptionModel = new Inscription($pdo);

// Fonction utilitaire : retrouver l'étudiant connecté
function getEtudiantConnecte($pdo) {
    $stmt = $pdo->prepare("SELECT id FROM etudiants WHERE utilisateur_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// ============================================================
// CAS 1 : L'étudiant veut voir ses inscriptions (GET)
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
// CAS 2 : POST = inscription OU annulation (selon l'action)
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
    $cours_id    = $data['cours_id'] ?? null;
    $action      = $data['action']   ?? null;

    if (!$cours_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Données incomplètes (cours_id manquant).'
        ]);
        exit();
    }

    // ----------------------------------------
    // BRANCHE A : annulation explicite
    // ----------------------------------------
    if ($action === 'annuler_inscription') {
        $stmt = $pdo->prepare("
            DELETE FROM inscriptions
            WHERE etudiant_id = ?
              AND cours_id    = ?
        ");
        $stmt->execute([$etudiant_id, $cours_id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Inscription annulée avec succès.'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error'   => 'Aucune inscription trouvée pour ce cours.'
            ]);
        }
        exit();
    }

    // ----------------------------------------
    // BRANCHE B : inscription normale
    // ----------------------------------------
    $resultat = $inscriptionModel->inscrire($etudiant_id, $cours_id);

    // 🔔 ON ENVOIE LA NOTIFICATION SI L'INSCRIPTION S'EST BIEN PASSÉE EN BDD
    if ($resultat && isset($resultat['success']) && $resultat['success'] === true) {
        try {
            // 1. Récupération des données textuelles pour le message
            $stmtInfos = $pdo->prepare("
                SELECT c.titre AS nom_cours, e.utilisateur_id AS prof_user_id, u.nom AS eleve_nom, u.prenom AS eleve_prenom
                FROM cours c
                LEFT JOIN enseignants e ON c.enseignant_id = e.id
                CROSS JOIN utilisateurs u 
                WHERE c.id = ? AND u.id = ?
            ");
            $stmtInfos->execute([$cours_id, $_SESSION['user_id']]);
            $infos = $stmtInfos->fetch(PDO::FETCH_ASSOC);

            if ($infos && !empty($infos['prof_user_id'])) {
                $nomEleve = $infos['eleve_prenom'] . " " . $infos['eleve_nom'];
                $msgProf = "🎻 Nouvelle demande : " . $nomEleve . " souhaite s'inscrire à votre cours de '" . $infos['nom_cours'] . "'.";

                // 2. Insertion de la notification pour le professeur concerné
                $stmtNotifProf = $pdo->prepare("INSERT INTO notifications (utilisateur_id, message, lu) VALUES (?, ?, 0)");
                $stmtNotifProf->execute([$infos['prof_user_id'], $msgProf]);
            }
        } catch (PDOException $e) {
            // Sécurité : Un échec de notification ne doit pas bloquer la réussite de l'inscription pour l'élève
            error_log("Erreur lors de l'envoi de la notification enseignant : " . $e->getMessage());
        }
    }

    // Réponse finale envoyée à React
    echo json_encode($resultat);
    exit();
}

// ============================================================
// CAS 3 : Annulation via DELETE (gardée en secours)
// ============================================================
if ($method === 'DELETE') {
    $etudiant = getEtudiantConnecte($pdo);

    if (!$etudiant) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error'   => 'Cet utilisateur n\'est pas un étudiant.'
        ]);
        exit();
    }

    $etudiant_id = $etudiant['id'];
    $cours_id    = $data['cours_id'] ?? null;

    if (!$cours_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Données incomplètes.'
        ]);
        exit();
    }

    $stmt = $pdo->prepare("
        DELETE FROM inscriptions
        WHERE etudiant_id = ?
          AND cours_id    = ?
    ");
    $stmt->execute([$etudiant_id, $cours_id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Inscription annulée avec succès.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error'   => 'Aucune inscription trouvée pour ce cours.'
        ]);
    }
    exit();
}

// Si la méthode HTTP n'est pas gérée
http_response_code(405);
echo json_encode([
    'success' => false,
    'error'   => 'Méthode non autorisée.'
]);
?>