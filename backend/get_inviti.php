<?php
// backend/get_inviti.php

error_reporting(0); 
ini_set('display_errors', 0);

header('Content-Type: application/json');
require_once '../Common/config.php';

session_start();

$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Sessione non valida. Effettua di nuovo il login.']);
    exit;
}

try {
    // Aggiunto filtro CURDATE() e ordinamento ORDER BY
    $stmt = $pdo->prepare("
        SELECT p.*, 
               s.nome as nome_sala, 
               s.capienza as max_iscritti, 
               i.nome as organizzatore, 
               part.stato,
               (SELECT COUNT(*) FROM partecipazioni WHERE id_prenotazione = p.id AND stato = 'confermato') as confermati
        FROM partecipazioni part
        JOIN prenotazioni p ON part.id_prenotazione = p.id
        JOIN sale s ON p.id_sala = s.id
        JOIN iscritti i ON p.id_responsabile = i.id
        WHERE part.id_iscritto = ? AND p.data >= CURDATE()
        ORDER BY p.data ASC, p.ora_inizio ASC
    ");
    $stmt->execute([$user_id]);
    $inviti = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'inviti' => $inviti]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore database: ' . $e->getMessage()]);
}
?>