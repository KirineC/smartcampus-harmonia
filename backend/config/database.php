<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'harmonia_conservatoire'; // Ton vrai nom de BDD
    private $user = 'root';
    private $password = 'root'; // Mot de passe MAMP pour Mac

    public function connect() {
        // Détection intelligente du système (Vide pour Windows/WAMP, 'root' pour Mac/MAMP)
        $current_password = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? '' : $this->password;

        try {
            $pdo = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4',
                $this->user,
                $current_password
            );
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            return $pdo;
        } catch (PDOException $e) {
            die('Erreur connexion : ' . $e->getMessage());
        }
    }
}
?>