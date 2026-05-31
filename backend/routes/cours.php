<?php
if ($method === 'GET') {
    $coursModel = new Cours($pdo);
    $courses = $coursModel->getAll();
    echo json_encode($courses);
}
elseif ($method === 'POST') {
    $coursModel = new Cours($pdo);
    
    // 🎯 On récupère le nouvel instrument requis envoyé par le formulaire Admin
    // (S'il n'est pas fourni, on met NULL par défaut)
    $instrument_requis = $data['instrument_requis'] ?? null;

    $success = $coursModel->create(
        $data['code_cours'],
        $data['titre'],
        $data['type_cours'],
        $data['capacite_max'],
        $data['enseignant_id'],
        $data['salle_id'],
        $data['jour_semaine'],
        $data['heure_debut'],
        $data['heure_fin'],
        $data['semestre'],
        $data['description'],
        $instrument_requis // 🎯 On le passe en 12ème paramètre à la méthode create
    );
    
    echo json_encode(['success' => $success]);
}
?>