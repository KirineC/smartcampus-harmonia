<?php
require_once __DIR__ . '/../models/Inscription.php';

// Sécurité globale : il faut être connecté pour toucher aux inscriptions
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit();
}

$inscriptionModel = new Inscription($pdo);

// 📥 CAS 1 : L'étudiant veut voir ses inscriptions (GET)
if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT i.*, c.titre, c.jour_semaine, c.heure_debut, c.heure_fin
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        JOIN etudiants e ON i.etudiant_id = e.id
        WHERE e.utilisateur_id = ?
        ORDER BY c.jour_semaine
    ");
    $stmt->execute([$_SESSION['user_id']]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit();
}

// 📤 CAS 2 : L'étudiant veut s'inscrire à un cours (POST)
if ($method === 'POST') {
    // Recherche du vrai ID étudiant
    $stmt = $pdo->prepare("SELECT id FROM etudiants WHERE utilisateur_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $etudiant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$etudiant) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Cet utilisateur n\'est pas un étudiant.']);
        exit();
    }

    $etudiant_id = $etudiant['id'];
    $cours_id = $data['cours_id'] ?? null;

    if (!$cours_id) {
        echo json_encode(['success' => false, 'error' => 'Données incomplètes']);
        exit();
    }

    $resultat = $inscriptionModel->inscrire($etudiant_id, $cours_id);
    echo json_encode($resultat);
    exit();
}
?>