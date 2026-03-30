<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']); exit;
}

try {
    // 1. Query per Conteggio (Punto 3b)
    $stmt3b = $pdo->prepare("
        SELECT p.data, s.nome as nome_sala, COUNT(DISTINCT p.id) as num_prenotazioni
        FROM prenotazioni p
        JOIN sale s ON p.id_sala = s.id
        LEFT JOIN partecipazioni part ON part.id_prenotazione = p.id
        WHERE p.id_responsabile = ? OR (part.id_iscritto = ? AND part.stato NOT IN ('rifiutato', 'annullato'))
        GROUP BY p.data, s.nome
        ORDER BY p.data ASC, s.nome ASC
    ");
    $stmt3b->execute([$user_id, $user_id]);
    $conteggio = $stmt3b->fetchAll(PDO::FETCH_ASSOC);

    // 2. Query Complessa (Punto 3e)
    // Usa le sub-query per calcolare live il numero di partecipanti vs numero iscritti del settore
    $sql3e = "
        SELECT p.id, p.attivita, p.data, p.ora_inizio, s.nome as nome_sala,
               (SELECT COUNT(*) FROM partecipazioni WHERE id_prenotazione = p.id AND stato='confermato') as num_partecipanti,
               (SELECT COUNT(*) FROM iscritti WHERE id_settore = (SELECT id_settore FROM iscritti WHERE id = p.id_responsabile)) as num_iscritti_settore
        FROM prenotazioni p
        JOIN sale s ON p.id_sala = s.id
        HAVING num_partecipanti > num_iscritti_settore
        ORDER BY p.data DESC
    ";
    $stmt3e = $pdo->query($sql3e);
    $complesse = $stmt3e->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'conteggio' => $conteggio, 'complesse' => $complesse]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Errore: ' . $e->getMessage()]);
}
?>