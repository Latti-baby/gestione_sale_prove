<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

// Controllo sessione
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$user_id = $_SESSION['user_id'];
$ruolo = $_SESSION['ruolo'] ?? '';
$id = $_POST['id'] ?? null;
$motivazione = $_POST['motivazione'] ?? 'Nessuna motivazione fornita'; // Nuovo parametro dal frontend

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'ID prenotazione mancante']);
    exit;
}

try {
    // 1. Recupera la prenotazione per verificare i permessi e ottenere info sull'evento
    $stmtPren = $pdo->prepare("SELECT * FROM prenotazioni WHERE id = ?");
    $stmtPren->execute([$id]);
    $prenotazione = $stmtPren->fetch(PDO::FETCH_ASSOC);

    if (!$prenotazione) {
        echo json_encode(['success' => false, 'message' => 'Prenotazione non trovata']);
        exit;
    }

    // 2. Controllo sicurezza: l'utente è admin oppure è il creatore (responsabile) della prenotazione?
    $isAdmin = ($ruolo === 'admin' || $ruolo === 'amministratore');
    $isResponsabile = ($prenotazione['id_responsabile'] == $user_id);

    if (!$isAdmin && !$isResponsabile) {
        echo json_encode(['success' => false, 'message' => 'Azione non consentita: non hai i permessi per eliminare questa prenotazione.']);
        exit;
    }

    // 3. Se fornita una motivazione o se annullata dal responsabile, notifichiamo i partecipanti
    $stmtPart = $pdo->prepare("SELECT id_iscritto FROM partecipazioni WHERE id_prenotazione = ?");
    $stmtPart->execute([$id]);
    $partecipanti = $stmtPart->fetchAll(PDO::FETCH_ASSOC);

    if (count($partecipanti) > 0) {
        $msg = "L'evento '" . $prenotazione['attivita'] . "' del " . $prenotazione['data'] . " è stato ANNULLATO dal responsabile.";
        if (!empty($_POST['motivazione'])) {
            $msg .= " Motivazione: " . $motivazione;
        }

        $stmtNotifica = $pdo->prepare("INSERT INTO notifiche (id_docente, messaggio) VALUES (?, ?)");
        foreach ($partecipanti as $p) {
            // Evitiamo di mandare la notifica a se stesso se il responsabile è nella lista
            if ($p['id_iscritto'] != $user_id) {
                $stmtNotifica->execute([$p['id_iscritto'], $msg]);
            }
        }
    }

    // 4. Pulizia partecipazioni (in caso il DB non abbia ON DELETE CASCADE impostato)
    $stmtDelPart = $pdo->prepare("DELETE FROM partecipazioni WHERE id_prenotazione = ?");
    $stmtDelPart->execute([$id]);

    // 5. Elimina la prenotazione vera e propria
    $stmt = $pdo->prepare("DELETE FROM prenotazioni WHERE id = ?");
    $result = $stmt->execute([$id]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Prenotazione eliminata correttamente e studenti avvisati.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Impossibile eliminare il record']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore database: ' . $e->getMessage()]);
}
?>