<?php
require_once '../Common/config.php';
header('Content-Type: application/json');

$nome = $_POST['nome'] ?? '';
$cognome = $_POST['cognome'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$data_nascita = $_POST['data_nascita'] ?? '';
$id_settore = $_POST['id_settore'] ?? null;
$ruolo = 'allievo'; // Di base chi si registra è allievo

if(!$nome || !$cognome || !$email || !$password || !$id_settore) {
    echo json_encode(['success'=>false, 'message'=>'Compila tutti i campi obbligatori.']); exit;
}

try {
    // Controlliamo che l'email non esista già
    $check = $pdo->prepare("SELECT id FROM iscritti WHERE email = ?");
    $check->execute([$email]);
    if($check->rowCount() > 0) {
        echo json_encode(['success'=>false, 'message'=>'Questa email è già registrata!']); exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO iscritti (nome, cognome, email, password, data_nascita, ruolo, id_settore) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nome, $cognome, $email, $hash, $data_nascita, $ruolo, $id_settore]);
    
    echo json_encode(['success'=>true]);
} catch(PDOException $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
?>