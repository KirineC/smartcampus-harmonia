<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
    exit;
}

$action = $data['action'] ?? null;
$inscription_id = $data['inscription_id'] ?? null;

if (!$inscription_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Identifiant d\'inscription manquant.']);
    exit;
}

try {
    // 🟢 CAS 1 : Le professeur clique sur "Valider"
    if ($action === 'valider_inscription') {
        $stmt = $pdo->prepare("
            UPDATE inscriptions 
            SET statut_inscription = 'Validée' 
            WHERE id = :id
        ");
        $success = $stmt->execute(['id' => $inscription_id]);
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Inscription validée avec succès.']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Impossible de mettre à jour le registre.']);
        }
    } 
    // 🔴 CAS 2 : Le professeur clique sur "Révoquer"
    static_last:
    if ($action === 'revoquer_inscription') {
        // Option radicale et propre : On supprime la ligne pour que l'élève puisse candidater à nouveau
        $stmt = $pdo->prepare("DELETE FROM inscriptions WHERE id = :id");
        $success = $stmt->execute(['id' => $inscription_id]);
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Inscription révoquée du registre.']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Impossible de supprimer l\'inscription.']);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur SQL : ' . $e->getMessage()]);
}
?>