<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

$id_sala = $_POST['id_sala'] ?? '';
$nome = $_POST['nome_dotazione'] ?? '';

try {
    $stmt = $pdo->prepare("INSERT INTO dotazioni_sale (id_sala, nome_dotazione, condizione, note) VALUES (?, ?, 'Buona', '')");
    $stmt->execute([$id_sala, $nome]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>