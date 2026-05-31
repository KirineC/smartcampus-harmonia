<?php
// 🎯 On récupère l'ID soit de l'URL (GET) soit du payload JSON (POST) soit de la session en secours
$user_id = null;
if (isset($_GET['user_id'])) {
    $user_id = (int)$_GET['user_id'];
} elseif (isset($data['user_id'])) {
    $user_id = (int)$data['user_id'];
} elseif (isset($_SESSION['user_id'])) {
    $user_id = (int)$_SESSION['user_id'];
}

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Identifiant utilisateur introuvable. Veuillez vous reconnecter.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Récupération dynamique du rôle depuis la BDD pour être sûr à 100%
try {
    $stmtRole = $pdo->prepare("SELECT role FROM utilisateurs WHERE id = ?");
    $stmtRole->execute([$user_id]);
    $role = $stmtRole->fetchColumn();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur liaison BDD rôle : ' . $e->getMessage()]);
    exit();
}

if (!$role) {
    http_response_code(444);
    echo json_encode(['success' => false, 'error' => 'Rôle introuvable pour cet utilisateur.']);
    exit();
}

// ============================================================
// 🔍 CAS 1 : RÉCUPÉRATION DES DONNÉES (GET)
// ============================================================
if ($method === 'GET') {
    try {
        $stmtUser = $pdo->prepare("SELECT id, nom, prenom, courriel AS email, role FROM utilisateurs WHERE id = ?");
        $stmtUser->execute([$user_id]);
        $profil = $stmtUser->fetch(PDO::FETCH_ASSOC);

        if (!$profil) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Profil introuvable.']);
            exit();
        }

        // Valeurs par défaut pour React
        $profil['telephone'] = '';
        $profil['biographie'] = '';
        $profil['instrument_majeur'] = '';
        $profil['specialite'] = '';

        if ($role === 'etudiant') {
            $stmt = $pdo->prepare("SELECT telephone, biographie, instrument_majeur FROM etudiants WHERE utilisateur_id = ?");
            $stmt->execute([$user_id]);
            $extra = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($extra) {
                $profil['telephone'] = $extra['telephone'] ?? '';
                $profil['biographie'] = $extra['biographie'] ?? '';
                $profil['instrument_majeur'] = $extra['instrument_majeur'] ?? '';
            }
        } elseif ($role === 'enseignant') {
            $stmt = $pdo->prepare("SELECT telephone, biographie, specialite FROM enseignants WHERE utilisateur_id = ?");
            $stmt->execute([$user_id]);
            $extra = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($extra) {
                $profil['telephone'] = $extra['telephone'] ?? '';
                $profil['biographie'] = $extra['biographie'] ?? '';
                $profil['specialite'] = $extra['specialite'] ?? '';
            }
        }

        echo json_encode(['success' => true, 'data' => $profil]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur SQL lors de la lecture : ' . $e->getMessage()]);
        exit();
    }
}

// ============================================================
// 💾 CAS 2 : MISE À JOUR DES DONNÉES (POST)
// ============================================================
if ($method === 'POST') {
    $email = trim($data['email'] ?? '');
    $telephone = trim($data['telephone'] ?? '');
    $biographie = trim($data['biographie'] ?? '');
    $champs_specialite = trim($data['champs_specialite'] ?? '');
    
    $ancien_password = $data['ancien_password'] ?? null;
    $nouveau_password = $data['nouveau_password'] ?? null;

    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'L\'adresse courriel est obligatoire.']);
        exit();
    }

    try {
        $pdo->beginTransaction();

        // 1. Mise à jour table 'utilisateurs' (courriel)
        $stmtUser = $pdo->prepare("UPDATE utilisateurs SET courriel = ? WHERE id = ?");
        $stmtUser->execute([$email, $user_id]);

        // 2. Mise à jour des tables spécifiques (avec vérification si la ligne existe)
        if ($role === 'etudiant') {
            $check = $pdo->prepare("SELECT id FROM etudiants WHERE utilisateur_id = ?");
            $check->execute([$user_id]);
            if ($check->fetch()) {
                $stmtSub = $pdo->prepare("UPDATE etudiants SET telephone = ?, biographie = ?, instrument_majeur = ? WHERE utilisateur_id = ?");
                $stmtSub->execute([$telephone, $biographie, $champs_specialite, $user_id]);
            } else {
                $stmtSub = $pdo->prepare("INSERT INTO etudiants (utilisateur_id, telephone, biographie, instrument_majeur) VALUES (?, ?, ?, ?)");
                $stmtSub->execute([$user_id, $telephone, $biographie, $champs_specialite]);
            }
        } elseif ($role === 'enseignant') {
            $check = $pdo->prepare("SELECT id FROM enseignants WHERE utilisateur_id = ?");
            $check->execute([$user_id]);
            if ($check->fetch()) {
                $stmtSub = $pdo->prepare("UPDATE enseignants SET telephone = ?, biographie = ?, specialite = ? WHERE utilisateur_id = ?");
                $stmtSub->execute([$telephone, $biographie, $champs_specialite, $user_id]);
            } else {
                $stmtSub = $pdo->prepare("INSERT INTO enseignants (utilisateur_id, telephone, biographie, specialite) VALUES (?, ?, ?, ?)");
                $stmtSub->execute([$user_id, $telephone, $biographie, $champs_specialite]);
            }
        }

        // 3. Gestion du mot de passe (mot_de_passe_chiffre)
        if (!empty($ancien_password) && !empty($nouveau_password)) {
            $stmtCheckPass = $pdo->prepare("SELECT mot_de_passe_chiffre FROM utilisateurs WHERE id = ?");
            $stmtCheckPass->execute([$user_id]);
            $currentHash = $stmtCheckPass->fetchColumn();

            if ($ancien_password !== $currentHash) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'L\'ancien mot de passe est incorrect.']);
                exit();
            }

            $stmtUpdatePass = $pdo->prepare("UPDATE utilisateurs SET mot_de_passe_chiffre = ? WHERE id = ?");
            $stmtUpdatePass->execute([$nouveau_password, $user_id]);
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Fiche d\'artiste mise à jour avec succès !']);
        exit();
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la sauvegarde : ' . $e->getMessage()]);
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
?>