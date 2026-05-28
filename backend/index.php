<?php
// 1. Configuration des en-têtes CORS
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Gestion de la requête de pré-vérification (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Inclusions centralisées des fichiers nécessaires
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Utilisateur.php';

// 3. Initialisation de la base de données et de la session
$db = new Database();
$pdo = $db->connect();
session_start();

// Lecture sécurisée du JSON pour éviter l'erreur 500 si le JSON est mal formé
$json_brut = file_get_contents('php://input');
$data = json_decode($json_brut, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    $data = []; // Si le JSON est invalide, on crée un tableau vide au lieu de crash
}

// 4. Récupération des informations de la requête
$request = $_SERVER['REQUEST_URI'];
// Nettoyage pour MAMP : on supprime le chemin des dossiers pour ne garder que la route de l'API
$request = str_replace('/smartcampus-harmonia/backend', '', $request);
$request = strtok($request, '?'); // Élimine les paramètres après un "?" si l'URL en contient
$method = $_SERVER['REQUEST_METHOD'];

// 5. Aiguillage des routes (Le Routeur)
if ((preg_match('/\/api\/auth\/login/', $request) || $request === '/index.php') && $method === 'POST') {
    include __DIR__ . '/routes/authentification.php';
}
elseif (preg_match('/\/api\/cours/', $request) && $method === 'GET') {
    require __DIR__ . '/routes/cours.php';
}
elseif (preg_match('/\/api\/cours/', $request) && $method === 'POST') {
    require __DIR__ . '/routes/cours.php';
}
else {
    // Si aucune route ne correspond
    http_response_code(404);
    echo json_encode(['error' => 'Route non trouvee', 'uri' => $request]);
}
?>