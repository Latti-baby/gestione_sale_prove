<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM settori ORDER BY nome");
    $settori = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'settori' => $settori]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>