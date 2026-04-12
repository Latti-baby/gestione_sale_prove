<?php
// ATTENZIONE: Righe di debug per far urlare PHP se ci sono errori
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']); 
    exit;
}

try {
    // Prima query: recupera le prenotazioni create dall'utente (responsabile)
    $stmt = $pdo->prepare("
        SELECT p.id, p.attivita, p.data, p.ora_inizio, p.durata, s.nome as nome_sala 
        FROM prenotazioni p
        JOIN sale s ON p.id_sala = s.id
        WHERE p.id_responsabile = ? AND p.data >= CURDATE()
        ORDER BY p.data ASC, p.ora_inizio ASC
    ");
    $stmt->execute([$user_id]);
    $eventi = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Seconda query: per ogni evento, recupera i partecipanti (dalla tabella iscritti) e il loro stato
    foreach ($eventi as $key => $evento) {
        $stmtPart = $pdo->prepare("
            SELECT i.nome, i.cognome, part.stato, part.motivazione 
            FROM partecipazioni part
            JOIN iscritti i ON part.id_iscritto = i.id 
            WHERE part.id_prenotazione = ? AND part.id_iscritto != ?
            ORDER BY part.stato ASC, i.nome ASC
        ");
        $stmtPart->execute([$evento['id'], $user_id]);
        $eventi[$key]['partecipanti'] = $stmtPart->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['success' => true, 'eventi' => $eventi]);

} catch (Exception $e) {
    // Questo catturerà e stamperà un JSON valido in caso di query scritta male
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>