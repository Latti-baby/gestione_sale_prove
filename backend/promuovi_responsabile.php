<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['ruolo']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$id_iscritto = $_POST['id_iscritto'] ?? null;
$anni_servizio = $_POST['anni_servizio'] ?? 0;
$force_replace = isset($_POST['force_replace']) && $_POST['force_replace'] === '1';

if (!$id_iscritto) {
    echo json_encode(['success' => false, 'message' => 'ID Iscritto mancante']);
    exit;
}

try {
    // 1. Trova il settore dell'utente che stiamo promuovendo
    $stmtSettore = $pdo->prepare("SELECT id_settore FROM iscritti WHERE id = ?");
    $stmtSettore->execute([$id_iscritto]);
    $id_settore = $stmtSettore->fetchColumn();

    if (!$id_settore) {
        echo json_encode(['success' => false, 'message' => 'L\'utente non è assegnato a nessun settore, impossibile promuoverlo.']);
        exit;
    }

    // 2. Controlla se l'utente scelto è GIA' responsabile
    $checkSelf = $pdo->prepare("SELECT COUNT(*) FROM responsabili_dati WHERE id_iscritto = ?");
    $checkSelf->execute([$id_iscritto]);
    if ($checkSelf->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Questo utente è già responsabile del suo settore.']);
        exit;
    }

    // 3. Controlla se ESISTE GIA' un responsabile per questo specifico settore
    $checkOthers = $pdo->prepare("
        SELECT r.id_iscritto, i.nome, i.cognome 
        FROM responsabili_dati r 
        JOIN iscritti i ON r.id_iscritto = i.id 
        WHERE i.id_settore = ?
    ");
    $checkOthers->execute([$id_settore]);
    $managerAttuale = $checkOthers->fetch(PDO::FETCH_ASSOC);

    // 4. Logica di sostituzione
    if ($managerAttuale) {
        if (!$force_replace) {
            echo json_encode([
                'success' => false, 
                'require_confirm' => true, 
                'message' => "Il settore ha già un responsabile: " . $managerAttuale['nome'] . " " . $managerAttuale['cognome'] . ". Vuoi revocargli il ruolo e sostituirlo?"
            ]);
            exit;
        } else {
            $del = $pdo->prepare("DELETE FROM responsabili_dati WHERE id_iscritto = ?");
            $del->execute([$managerAttuale['id_iscritto']]);
        }
    }

    // 5. Inseriamo il nuovo responsabile
    $data_promozione = date('Y-m-d');
    $stmtIns = $pdo->prepare("INSERT INTO responsabili_dati (id_iscritto, anni_servizio, data_promozione) VALUES (?, ?, ?)");
    $stmtIns->execute([$id_iscritto, $anni_servizio, $data_promozione]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>