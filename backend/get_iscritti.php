<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['ruolo']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']); exit;
}

try {
    // AGGIUNTA data_registrazione ALLA QUERY
    $stmt = $pdo->prepare("
        SELECT i.id, i.nome, i.cognome, i.email, i.ruolo, i.data_registrazione, s.nome AS nome_settore,
        IF(r.id_iscritto IS NOT NULL, 1, 0) AS is_responsabile
        FROM iscritti i
        LEFT JOIN settori s ON i.id_settore = s.id
        LEFT JOIN responsabili_dati r ON i.id = r.id_iscritto
        ORDER BY i.cognome, i.nome
    ");
    $stmt->execute();
    $iscritti = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'iscritti' => $iscritti]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>