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

        // 2. Vérifier si l'étudiant a déjà une demande ou inscription
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

        // 3. Vérifier si le cours est déjà complet en inscriptions validées
        $inscritsActuels = $this->getNombreInscrits($cours_id);

        if ($inscritsActuels >= $cours['capacite_max']) {
            return [
                'success' => false,
                'error' => '⚠️ Capacité maximale atteinte pour ce cours.'
            ];
        }

        // 4. Créer une demande d'inscription en attente
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