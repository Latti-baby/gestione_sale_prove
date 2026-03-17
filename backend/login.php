<?php
// backend/api/login.php
session_start(); 
header('Content-Type: application/json');
require_once '../Common/config.php';

$email = $_POST['email'] ?? '';

try {
    $stmt = $pdo->prepare("
            SELECT i.id, i.nome, i.ruolo, s.nome AS nome_settore 
            FROM iscritti i
            LEFT JOIN settori s ON i.id_settore = s.id
            WHERE i.email = ?
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // SALVIAMO I DATI IN SESSIONE (Lato Server)
        $_SESSION['user_id'] = $user['id']; 
        $_SESSION['ruolo'] = $user['ruolo']; 
        
        // Verifichiamo se è responsabile
        $stmtResp = $pdo->prepare("SELECT COUNT(*) FROM responsabili_dati WHERE id_iscritto = ?");
        $stmtResp->execute([$user['id']]);
        $isResp = $stmtResp->fetchColumn() > 0;

        echo json_encode([
            'success' => true,
            'id' => $user['id'],
            'nome' => $user['nome'],
            'ruolo' => strtolower(trim($user['ruolo'])), // Normalizziamo per sicurezza
            'settore' => $user['nome_settore'], // <-- Aggiungiamo il settore
            'isResponsabile' => $isResp
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Email non trovata']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}