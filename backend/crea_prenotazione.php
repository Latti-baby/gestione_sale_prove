<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$id_sala = $_POST['id_sala'] ?? '';
$attivita = $_POST['attivita'] ?? '';
$data = $_POST['data'] ?? '';
$ora_inizio = (int)$_POST['ora_inizio'] ?? 0;
$durata = (int)$_POST['durata'] ?? 1;
$tipo_invito = $_POST['tipo_invito'] ?? 'tutti';
$valore_ruolo = $_POST['valore_ruolo'] ?? '';

if (!$id_sala || !$attivita || !$data || !$ora_inizio) {
    echo json_encode(['success' => false, 'message' => 'Compila tutti i campi obbligatori']);
    exit;
}

try {
    // 1. CONTROLLO SOVRAPPOSIZIONI (Operazione 3c del PDF)
    // Controlliamo se la sala è occupata nella stessa data e in un orario che si accavalla
    $fine_nuova = $ora_inizio + $durata;
    
    $checkSala = $pdo->prepare("
        SELECT id FROM prenotazioni 
        WHERE id_sala = ? AND data = ? 
        AND (ora_inizio < ? AND (ora_inizio + durata) > ?)
    ");
    $checkSala->execute([$id_sala, $data, $fine_nuova, $ora_inizio]);
    
    if ($checkSala->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Errore: La sala è già occupata in questo orario!']);
        exit;
    }

    // Troviamo il settore di chi sta organizzando (per l'invito per settore)
    $stmtUser = $pdo->prepare("SELECT id_settore FROM iscritti WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $id_settore_org = $stmtUser->fetchColumn();

    $pdo->beginTransaction(); // Iniziamo una transazione sicura

    // 2. INSERIMENTO PRENOTAZIONE
    $insPren = $pdo->prepare("INSERT INTO prenotazioni (id_sala, id_responsabile, attivita, data, ora_inizio, durata) VALUES (?, ?, ?, ?, ?, ?)");
    $insPren->execute([$id_sala, $user_id, $attivita, $data, $ora_inizio, $durata]);
    $id_prenotazione_creata = $pdo->lastInsertId();

    // 3. SELEZIONE DEGLI INVITATI IN BASE ALLA CATEGORIA
    $queryIscritti = "SELECT id FROM iscritti WHERE 1=1";
    $paramsIscritti = [];

    if ($tipo_invito === 'settore') {
        $queryIscritti .= " AND id_settore = ?";
        $paramsIscritti[] = $id_settore_org;
    } elseif ($tipo_invito === 'ruolo') {
        $queryIscritti .= " AND ruolo = ?";
        $paramsIscritti[] = $valore_ruolo;
    }

    $stmtIscr = $pdo->prepare($queryIscritti);
    $stmtIscr->execute($paramsIscritti);
    $iscrittiDaInvitare = $stmtIscr->fetchAll(PDO::FETCH_COLUMN);

    // 4. INVIO DEGLI INVITI (Inserimento in `partecipazioni`)
    if (count($iscrittiDaInvitare) > 0) {
        $insPart = $pdo->prepare("INSERT INTO partecipazioni (id_prenotazione, id_iscritto, stato) VALUES (?, ?, 'in attesa')");
        foreach ($iscrittiDaInvitare as $id_iscritto) {
            $insPart->execute([$id_prenotazione_creata, $id_iscritto]);
        }
    }

    $pdo->commit(); // Conferma tutto nel database

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    $pdo->rollBack(); // Se c'è un errore, annulla tutto
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
?>