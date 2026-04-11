<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

$id_dotazione = $_POST['id_dotazione'] ?? '';
$condizione = $_POST['condizione'] ?? '';
$note = $_POST['note'] ?? '';

try {
    $stmt = $pdo->prepare("UPDATE dotazioni_sale SET condizione = ?, note = ? WHERE id = ?");
    $stmt->execute([$condizione, $note, $id_dotazione]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>