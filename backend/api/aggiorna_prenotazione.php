<?php
session_start();
header('Content-Type: application/json');
require_once '../config.php';

// Ricezione dati
$id = $_POST['id'] ?? null;
$attivita = $_POST['attivita'] ?? '';
$data = $_POST['data'] ?? '';
$ora = $_POST['ora_inizio'] ?? '';
$durata = $_POST['durata'] ?? '';

if (!$id || !$attivita || !$data || !$ora) {
    echo json_encode(['success' => false, 'message' => 'Dati incompleti per la modifica']);
    exit;
}

try {
    // 1. (Opzionale) Controllo sovrapposizioni anche in fase di modifica
    // Qui l'admin ha il potere di forzare, ma potresti aggiungere un check simile a quello del salvataggio

    $stmt = $pdo->prepare("UPDATE prenotazioni SET attivita = ?, data = ?, ora_inizio = ?, durata = ? WHERE id = ?");
    $stmt->execute([$attivita, $data, $ora, $durata, $id]);

    echo json_encode(['success' => true, 'message' => 'Prenotazione aggiornata con successo!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}