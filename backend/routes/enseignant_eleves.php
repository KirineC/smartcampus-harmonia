<?php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
    exit;
}

$prof_utilisateur_id = $_GET['liste_eleves_prof'] ?? null;

if (!$prof_utilisateur_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Identifiant enseignant manquant.']);
    exit;
}

try {
    // Requête ajustée selon la structure exacte de ton dump SQL
    $stmt = $pdo->prepare("
        SELECT 
            u_eleve.id AS etudiant_id,
            u_eleve.nom,
            u_eleve.prenom,
            c.id AS cours_id,
            c.titre AS cours,
            i.id AS inscription_id,
            i.statut_inscription AS statut,
            n.valeur_note AS note
        FROM inscriptions i
        JOIN etudiants e ON i.etudiant_id = e.id
        JOIN utilisateurs u_eleve ON e.utilisateur_id = u_eleve.id
        JOIN cours c ON i.cours_id = c.id
        JOIN enseignants prof ON c.enseignant_id = prof.id
        LEFT JOIN notes n ON n.inscription_id = i.id
        WHERE prof.utilisateur_id = :prof_uid
    ");
    
    $stmt->execute(['prof_uid' => $prof_utilisateur_id]);
    $listeEleves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'etudiants' => $listeEleves
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur de base : ' . $e->getMessage()]);
}
?>