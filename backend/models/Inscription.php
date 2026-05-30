<?php
class Inscription {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // Vérifier le nombre d'inscrits validés actuels d'un cours
    public function getNombreInscrits($cours_id) {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) 
            FROM inscriptions 
            WHERE cours_id = ? 
            AND statut_inscription = 'Validée'
        ");
        $stmt->execute([$cours_id]);
        return $stmt->fetchColumn();
    }

    // Vérifier si l'étudiant a déjà une demande ou une inscription pour ce cours
    public function dejaInscritOuDemande($etudiant_id, $cours_id) {
        $stmt = $this->pdo->prepare("
            SELECT id, statut_inscription
            FROM inscriptions
            WHERE etudiant_id = ?
            AND cours_id = ?
            LIMIT 1
        ");
        $stmt->execute([$etudiant_id, $cours_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Détecter un conflit horaire entre le cours demandé et les cours déjà validés/en attente de l'étudiant
    public function detecterConflitHoraire($etudiant_id, $cours_id) {
        // Récupérer le cours demandé
        $stmtCours = $this->pdo->prepare("
            SELECT 
                id,
                titre,
                jour_semaine,
                heure_debut,
                heure_fin
            FROM cours
            WHERE id = ?
            LIMIT 1
        ");
        $stmtCours->execute([$cours_id]);
        $coursDemande = $stmtCours->fetch(PDO::FETCH_ASSOC);

        if (!$coursDemande) {
            return null;
        }

        // Chercher un cours déjà validé/en attente qui chevauche le cours demandé
        $stmt = $this->pdo->prepare("
            SELECT 
                i.id AS inscription_id,
                i.statut_inscription,
                c.id AS cours_id,
                c.titre,
                c.jour_semaine,
                c.heure_debut,
                c.heure_fin
            FROM inscriptions i
            JOIN cours c ON i.cours_id = c.id
            WHERE i.etudiant_id = ?
            AND i.cours_id <> ?
            AND i.statut_inscription IN ('Validée', 'En attente')
            AND c.jour_semaine = ?
            AND c.heure_debut < ?
            AND c.heure_fin > ?
            LIMIT 1
        ");

        $stmt->execute([
            $etudiant_id,
            $cours_id,
            $coursDemande['jour_semaine'],
            $coursDemande['heure_fin'],
            $coursDemande['heure_debut']
        ]);

        $conflit = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$conflit) {
            return null;
        }

        return [
            'cours_demande' => $coursDemande,
            'cours_conflit' => $conflit
        ];
    }

    // Tenter de créer une demande d'inscription
    public function inscrire($etudiant_id, $cours_id) {
        // 1. Vérifier si le cours existe et récupérer sa capacité
        $stmtCours = $this->pdo->prepare("
            SELECT id, capacite_max 
            FROM cours 
            WHERE id = ?
        ");
        $stmtCours->execute([$cours_id]);
        $cours = $stmtCours->fetch(PDO::FETCH_ASSOC);

        if (!$cours) {
            return [
                'success' => false,
                'error' => 'Cours inexistant.'
            ];
        }

        // 2. Vérifier si l'étudiant a déjà une demande ou une inscription pour ce même cours
        $inscriptionExistante = $this->dejaInscritOuDemande($etudiant_id, $cours_id);

        if ($inscriptionExistante) {
            if ($inscriptionExistante['statut_inscription'] === 'En attente') {
                return [
                    'success' => false,
                    'error' => '⚠️ Vous avez déjà une demande en attente pour ce cours.'
                ];
            }

            if ($inscriptionExistante['statut_inscription'] === 'Validée') {
                return [
                    'success' => false,
                    'error' => '⚠️ Vous êtes déjà inscrit à ce cours.'
                ];
            }

            return [
                'success' => false,
                'error' => '⚠️ Une inscription existe déjà pour ce cours.'
            ];
        }

        // 3. Vérifier si le cours demandé chevauche un autre cours déjà validé ou en attente
        $conflitHoraire = $this->detecterConflitHoraire($etudiant_id, $cours_id);

        if ($conflitHoraire) {
            $coursConflit = $conflitHoraire['cours_conflit'];
            $statut = strtolower($coursConflit['statut_inscription']);

            return [
                'success' => false,
                'error' => "⚠️ Conflit horaire avec le cours « " . $coursConflit['titre'] . " » déjà " . $statut . "."
            ];
        }

        // 4. Vérifier si le cours est déjà complet en inscriptions validées
        $inscritsActuels = $this->getNombreInscrits($cours_id);

        if ($inscritsActuels >= $cours['capacite_max']) {
            return [
                'success' => false,
                'error' => '⚠️ Capacité maximale atteinte pour ce cours.'
            ];
        }

        // 5. Créer une demande d'inscription en attente
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO inscriptions (etudiant_id, cours_id, statut_inscription)
                VALUES (?, ?, 'En attente')
            ");

            $success = $stmt->execute([$etudiant_id, $cours_id]);

            return [
                'success' => $success,
                'message' => 'Demande d’inscription envoyée au professeur.'
            ];

        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                return [
                    'success' => false,
                    'error' => '⚠️ Vous avez déjà une demande ou une inscription pour ce cours.'
                ];
            }

            return [
                'success' => false,
                'error' => 'Erreur base de données.'
            ];
        }
    }
}
?>