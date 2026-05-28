<?php
class Utilisateur {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function login($email, $password) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM utilisateurs WHERE courriel = ?
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['mot_de_passe_chiffre'])) {
            return $user;
        }
        return false;
    }
    
    public function register($email, $password, $role, $prenom, $nom) {
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        $stmt = $this->pdo->prepare("
            INSERT INTO utilisateurs (courriel, mot_de_passe_chiffre, role, prenom, nom)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        return $stmt->execute([$email, $hashedPassword, $role, $prenom, $nom]);
    }
}
?>