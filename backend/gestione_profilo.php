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
    // PRELEVA DATI UTENTE
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
    // AGGIORNA DATI UTENTE
    $nome = $_POST['nome'] ?? '';
    $cognome = $_POST['cognome'] ?? '';
    $data_nascita = $_POST['data_nascita'] ?? null;
    
    if (!$nome || !$cognome) {
        echo json_encode(['success' => false, 'message' => 'Nome e cognome sono obbligatori']);
        exit;
    }

    try {
        // Controllo se è stata caricata una nuova foto
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../Immagini/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $estensione = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
            $nomeFoto = time() . '_' . uniqid() . '.' . $estensione; // Evitiamo nomi doppi
            
            if (move_uploaded_file($_FILES['foto']['tmp_name'], $uploadDir . $nomeFoto)) {
                // Aggiorniamo anche la foto nel database
                $stmt = $pdo->prepare("UPDATE iscritti SET nome = ?, cognome = ?, data_nascita = ?, foto = ? WHERE id = ?");
                $stmt->execute([$nome, $cognome, $data_nascita, $nomeFoto, $user_id]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Errore nel caricamento della foto.']);
                exit;
            }
        } else {
            // Aggiornamento dati SENZA cambiare la foto
            $stmt = $pdo->prepare("UPDATE iscritti SET nome = ?, cognome = ?, data_nascita = ? WHERE id = ?");
            $stmt->execute([$nome, $cognome, $data_nascita, $user_id]);
        }

        // Aggiorniamo il nome nel localStorage per riflettere il cambiamento nella dashboard
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
    }
}
?>