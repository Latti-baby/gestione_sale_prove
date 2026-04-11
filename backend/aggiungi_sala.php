<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['ruolo']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']); exit;
}

$nome = $_POST['nome'] ?? '';
$capienza = $_POST['capienza'] ?? 0;
$id_settore = $_POST['id_settore'] ?? null;

try {
    $stmt = $pdo->prepare("INSERT INTO sale (nome, capienza, id_settore) VALUES (?, ?, ?)");
    $stmt->execute([$nome, $capienza, $id_settore]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>