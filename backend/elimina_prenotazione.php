<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

// Controllo sicurezza: solo l'amministratore può eliminare prenotazioni
if (!isset($_SESSION['user_id']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false, 'message' => 'Azione non consentita: permessi insufficienti.']);
    exit;
}

$id = $_POST['id'] ?? null;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'ID prenotazione mancante']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM prenotazioni WHERE id = ?");
    $result = $stmt->execute([$id]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Prenotazione eliminata correttamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Impossibile eliminare il record']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore database: ' . $e->getMessage()]);
}
?>