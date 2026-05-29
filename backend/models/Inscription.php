<?php
class Inscription {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // Vérifier le nombre d'inscrits actuels d'un cours
    public function getNombreInscrits($cours_id) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM inscriptions WHERE cours_id = ?");
        $stmt->execute([$cours_id]);
        return $stmt->fetchColumn();
    }

    // Tenter d'inscrire un étudiant
    public function inscrire($etudiant_id, $cours_id) {
        // 1. Récupérer la capacité max du cours
        $stmtCours = $this->pdo->prepare("SELECT capacite_max FROM cours WHERE id = ?");
        $stmtCours->execute([$cours_id]);
        $cours = $stmtCours->fetch(PDO::FETCH_ASSOC);

        if (!$cours) return ['success' => false, 'error' => 'Cours inexistant'];

        // 2. Vérifier si le cours est complet
        $inscritsActuels = $this->getNombreInscrits($cours_id);
        if ($inscritsActuels >= $cours['capacite_max']) {
            return ['success' => false, 'error' => '⚠️ Capacité maximale atteinte pour ce cours.'];
        }

        // 3. Insérer l'inscription
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO inscriptions (etudiant_id, cours_id, statut_inscription) 
                VALUES (?, ?, 'Validée')
            ");
            $success = $stmt->execute([$etudiant_id, $cours_id]);
            return ['success' => $success];
        } catch (PDOException $e) {
            // Gestion du doublon (Index unique de ta base SQL)
            if ($e->getCode() == 23000) {
                return ['success' => false, 'error' => '⚠️ Vous êtes déjà inscrit à ce cours.'];
            }
            return ['success' => false, 'error' => 'Erreur base de données'];
        }
    }
}