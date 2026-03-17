<?php
// backend/api/get_inviti.php

// 1. Impedisce a PHP di inviare errori testuali che rompono il JSON
error_reporting(0); 
ini_set('display_errors', 0);

header('Content-Type: application/json');
require_once '../Common/config.php';

session_start();

// 2. Controllo sessione
$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Sessione non valida. Effettua di nuovo il login.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT p.*, 
               s.nome as nome_sala, 
               s.capienza as max_iscritti, 
               i.nome as organizzatore, 
               part.stato,
               (SELECT COUNT(*) FROM partecipazioni WHERE id_prenotazione = p.id AND stato = 'confermato') as confermati
        FROM partecipazioni part
        JOIN prenotazioni p ON part.id_prenotazione = p.id
        JOIN sale s ON p.id_sala = s.id
        JOIN iscritti i ON p.id_responsabile = i.id
        WHERE part.id_iscritto = ?
    ");
    $stmt->execute([$user_id]);
    $inviti = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'inviti' => $inviti]);

} catch (PDOException $e) {
    // Restituiamo l'errore in formato JSON invece di farlo stampare a PHP
    echo json_encode(['success' => false, 'message' => 'Errore database: ' . $e->getMessage()]);
}
?>