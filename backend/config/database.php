<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'harmonia_conservatoire';
    private $user = 'root';
    private $password = 'root'; // Mot de passe MAMP pour Mac

    public function connect() {
    // Si on est sur Windows, le mot de passe devient vide automatiquement, sinon il reste 'root'
    $current_password = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? '' : $this->password;

    try {
        $pdo = new PDO(
            'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4',
            $this->user,
            $current_password // On utilise le mot de passe intelligent ici
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die('Erreur connexion : ' . $e->getMessage());
    }
}
?>