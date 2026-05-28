<?php
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

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Utilisateur.php';

$db = new Database();
$pdo = $db->connect();
session_start();

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

if (preg_match('/\/api\/auth\/login/', $request) && $method === 'POST') {
    include __DIR__ . '/routes/authentification.php';
}
elseif (preg_match('/\/api\/cours/', $request) && $method === 'GET') {
    require __DIR__ . '/routes/cours.php';
}
elseif (preg_match('/\/api\/cours/', $request) && $method === 'POST') {
    require __DIR__ . '/routes/cours.php';
}

?>