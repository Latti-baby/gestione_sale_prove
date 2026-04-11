<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['ruolo']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false]); exit;
}

$id = $_POST['id'] ?? '';
$nome = $_POST['nome'] ?? '';
$capienza = $_POST['capienza'] ?? 0;

try {
    $stmt = $pdo->prepare("UPDATE sale SET nome = ?, capienza = ? WHERE id = ?");
    $stmt->execute([$nome, $capienza, $id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>