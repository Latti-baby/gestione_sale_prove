<?php
session_start();
require_once '../Common/config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['ruolo']) || ($_SESSION['ruolo'] !== 'admin' && $_SESSION['ruolo'] !== 'amministratore')) {
    echo json_encode(['success' => false]); exit;
}

try {
    // CORREZIONE: Usato 'st' invece di 'set' per evitare conflitti con MySQL
    $stmtSale = $pdo->query("SELECT s.id, s.nome, s.capienza, st.nome as nome_settore FROM sale s LEFT JOIN settori st ON s.id_settore = st.id");
    $sale = $stmtSale->fetchAll(PDO::FETCH_ASSOC);

    // Prendiamo tutte le dotazioni
    $stmtDot = $pdo->query("SELECT * FROM dotazioni_sale");
    $dotazioni = $stmtDot->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'sale' => $sale, 'dotazioni' => $dotazioni]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>