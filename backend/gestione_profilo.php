<?php
session_start();
header('Content-Type: application/json');
require_once '../Common/config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

if ($action === 'get') {
    // PRELEVA DATI
    $stmt = $pdo->prepare("SELECT nome, cognome, email, data_nascita, foto FROM iscritti WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Utente non trovato']);
    }
} 
elseif ($action === 'update') {
    // AGGIORNA DATI
    $nome = $_POST['nome'] ?? '';
    $cognome = $_POST['cognome'] ?? '';
    $data_nascita = $_POST['data_nascita'] ?? null;
    
    if (!$nome || !$cognome) {
        echo json_encode(['success' => false, 'message' => 'Nome e cognome sono obbligatori']);
        exit;
    }

    try {
        // Gestione aggiornamento foto
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../Immagini/';
            $estensione = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
            $nomeFoto = time() . '_' . uniqid() . '.' . $estensione;
            
            if (move_uploaded_file($_FILES['foto']['tmp_name'], $uploadDir . $nomeFoto)) {
                $stmt = $pdo->prepare("UPDATE iscritti SET nome = ?, cognome = ?, data_nascita = ?, foto = ? WHERE id = ?");
                $stmt->execute([$nome, $cognome, $data_nascita, $nomeFoto, $user_id]);
            }
        } else {
            // Aggiornamento senza foto
            $stmt = $pdo->prepare("UPDATE iscritti SET nome = ?, cognome = ?, data_nascita = ? WHERE id = ?");
            $stmt->execute([$nome, $cognome, $data_nascita, $user_id]);
        }

        // Aggiorna nome in sessione
        $_SESSION['userName'] = $nome; 
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
    }
}