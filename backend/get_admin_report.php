<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

// Controllo di sicurezza Reale
if (!isset($_SESSION['user_id']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accesso negato']);
    exit;
}

try {
    $sql = "SELECT 
                p.id, 
                p.attivita, 
                p.data, 
                p.ora_inizio, 
                s.nome AS nome_sala, 
                s.capienza AS max_iscritti,
                setto.nome AS nome_settore,
                (SELECT COUNT(*) FROM partecipazioni WHERE id_prenotazione = p.id AND stato = 'confermato') AS confermati
            FROM prenotazioni p
            JOIN sale s ON p.id_sala = s.id
            JOIN settori setto ON s.id_settore = setto.id
            ORDER BY p.data DESC, p.ora_inizio ASC";

    $stmt = $pdo->query($sql);
    $report = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $report]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>