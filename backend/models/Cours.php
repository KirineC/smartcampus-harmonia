<?php
class Cours {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // Récupérer tous les cours
    public function getAll() {
        $stmt = $this->pdo->prepare("
            SELECT c.*, u.prenom, u.nom as prof_nom, s.nom_salle
            FROM cours c
            JOIN enseignants e ON c.enseignant_id = e.id
            JOIN utilisateurs u ON e.utilisateur_id = u.id -- 👈 On passe par la table utilisateurs
            JOIN salles s ON c.salle_id = s.id
            ORDER BY c.jour_semaine, c.heure_debut
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Créer un cours 
    public function create($code, $titre, $type_cours, $capacite_max, $enseignant_id, $salle_id, $jour, $debut, $fin, $semestre, $desc) {
        $stmt = $this->pdo->prepare("
            INSERT INTO cours (code_cours, titre, type_cours, capacite_max, enseignant_id, salle_id, jour_semaine, heure_debut, heure_fin, semestre, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([$code, $titre, $type_cours, $capacite_max, $enseignant_id, $salle_id, $jour, $debut, $fin, $semestre, $desc]);
    }
}
?>