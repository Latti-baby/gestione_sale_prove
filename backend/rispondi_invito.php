<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$id_pren = $_POST['id_prenotazione'];
$stato = $_POST['stato']; // può essere 'confermato', 'rifiutato', 'annullato'
$motivazione = $_POST['motivazione'] ?? null;

if ($stato === 'confermato') {
    // ... mantieni il tuo codice esistente per il controllo delle sovrapposizioni ...
}

// Resettiamo la motivazione se l'utente accetta o annulla (opzionale)
if ($stato !== 'rifiutato') {
    $motivazione = null; 
}

try {
    $upd = $pdo->prepare("UPDATE partecipazioni SET stato = ?, motivazione = ? WHERE id_prenotazione = ? AND id_iscritto = ?");
    $upd->execute([$stato, $motivazione, $id_pren, $user_id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}