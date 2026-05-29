<?php
if ($method === 'GET') {
    $coursModel = new Cours($pdo);
    $courses = $coursModel->getAll();
    echo json_encode($courses);
}
elseif ($method === 'POST') {
    $coursModel = new Cours($pdo);
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
        $data['description']
    );
    
    echo json_encode(['success' => $success]);
}
?>