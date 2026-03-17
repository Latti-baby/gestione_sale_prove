<?php

if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
    
    header('HTTP/1.0 403 Forbidden');
    die(json_encode(['success' => false, 'message' => 'Accesso negato: API protetta.']));
}


$host = "localhost";
$db_name = "gestione_sala_prove";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
    exit;
}
?>