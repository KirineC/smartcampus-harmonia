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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Inclusions centralisées
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Utilisateur.php';
require_once __DIR__ . '/models/Cours.php';
require_once __DIR__ . '/models/Inscription.php';

// 3. Connexion BDD + session
$db = new Database();
$pdo = $db->connect();
session_start();

// 4. Lecture du JSON envoyé par React
$json_brut = file_get_contents('php://input');
$data = json_decode($json_brut, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    $data = [];
}

// 5. Récupération de la route
$request = $_SERVER['REQUEST_URI'];
$request = str_replace('/smartcampus-harmonia/backend', '', $request);
$request = strtok($request, '?');

$method = $_SERVER['REQUEST_METHOD'];

// 6. Routeur
$isIndex = ($request === '/index.php');
$isRoot = ($request === '/');
$isInscriptions = preg_match('/\/api\/inscriptions/', $request);
$isAuthLogin = preg_match('/\/api\/auth\/login/', $request);
$isCours = preg_match('/\/api\/cours/', $request);

// --- INSCRIPTIONS : inscription / annulation via POST ---
if (($isInscriptions || $isIndex) && $method === 'POST' && isset($data['cours_id'])) {
    include __DIR__ . '/routes/inscriptions.php';
}

// --- INSCRIPTIONS : annulation via DELETE, gardée en secours ---
elseif (($isInscriptions || $isIndex) && $method === 'DELETE') {
    include __DIR__ . '/routes/inscriptions.php';
}

// --- INSCRIPTIONS : voir mes inscriptions ---
elseif (($isInscriptions || $isIndex) && $method === 'GET' && isset($_GET['mes_inscriptions'])) {
    include __DIR__ . '/routes/inscriptions.php';
}

// --- AUTHENTIFICATION ---
elseif (($isAuthLogin || $isIndex) && $method === 'POST' && isset($data['action']) && $data['action'] === 'login') {
    include __DIR__ . '/routes/authentification.php';
}

// --- PRATIQUE : enregistrement journal / métronome ---
elseif (($isIndex || $isRoot) && $method === 'POST' && isset($data['action']) && $data['action'] === 'enregistrer_pratique') {
    include __DIR__ . '/routes/pratique.php';
}

// --- COURS : récupération des cours ---
elseif (($isCours || $isIndex) && $method === 'GET') {
    require __DIR__ . '/routes/cours.php';
}

// --- COURS : création d'un cours ---
elseif (($isCours || $isIndex) && $method === 'POST') {
    require __DIR__ . '/routes/cours.php';
}

// --- ROUTE NON TROUVÉE ---
else {
    http_response_code(404);
    echo json_encode([
        'error' => 'Route non trouvee',
        'uri' => $request,
        'method' => $method,
        'data' => $data
    ]);
}
?>