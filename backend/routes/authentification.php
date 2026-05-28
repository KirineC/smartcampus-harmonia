<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($data['action'] === 'login') {
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
