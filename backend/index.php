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
$isEnseignantActions = preg_match('/\/api\/enseignant/', $request);
$isNotifications = preg_match('/\/api\/notifications/', $request);
$isProfil = preg_match('/\/api\/profil/', $request);

// ============================================================
// 7. ROUTEUR (Classé par méthode HTTP et niveau de précision)
// ============================================================

// ------------------------------------------------------------
// 🔔 MODULE DE NOTIFICATIONS SYSTEME (Priorité Absolue)
// ------------------------------------------------------------
if (
    ($isNotifications || $isIndex)
    && $method === 'GET'
    && isset($_GET['mes_notifs'])
) {
    // Rend service de manière autonome pour toutes les alertes (cours révoqués, notes publiées, etc.)
    $stmt = $pdo->prepare("SELECT * FROM notifications WHERE utilisateur_id = ? ORDER BY date_creation DESC LIMIT 10");
    $stmt->execute([$_SESSION['user_id']]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit();
}

elseif (
    ($isNotifications || $isIndex)
    && $method === 'POST'
    && isset($data['action'])
    && $data['action'] === 'marquer_lu'
) {
    $stmt = $pdo->prepare("UPDATE notifications SET lu = 1 WHERE utilisateur_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    echo json_encode(['success' => true]);
    exit();
}

// ------------------------------------------------------------
// 📝 MODULE ETUDIANT (Consultations spécifiques)
// ------------------------------------------------------------
elseif (
    ($isIndex || $request === '/api/mes_notes')
    && $method === 'GET'
    && isset($_GET['mes_notes'])
) {
    include __DIR__ . '/routes/mes_notes.php';
}

elseif (
    ($isInscriptions || $isIndex)
    && $method === 'GET'
    && isset($_GET['mes_inscriptions'])
) {
    include __DIR__ . '/routes/inscriptions.php';
}

// ------------------------------------------------------------
// 👨‍🏫 MODULE ENSEIGNANT (Listes et appels)
// ------------------------------------------------------------
elseif (
    ($isEnseignantEleves || $isIndex)
    && $method === 'GET'
    && isset($_GET['liste_eleves_prof'])
) {
    include __DIR__ . '/routes/enseignant_eleves.php';
}

// ------------------------------------------------------------
// 🏛️ MODULE ADMINISTRATEUR (Secrétariat & Chaires)
// ------------------------------------------------------------
elseif (
    $isIndex 
    && $method === 'GET' 
    && isset($_GET['admin_gestion'])
) {
    include __DIR__ . '/routes/admin_gestion.php';
}

// ------------------------------------------------------------
// ⚙️ SECTIONS D'ACTIONS DE MODIFICATION / CREATION (POST & DELETE)
// ------------------------------------------------------------

// Actions Inscriptions (S'inscrire)
elseif (
    ($isInscriptions || $isIndex)
    && $method === 'POST'
    && isset($data['cours_id'])
    && !isset($data['action']) // Inscription standard
) {
    include __DIR__ . '/routes/inscriptions.php';
}
// Actions Inscriptions (Annuler une demande en attente)
elseif (
    ($isInscriptions || $isIndex)
    && $method === 'POST'
    && isset($data['action'])
    && $data['action'] === 'annuler_inscription'
    && isset($data['cours_id'])
) {
    include __DIR__ . '/routes/inscriptions.php';
}

// Actions Inscriptions (Annuler en secours)
elseif (
    ($isInscriptions || $isIndex)
    && $method === 'DELETE'
    && isset($_GET['annuler_inscription'])
) {
    include __DIR__ . '/routes/inscriptions.php';
}

// Actions Enseignant (Gestion des demandes d'élèves)
elseif (
    ($isEnseignantEleves || $isEnseignantActions || $isIndex)
    && $method === 'POST'
    && isset($data['action'])
    && in_array($data['action'], ['accepter_inscription', 'refuser_inscription', 'valider_inscription', 'revoquer_inscription'])
) {
    include __DIR__ . '/routes/enseignant_actions.php';
}

// Actions Enseignant (Publication des Notes)
elseif (
    ($isIndex || preg_match('/\/api\/enseignant/', $request))
    && $method === 'POST'
    && isset($data['action'])
    && $data['action'] === 'publier_notes'
) {
    include __DIR__ . '/routes/enseignant_notes.php';
}

// ------------------------------------------------------------
// 👤 Actions Admin (Création de compte étudiant/enseignant)
// ------------------------------------------------------------
elseif (
    $isIndex 
    && $method === 'POST' 
    && isset($data['action']) 
    && $data['action'] === 'creer_utilisateur'
) {
    include __DIR__ . '/routes/admin_gestion.php';
}

// Actions Admin (Créer ou modifier un cours)
elseif (
    $isIndex 
    && $method === 'POST' 
    && isset($data['action']) 
    && ($data['action'] === 'creer_cours' || $data['action'] === 'modifier_cours')
) {
    include __DIR__ . '/routes/admin_gestion.php';
}

// Actions Admin (Révoquer / Clôturer un cours)
elseif (
    $isIndex 
    && $method === 'DELETE' 
    && isset($_GET['supprimer_cours'])
) {
    include __DIR__ . '/routes/admin_gestion.php';
}

// --- PROFIL : Récupérer ou modifier les données du profil ---
elseif (
    $isIndex 
    && ($method === 'GET' || $method === 'POST')
    && isset($_GET['profil'])
) {
    include __DIR__ . '/routes/profil.php';
}

// ------------------------------------------------------------
// 🔓 MODULES GENERAUX UTILS & AUTH (Toujours en bas)
// ------------------------------------------------------------
elseif (
    ($isAuthLogin || $isIndex)
    && $method === 'POST'
    && isset($data['action'])
    && $data['action'] === 'login'
) {
    include __DIR__ . '/routes/authentification.php';
}

elseif (
    ($isIndex || $isRoot)
    && $method === 'POST'
    && isset($data['action'])
    && $data['action'] === 'enregistrer_pratique'
) {
    include __DIR__ . '/routes/pratique.php';
}

// 🔍 ROUTES CATALOGUE ET COURS (Très génériques, gardées tout en bas)
elseif (
    ($isCours || $isIndex)
    && $method === 'GET'
) {
    require __DIR__ . '/routes/cours.php';
}

elseif (
    ($isCours || $isIndex)
    && $method === 'POST'
) {
    require __DIR__ . '/routes/cours.php';
}

// 🛑 ROUTE NON TROUVÉE
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