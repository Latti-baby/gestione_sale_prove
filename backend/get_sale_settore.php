<?php
header('Content-Type: application/json');
require_once '../config.php';
session_start();

$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Sessione scaduta']);
    exit;
}

try {
    // Troviamo il settore dell'utente loggato
    $stmtUser = $pdo->prepare("SELECT id_settore FROM iscritti WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $user = $stmtUser->fetch();

    if ($user) {
        // Recuperiamo le sale che appartengono a quel settore
        $stmtSale = $pdo->prepare("SELECT id, nome, capienza FROM sale WHERE id_settore = ?");
        $stmtSale->execute([$user['id_settore']]);
        $sale = $stmtSale->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'sale' => $sale]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}