<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($data['action']) && $data['action'] === 'login' && isset($data['email']) && isset($data['password'])) {
        
        $userModel = new Utilisateur($pdo);
        $user = $userModel->login($data['email'], $data['password']);
        
        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
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