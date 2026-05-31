<?php
class Cours {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getAll() {
    // On sélectionne toutes les infos du cours, le nom du prof, le nom de la salle
    // ET on compte le nombre d'inscriptions qui ont le statut 'Validée'
        $stmt = $this->pdo->prepare("
            SELECT 
                c.*,
                u.nom AS prof_nom,
                u.prenom,
                s.nom_salle,
                (SELECT COUNT(*) 
                FROM inscriptions i 
                WHERE i.cours_id = c.id 
                AND i.statut_inscription = 'Validée') AS places_occupees
            FROM cours c
            LEFT JOIN enseignants e ON c.enseignant_id = e.id
            LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
            LEFT JOIN salles s ON c.salle_id = s.id
            WHERE c.statut = 'Actif'
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