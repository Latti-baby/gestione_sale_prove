<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']); exit;
}

$data_scelta = $_GET['data'] ?? date('Y-m-d');

try {
    // 1. Calcolo l'inizio (Lunedì) e la fine (Domenica) della settimana
    $dt = new DateTime($data_scelta);
    $giorno_settimana = $dt->format('N'); 
    
    $start_week = clone $dt;
    $start_week->modify('-' . ($giorno_settimana - 1) . ' days');
    $end_week = clone $start_week;
    $end_week->modify('+6 days');

    $start_str = $start_week->format('Y-m-d');
    $end_str = $end_week->format('Y-m-d');

    // 2. Query per Impegni Utente
    $stmtImp = $pdo->prepare("
        SELECT p.attivita, p.data, p.ora_inizio, p.durata, s.nome as nome_sala 
        FROM partecipazioni part
        JOIN prenotazioni p ON part.id_prenotazione = p.id
        JOIN sale s ON p.id_sala = s.id
        WHERE part.id_iscritto = ? AND part.stato IN ('confermato', 'in attesa') 
        AND p.data >= ? AND p.data <= ?
        ORDER BY p.data ASC, p.ora_inizio ASC
    ");
    $stmtImp->execute([$user_id, $start_str, $end_str]);
    $impegni = $stmtImp->fetchAll(PDO::FETCH_ASSOC);

    // 3. Query per Occupazione Sale (Aggiornata per includere id, durata e id_utente)
    $stmtSale = $pdo->prepare("
        SELECT p.id, p.attivita, p.data, p.ora_inizio, p.durata, s.nome as nome_sala, p.id_utente 
        FROM prenotazioni p
        JOIN sale s ON p.id_sala = s.id
        WHERE p.data >= ? AND p.data <= ?
        ORDER BY s.nome ASC, p.data ASC, p.ora_inizio ASC
    ");
    $stmtSale->execute([$start_str, $end_str]);
    $sale = $stmtSale->fetchAll(PDO::FETCH_ASSOC);

    // Restituisco anche l'id utente loggato per il controllo nel frontend
    echo json_encode([
        'success' => true, 
        'impegni' => $impegni, 
        'sale' => $sale,
        'current_user_id' => $user_id 
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Errore: ' . $e->getMessage()]);
}
?>