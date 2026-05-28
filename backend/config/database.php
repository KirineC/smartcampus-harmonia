<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'harmonia_conservatoire';
    private $user = 'root';
    private $password = '';

    public function connect() {
        try {
            $pdo = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db_name,
                $this->user,
                $this->password
            );
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } catch (PDOException $e) {
            die('Erreur connexion : ' . $e->getMessage());
        }
    }
}
?>