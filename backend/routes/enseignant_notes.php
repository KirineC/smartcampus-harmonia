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

    // 🎯 REQUÊTE POUR RÉCUPÉRER LES INFOS DE NOTIFICATION (Cours + Élève)
    $infoStmt = $pdo->prepare("
        SELECT e.utilisateur_id, c.titre AS nom_cours
        FROM inscriptions i
        JOIN etudiants e ON i.etudiant_id = e.id
        JOIN cours c ON i.cours_id = c.id
        WHERE i.id = ?
    ");

    // 🎯 REQUÊTE POUR INSERER L'ALERTE
    $notifStmt = $pdo->prepare("
        INSERT INTO notifications (utilisateur_id, message, lu) 
        VALUES (?, ?, 0)
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

        // ============================================================
        // 🔔 DÉCLENCHEUR DE NOTIFICATIONS AUTOMATIQUES
        // ============================================================
        $infoStmt->execute([$inscription_id]);
        $info = $infoStmt->fetch(PDO::FETCH_ASSOC);

        if ($info && !empty($info['utilisateur_id'])) {
            $msg = "🎵 Une nouvelle note a été attribuée à votre partition de '" . $info['nom_cours'] . "'. Consultez votre livret !";
            $notifStmt->execute([$info['utilisateur_id'], $msg]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Notes enregistrées et étudiants notifiés avec succès.']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(200); 
    echo json_encode(['success' => false, 'error' => 'Erreur SQL : ' . $e->getMessage()]);
}
?>