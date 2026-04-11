<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['ruolo']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$id_iscritto = $_POST['id_iscritto'] ?? null;

if (!$id_iscritto) {
    echo json_encode(['success' => false, 'message' => 'ID Iscritto mancante']);
    exit;
}

try {
    // Eliminiamo l'utente dalla tabella dei responsabili
    $stmt = $pdo->prepare("DELETE FROM responsabili_dati WHERE id_iscritto = ?");
    $stmt->execute([$id_iscritto]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>