<?php
session_start();
require_once '../config.php';
header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$id_pren = $_POST['id_prenotazione'];
$stato = $_POST['stato'];

if ($stato === 'confermato') {
    // 1. Info della lezione che vuoi accettare
    $stmt = $pdo->prepare("SELECT data, ora_inizio, durata FROM prenotazioni WHERE id = ?");
    $stmt->execute([$id_pren]);
    $n = $stmt->fetch();
    $fine_nuova = $n['ora_inizio'] + $n['durata'];

    // 2. Controllo se hai già qualcosa di confermato che si sovrappone
    $check = $pdo->prepare("
        SELECT p.attivita FROM partecipazioni part
        JOIN prenotazioni p ON part.id_prenotazione = p.id
        WHERE part.id_iscritto = ? AND part.stato = 'confermato' AND p.data = ?
        AND (
            (p.ora_inizio < ? AND (p.ora_inizio + p.durata) > ?)
        )
    ");
    $check->execute([$user_id, $n['data'], $fine_nuova, $n['ora_inizio']]);
    
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Hai già un impegno confermato in questa fascia oraria!']);
        exit;
    }
}

// Se passa il controllo o se sta rifiutando, aggiorna
$upd = $pdo->prepare("UPDATE partecipazioni SET stato = ? WHERE id_prenotazione = ? AND id_iscritto = ?");
$upd->execute([$stato, $id_pren, $user_id]);
echo json_encode(['success' => true]);