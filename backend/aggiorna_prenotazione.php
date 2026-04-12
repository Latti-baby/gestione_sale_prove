<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$ruolo = $_SESSION['ruolo'] ?? '';
$isAdmin = ($ruolo === 'admin' || $ruolo === 'amministratore');

// Ricezione dati
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
    // Se non è admin, verifichiamo che la prenotazione appartenga all'utente (id_responsabile)
    if (!$isAdmin) {
        $stmtCheck = $pdo->prepare("SELECT id_responsabile FROM prenotazioni WHERE id = ?");
        $stmtCheck->execute([$id]);
        $prenotazione = $stmtCheck->fetch();

        // Corretto: confronto con id_responsabile
        if (!$prenotazione || $prenotazione['id_responsabile'] != $user_id) {
            echo json_encode(['success' => false, 'message' => 'Azione non consentita: puoi modificare solo le tue prenotazioni.']);
            exit;
        }
    }

    // Aggiornamento dei dati
    $stmt = $pdo->prepare("UPDATE prenotazioni SET attivita = ?, data = ?, ora_inizio = ?, durata = ? WHERE id = ?");
    $stmt->execute([$attivita, $data, $ora, $durata, $id]);

    echo json_encode(['success' => true, 'message' => 'Prenotazione aggiornata con successo!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>