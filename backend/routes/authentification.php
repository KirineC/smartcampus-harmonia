<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($data['action']) && $data['action'] === 'login' && isset($data['email']) && isset($data['password'])) {
        
        $userModel = new Utilisateur($pdo);
        $user = $userModel->login($data['email'], $data['password']);
        
        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            
            // 🎯 AJOUT CRUCIAL : Si c'est un étudiant, on va chercher son vrai ID et sa filière
            $etudiant_id = null;
            $filiere = null;
            
            if ($user['role'] === 'etudiant') {
                $stmt = $pdo->prepare("SELECT id, filiere FROM etudiants WHERE utilisateur_id = :uid");
                $stmt->execute(['uid' => $user['id']]);
                $etudiantData = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($etudiantData) {
                    $etudiant_id = $etudiantData['id'];
                    $filiere = $etudiantData['filiere'];
                }
            }
            
            // On renvoie le tout proprement emballé pour ton React
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'etudiant_id' => $etudiant_id, // 🪙 Maintenant dispo ! (ex: 1 pour Sophie)
                    'filiere' => $filiere,         // ✨ Pratique pour ton Dashboard (ex: Classique)
                    'email' => $user['courriel'],
                    'role' => $user['role'],
                    'prenom' => $user['prenom'],
                    'nom' => $user['nom']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Identifiants incorrects']);
        }
    }
}
?>