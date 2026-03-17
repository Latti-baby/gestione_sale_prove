<?php
header('Content-Type: application/json');
require_once '../Common/config.php';

$nome = $_POST['nome'] ?? '';
$cognome = $_POST['cognome'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$data_nascita = $_POST['data_nascita'] ?? null;
$ruolo = $_POST['ruolo'] ?? 'allievo';

if (!$nome || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Compila tutti i campi obbligatori']);
    exit;
}

// 1. Gestione del caricamento Foto
$nomeFoto = 'default.png';
if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../Immagini/';
    
    // Crea la cartella Immagini se non l'hai ancora creata
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $estensione = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
    // Genera un nome univoco per l'immagine per evitare sovrapposizioni
    $nomeFoto = time() . '_' . uniqid() . '.' . $estensione;
    move_uploaded_file($_FILES['foto']['tmp_name'], $uploadDir . $nomeFoto);
}

// 2. Criptiamo la password (fondamentale per la sicurezza e per i voti alti!)
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    // 3. Controlliamo che l'email non sia già stata usata
    $check = $pdo->prepare("SELECT id FROM iscritti WHERE email = ?");
    $check->execute([$email]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Questa email è già registrata!']);
        exit;
    }

    // 4. Salvataggio nel database
    $stmt = $pdo->prepare("INSERT INTO iscritti (nome, cognome, email, password, data_nascita, ruolo, foto) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nome, $cognome, $email, $passwordHash, $data_nascita, $ruolo, $nomeFoto]);

    echo json_encode(['success' => true, 'message' => 'Registrazione completata']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Errore database: ' . $e->getMessage()]);
}
?>