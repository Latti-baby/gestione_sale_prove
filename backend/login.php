<?php
session_start(); 
header('Content-Type: application/json');
require_once '../Common/config.php';

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

try {
    
    $stmt = $pdo->prepare("
            SELECT i.id, i.nome, i.ruolo, i.password, i.foto, s.nome AS nome_settore 
            FROM iscritti i
            LEFT JOIN settori s ON i.id_settore = s.id
            WHERE i.email = ?
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
       
        $_SESSION['user_id'] = $user['id']; 
        $_SESSION['ruolo'] = $user['ruolo']; 
        
        $stmtResp = $pdo->prepare("SELECT COUNT(*) FROM responsabili_dati WHERE id_iscritto = ?");
        $stmtResp->execute([$user['id']]);
        $isResp = $stmtResp->fetchColumn() > 0;

        
        echo json_encode([
            'success' => true,
            'id' => $user['id'],
            'nome' => $user['nome'],
            'ruolo' => strtolower(trim($user['ruolo'])),
            'settore' => $user['nome_settore'],
            'isResponsabile' => $isResp,
            'foto' => $user['foto']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Email o password errati']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>