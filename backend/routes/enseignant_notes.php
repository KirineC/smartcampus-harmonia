<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Méthode non autorisée.'
    ]);
    exit;
}

$mode = $data['mode'] ?? 'enregistrer';
$notes_liste = $data['notes'] ?? [];

if (!in_array($mode, ['enregistrer', 'valider'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Action de note invalide.'
    ]);
    exit;
}

if (empty($notes_liste)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Aucune donnée de note reçue.'
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Vérifier si une note existe déjà pour cette inscription
    $checkStmt = $pdo->prepare("
        SELECT id, valeur_note, est_valide
        FROM notes
        WHERE inscription_id = :inscription_id
        LIMIT 1
    ");

    // Enregistrer une note en brouillon
    // date_evaluation utilise CURDATE() car ta colonne ne peut pas être NULL.
    // L'étudiant ne la verra pas tant que est_valide = 0.
    $insertBrouillonStmt = $pdo->prepare("
        INSERT INTO notes (
            inscription_id,
            valeur_note,
            date_evaluation,
            type_evaluation,
            est_valide
        )
        VALUES (
            :inscription_id,
            :valeur,
            CURDATE(),
            'Brouillon enseignant',
            0
        )
    ");

    // Modifier une note brouillon existante
    $updateBrouillonStmt = $pdo->prepare("
        UPDATE notes
        SET valeur_note = :valeur,
            date_evaluation = CURDATE(),
            type_evaluation = 'Brouillon enseignant',
            est_valide = 0
        WHERE inscription_id = :inscription_id
        AND est_valide = 0
    ");

    // Valider directement une note qui n'existe pas encore
    $insertValidationStmt = $pdo->prepare("
        INSERT INTO notes (
            inscription_id,
            valeur_note,
            date_evaluation,
            type_evaluation,
            est_valide
        )
        VALUES (
            :inscription_id,
            :valeur,
            CURDATE(),
            'Audition Fin de Semestre',
            1
        )
    ");

    // Valider une note brouillon existante
    $updateValidationStmt = $pdo->prepare("
        UPDATE notes
        SET valeur_note = :valeur,
            date_evaluation = CURDATE(),
            type_evaluation = 'Audition Fin de Semestre',
            est_valide = 1
        WHERE inscription_id = :inscription_id
        AND est_valide = 0
    ");

    // Informations utiles pour la notification étudiant
    $infoStmt = $pdo->prepare("
        SELECT
            e.utilisateur_id,
            c.titre AS nom_cours
        FROM inscriptions i
        JOIN etudiants e ON i.etudiant_id = e.id
        JOIN cours c ON i.cours_id = c.id
        WHERE i.id = ?
        LIMIT 1
    ");

    // Notification envoyée uniquement lors de la validation/publication
    $notifStmt = $pdo->prepare("
        INSERT INTO notifications (utilisateur_id, message, lu)
        VALUES (?, ?, 0)
    ");

    $notesTraitees = 0;
    $notesBloquees = [];

    foreach ($notes_liste as $item) {
        $inscription_id = intval($item['inscription_id'] ?? 0);
        $valeur_note = str_replace(',', '.', trim($item['note'] ?? ''));

        if ($inscription_id <= 0 || $valeur_note === '' || !is_numeric($valeur_note)) {
            continue;
        }

        $valeur_note = (float)$valeur_note;

        if ($valeur_note < 0 || $valeur_note > 20) {
            $notesBloquees[] = "Une note doit être comprise entre 0 et 20.";
            continue;
        }

        $infoStmt->execute([$inscription_id]);
        $info = $infoStmt->fetch(PDO::FETCH_ASSOC);

        if (!$info) {
            $notesBloquees[] = "Inscription introuvable.";
            continue;
        }

        $checkStmt->execute([
            ':inscription_id' => $inscription_id
        ]);

        $noteExistante = $checkStmt->fetch(PDO::FETCH_ASSOC);

        // Si la note est déjà validée, elle est verrouillée définitivement
        if ($noteExistante && (int)$noteExistante['est_valide'] === 1) {
            $notesBloquees[] = "La note du cours « " . $info['nom_cours'] . " » est déjà validée et ne peut plus être modifiée.";
            continue;
        }

        // MODE 1 : enregistrer en brouillon
        if ($mode === 'enregistrer') {
            if ($noteExistante) {
                $updateBrouillonStmt->execute([
                    ':inscription_id' => $inscription_id,
                    ':valeur' => $valeur_note
                ]);
            } else {
                $insertBrouillonStmt->execute([
                    ':inscription_id' => $inscription_id,
                    ':valeur' => $valeur_note
                ]);
            }

            $notesTraitees++;
            continue;
        }

        // MODE 2 : valider et publier
        if ($mode === 'valider') {
            if ($noteExistante) {
                $updateValidationStmt->execute([
                    ':inscription_id' => $inscription_id,
                    ':valeur' => $valeur_note
                ]);
            } else {
                $insertValidationStmt->execute([
                    ':inscription_id' => $inscription_id,
                    ':valeur' => $valeur_note
                ]);
            }

            $notesTraitees++;

            if (!empty($info['utilisateur_id'])) {
                $msg = "🎵 Une nouvelle note a été publiée pour votre cours '" . $info['nom_cours'] . "'. Consultez votre bulletin !";
                $notifStmt->execute([
                    $info['utilisateur_id'],
                    $msg
                ]);
            }
        }
    }

    if ($notesTraitees === 0 && !empty($notesBloquees)) {
        $pdo->rollBack();

        echo json_encode([
            'success' => false,
            'error' => implode(' ', array_unique($notesBloquees))
        ]);
        exit;
    }

    $pdo->commit();

    if ($mode === 'enregistrer') {
        echo json_encode([
            'success' => true,
            'message' => 'Note enregistrée en brouillon. Elle n’est pas encore visible par l’étudiant.',
            'warnings' => array_values(array_unique($notesBloquees))
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Note validée, publiée et étudiant notifié avec succès.',
        'warnings' => array_values(array_unique($notesBloquees))
    ]);
    exit;

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(200);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur SQL : ' . $e->getMessage()
    ]);
    exit;
}
?>