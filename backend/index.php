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

// Gestion de la requête de pré-vérification OPTIONS
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

// Nettoyage du chemin du backend
$request = str_replace('/smartcampus-harmonia/backend', '', $request);
$request = strtok($request, '?');

$method = $_SERVER['REQUEST_METHOD'];

// 6. Variables de route
$isIndex = ($request === '/index.php');
$isRoot = ($request === '/');
$isInscriptions = preg_match('/\/api\/inscriptions/', $request);
$isAuthLogin = preg_match('/\/api\/auth\/login/', $request);
$isCours = preg_match('/\/api\/cours/', $request);
$isEnseignantEleves = preg_match('/\/api\/enseignant_eleves/', $request);

// 7. Routeur

// --- INSCRIPTIONS ÉTUDIANT : demande d'inscription ou annulation via POST ---
if (
    ($isInscriptions || $isIndex)
    && $method === 'POST'
    && isset($data['cours_id'])
) {
    include __DIR__ . '/routes/inscriptions.php';
}

// --- INSCRIPTIONS ÉTUDIANT : annulation via DELETE, gardée en secours ---
elseif (
    ($isInscriptions || $isIndex)
    && $method === 'DELETE'
) {
    include __DIR__ . '/routes/inscriptions.php';
}

// --- INSCRIPTIONS ÉTUDIANT : voir mes inscriptions ---
elseif (
    ($isInscriptions || $isIndex)
    && $method === 'GET'
    && isset($_GET['mes_inscriptions'])
) {
    include __DIR__ . '/routes/inscriptions.php';
}

// --- ENSEIGNANT : récupérer les élèves / demandes d'inscription ---
elseif (
    ($isEnseignantEleves || $isIndex)
    && $method === 'GET'
    && isset($_GET['liste_eleves_prof'])
) {
    include __DIR__ . '/routes/enseignant_eleves.php';
}

// --- ENSEIGNANT : accepter ou refuser une demande d'inscription ---
elseif (
    ($isEnseignantEleves || $isIndex)
    && $method === 'POST'
    && isset($data['action'])
    && in_array($data['action'], ['accepter_inscription', 'refuser_inscription'])
) {
    include __DIR__ . '/routes/enseignant_eleves.php';
}

// --- AUTHENTIFICATION ---
elseif (
    ($isAuthLogin || $isIndex)
    && $method === 'POST'
    && isset($data['action'])
    && $data['action'] === 'login'
) {
    include __DIR__ . '/routes/authentification.php';
}

// --- PRATIQUE : enregistrement journal / métronome ---
elseif (
    ($isIndex || $isRoot)
    && $method === 'POST'
    && isset($data['action'])
    && $data['action'] === 'enregistrer_pratique'
) {
    include __DIR__ . '/routes/pratique.php';
}

// --- COURS : récupération des cours ---
elseif (
    ($isCours || $isIndex)
    && $method === 'GET'
) {
    require __DIR__ . '/routes/cours.php';
}

// --- COURS : création d'un cours ---
elseif (
    ($isCours || $isIndex)
    && $method === 'POST'
) {
    require __DIR__ . '/routes/cours.php';
}

// --- ROUTE NON TROUVÉE ---
else {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Route non trouvee',
        'uri' => $request,
        'method' => $method,
        'data' => $data
    ]);
}
?>