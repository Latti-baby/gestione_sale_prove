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
    echo json_encode(['success' => false, 'message' => 'Sessione non valida. Effettua di nuovo il login.']);
    exit;
}

try {
    // La query esclude (AND p.id_responsabile != ?) gli eventi di cui tu sei il creatore
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
        WHERE part.id_iscritto = ? 
          AND p.data >= CURDATE()
          AND p.id_responsabile != ?
        ORDER BY p.data ASC, p.ora_inizio ASC
    ");
    // Passiamo l'ID utente due volte
    $stmt->execute([$user_id, $user_id]);
    $inviti = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'inviti' => $inviti]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore database: ' . $e->getMessage()]);
}
?>