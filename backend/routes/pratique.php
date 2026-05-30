<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Vérification des champs obligatoires requis par ta base de données
    if (isset($data['etudiant_id']) && isset($data['duree_minutes']) && isset($data['instrument_id'])) {
        
        try {
            // Préparation de la requête d'insertion dans la table journal_pratique
            $stmt = $pdo->prepare("
                INSERT INTO journal_pratique (etudiant_id, date_session, duree_minutes, instrument_id, repertoire_travaille, notes) 
                VALUES (:etudiant_id, :date_session, :duree_minutes, :instrument_id, :repertoire, :notes)
            ");
            
            // Exécution avec les vraies valeurs reçues du front
            $success = $stmt->execute([
                'etudiant_id' => intval($data['etudiant_id']),
                'date_session' => date('Y-m-d'), // Enregistre à la date du jour automatiquement
                'duree_minutes' => intval($data['duree_minutes']),
                'instrument_id' => intval($data['instrument_id']),
                'repertoire' => $data['repertoire_travaille'] ?? null,
                'notes' => $data['notes'] ?? null
            ]);
            
            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Séance d’étude consignée avec succès.']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Échec de l’insertion dans le registre.']);
            }
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Erreur de base de données : ' . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Informations de séance incomplètes.']);
    }
}
?>