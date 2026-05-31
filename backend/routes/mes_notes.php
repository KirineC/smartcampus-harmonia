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

try {
    // Retrouver l'étudiant connecté
    $stmt = $pdo->prepare("
        SELECT id
        FROM etudiants
        WHERE utilisateur_id = ?
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $etudiant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$etudiant) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Cet utilisateur n’est pas un étudiant.'
        ]);
        exit();
    }

    $etudiant_id = $etudiant['id'];

    // Récupérer les cours validés de l'étudiant avec leurs notes éventuelles
    $stmt = $pdo->prepare("
        SELECT
            i.id AS inscription_id,
            i.statut_inscription,

            c.id AS cours_id,
            c.code_cours,
            c.titre,
            c.type_cours,
            c.semestre,
            c.jour_semaine,
            c.heure_debut,
            c.heure_fin,

            u_prof.prenom AS prof_prenom,
            u_prof.nom AS prof_nom,

            n.id AS note_id,
            n.valeur_note,
            n.date_evaluation,
            n.type_evaluation,
            n.est_valide
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        JOIN enseignants ens ON c.enseignant_id = ens.id
        JOIN utilisateurs u_prof ON ens.utilisateur_id = u_prof.id
        LEFT JOIN notes n ON n.inscription_id = i.id AND n.est_valide = 1
        WHERE i.etudiant_id = ?
        AND i.statut_inscription = 'Validée'
        ORDER BY c.jour_semaine, c.heure_debut, c.titre
    ");

    $stmt->execute([$etudiant_id]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $notesNumeriques = [];

    foreach ($notes as $ligne) {
        if ($ligne['valeur_note'] !== null && is_numeric($ligne['valeur_note'])) {
            $notesNumeriques[] = (float)$ligne['valeur_note'];
        }
    }

    $totalCours = count($notes);
    $coursNotes = count($notesNumeriques);
    $moyenne = null;
    $meilleureMatiere = null;
    $matiereAAmeliorer = null;

    if ($coursNotes > 0) {
        $moyenne = round(array_sum($notesNumeriques) / $coursNotes, 2);

        $meilleure = null;
        $plusFaible = null;

        foreach ($notes as $ligne) {
            if ($ligne['valeur_note'] !== null && is_numeric($ligne['valeur_note'])) {
                $valeur = (float)$ligne['valeur_note'];

                if ($meilleure === null || $valeur > (float)$meilleure['valeur_note']) {
                    $meilleure = $ligne;
                }

                if ($plusFaible === null || $valeur < (float)$plusFaible['valeur_note']) {
                    $plusFaible = $ligne;
                }
            }
        }

        if ($meilleure) {
            $meilleureMatiere = [
                'titre' => $meilleure['titre'],
                'note' => (float)$meilleure['valeur_note']
            ];
        }

        if ($plusFaible) {
            $matiereAAmeliorer = [
                'titre' => $plusFaible['titre'],
                'note' => (float)$plusFaible['valeur_note']
            ];
        }
    }

    if ($moyenne === null) {
        $mention = 'En attente d’évaluation';
    } elseif ($moyenne >= 16) {
        $mention = 'Virtuose';
    } elseif ($moyenne >= 14) {
        $mention = 'Très bien';
    } elseif ($moyenne >= 12) {
        $mention = 'Bien';
    } elseif ($moyenne >= 10) {
        $mention = 'Validé';
    } else {
        $mention = 'À retravailler';
    }

    echo json_encode([
        'success' => true,
        'notes' => $notes,
        'stats' => [
            'moyenne' => $moyenne,
            'mention' => $mention,
            'total_cours' => $totalCours,
            'cours_notes' => $coursNotes,
            'cours_non_notes' => $totalCours - $coursNotes,
            'meilleure_matiere' => $meilleureMatiere,
            'matiere_a_ameliorer' => $matiereAAmeliorer
        ]
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
?>