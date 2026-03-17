<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

// Controllo sicurezza: solo l'admin può accedere
// Supponiamo che l'admin abbia un ruolo specifico nel database o un ID fisso
// if ($_SESSION['user_role'] !== 'admin') { die("Accesso negato"); }

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