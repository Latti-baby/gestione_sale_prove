<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

// Controllo sicurezza: solo l'amministratore può forzare le modifiche
if (!isset($_SESSION['user_id']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false, 'message' => 'Azione non consentita: permessi insufficienti.']);
    exit;
}

// Ricezione dati con pulizia da eventuali script malevoli (XSS)
$id = $_POST['id'] ?? null;
$attivita = htmlspecialchars($_POST['attivita'] ?? '', ENT_QUOTES, 'UTF-8');
$data = $_POST['data'] ?? '';
$ora = $_POST['ora_inizio'] ?? '';
$durata = $_POST['durata'] ?? '';

if (!$id || !$attivita || !$data || !$ora) {
    echo json_encode(['success' => false, 'message' => 'Dati incompleti per la modifica']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE prenotazioni SET attivita = ?, data = ?, ora_inizio = ?, durata = ? WHERE id = ?");
    $stmt->execute([$attivita, $data, $ora, $durata, $id]);

    echo json_encode(['success' => true, 'message' => 'Prenotazione aggiornata con successo!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>