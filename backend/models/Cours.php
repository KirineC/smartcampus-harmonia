<?php
class Cours {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getAll() {
        $stmt = $this->pdo->prepare("
            SELECT 
                c.*, 
                c.statut, -- 👈 On s'assure de bien récupérer le statut ici
                u.prenom, 
                u.nom AS prof_nom, 
                s.nom_salle

                -- ... (tes sous-requêtes SELECT COUNT(*) restent identiques) ...
                
            FROM cours c
            JOIN enseignants e ON c.enseignant_id = e.id
            JOIN utilisateurs u ON e.utilisateur_id = u.id
            JOIN salles s ON c.salle_id = s.id
            WHERE c.statut = 'Actif' -- 👈 On ne prend que les cours vivants pour le catalogue
            ORDER BY c.jour_semaine, c.heure_debut
        ");

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function create($code, $titre, $type, $capa, $prof, $salle, $jour, $debut, $fin, $semestre, $desc, $instrument_requis = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO cours (code_cours, titre, type_cours, capacite_max, enseignant_id, salle_id, jour_semaine, heure_debut, heure_fin, semestre, description, instrument_requis, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Actif')
        ");
    return $stmt->execute([$code, $titre, $type, $capa, $prof, $salle, $jour, $debut, $fin, $semestre, $desc, $instrument_requis]);
    }
}
?>