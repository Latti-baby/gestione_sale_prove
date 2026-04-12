<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$user_id = $_SESSION['user_id'];
$id_pren = $_POST['id_prenotazione'];
$stato = $_POST['stato']; // può essere 'confermato', 'rifiutato', 'annullato'
$motivazione = $_POST['motivazione'] ?? null;

if ($stato === 'confermato') {
    // Controlliamo quanti posti sono già occupati rispetto alla capienza della sala
    $stmtCapienza = $pdo->prepare("
        SELECT s.capienza,
               (SELECT COUNT(*) FROM partecipazioni part WHERE part.id_prenotazione = p.id AND part.stato = 'confermato') as posti_occupati
        FROM prenotazioni p
        JOIN sale s ON p.id_sala = s.id
        WHERE p.id = ?
    ");
    $stmtCapienza->execute([$id_pren]);
    $datiSala = $stmtCapienza->fetch(PDO::FETCH_ASSOC);

    // Se i posti occupati sono uguali o maggiori della capienza, blocchiamo tutto
    if ($datiSala && $datiSala['posti_occupati'] >= $datiSala['capienza']) {
        echo json_encode(['success' => false, 'message' => 'Posti esauriti! La sala ha raggiunto la capienza massima.']);
        exit;
    }
}

// Resettiamo la motivazione solo se lo stato NON è rifiutato o annullato
if ($stato !== 'rifiutato' && $stato !== 'annullato') {
    $motivazione = null; 
}

try {
    $upd = $pdo->prepare("UPDATE partecipazioni SET stato = ?, motivazione = ? WHERE id_prenotazione = ? AND id_iscritto = ?");
    $upd->execute([$stato, $motivazione, $id_pren, $user_id]);

    // --- NOTIFICA AL DOCENTE RESPONSABILE ---
    $stmtPren = $pdo->prepare("SELECT id_responsabile, attivita FROM prenotazioni WHERE id = ?");
    $stmtPren->execute([$id_pren]);
    $prenotazione = $stmtPren->fetch(PDO::FETCH_ASSOC);

    $stmtStud = $pdo->prepare("SELECT nome, cognome FROM iscritti WHERE id = ?");
    $stmtStud->execute([$user_id]);
    $studente = $stmtStud->fetch(PDO::FETCH_ASSOC);

    if ($prenotazione && $studente) {
        $msg = "L'iscritto " . $studente['nome'] . " " . $studente['cognome'] . " ha " . strtoupper($stato) . " l'invito per: " . $prenotazione['attivita'];
        if ($motivazione) {
            $msg .= " (Motivazione: " . $motivazione . ")";
        }

        // Inserisci notifica per il docente responsabile
        $stmtNotifica = $pdo->prepare("INSERT INTO notifiche (id_docente, messaggio) VALUES (?, ?)");
        $stmtNotifica->execute([$prenotazione['id_responsabile'], $msg]);
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>