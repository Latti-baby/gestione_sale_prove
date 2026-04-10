<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

try {
    // Recupera le notifiche non lette per l'utente loggato
    $stmt = $pdo->prepare("SELECT * FROM notifiche WHERE id_docente = ? AND letta = 0 ORDER BY data_creazione DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $notifiche = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Segna come lette dopo averle recuperate e visualizzate al docente
    $update = $pdo->prepare("UPDATE notifiche SET letta = 1 WHERE id_docente = ?");
    $update->execute([$_SESSION['user_id']]);

    echo json_encode(['success' => true, 'notifiche' => $notifiche]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>