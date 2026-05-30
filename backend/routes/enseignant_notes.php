<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
    exit;
}

$notes_liste = $data['notes'] ?? [];

if (empty($notes_liste)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Aucune donnée de note reçue.']);
    exit;
}

try {
    $pdo->beginTransaction();

    $checkStmt = $pdo->prepare("SELECT id FROM notes WHERE inscription_id = :inscription_id");
    $updateStmt = $pdo->prepare("UPDATE notes SET valeur_note = :valeur WHERE inscription_id = :inscription_id");
    $insertStmt = $pdo->prepare("
        INSERT INTO notes (inscription_id, valeur_note, date_evaluation, type_evaluation, est_valide) 
        VALUES (:inscription_id, :valeur, CURDATE(), 'Audition Fin de Semestre', 1)
    ");

    foreach ($notes_liste as $item) {
        $inscription_id = intval($item['inscription_id']);
        
        // Nettoyage de la chaîne numérique pour le type DECIMAL de MySQL
        $valeur_note = str_replace(',', '.', trim($item['note']));

        if (!is_numeric($valeur_note)) {
            continue;
        }

        $checkStmt->execute(['inscription_id' => $inscription_id]);
        $existe = $checkStmt->fetch();

        if ($existe) {
            $updateStmt->execute([
                ':valeur' => $valeur_note,
                ':inscription_id' => $inscription_id
            ]);
        } else {
            $insertStmt->execute([
                ':inscription_id' => $inscription_id,
                ':valeur' => $valeur_note
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Notes enregistrées avec succès.']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(200); 
    echo json_encode(['success' => false, 'error' => 'Erreur SQL : ' . $e->getMessage()]);
}
?>