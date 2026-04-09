<?php
require_once '../Common/config.php';

try {
    // 1. Assicuriamoci che la colonna sia abbastanza larga (nessun troncamento)
    $pdo->exec("ALTER TABLE iscritti MODIFY password VARCHAR(255)");

    // 2. Cancelliamo il vecchio account admin buggato (se esiste)
    $stmtDel = $pdo->prepare("DELETE FROM iscritti WHERE email = 'admin@test.it'");
    $stmtDel->execute();

    // 3. Generiamo l'hash della password "123456" DIRETTAMENTE DAL TUO SERVER
    $passwordChiara = '123456';
    $hashSicuro = password_hash($passwordChiara, PASSWORD_DEFAULT);

    // 4. Inseriamo il nuovo Admin nel database
    $stmtIns = $pdo->prepare("INSERT INTO iscritti (nome, cognome, email, password, ruolo, foto, id_settore) VALUES (?, ?, ?, ?, ?, ?, ?)");
    // Nota: metto id_settore = 1 (Musica) per sicurezza
    $stmtIns->execute(['Super', 'Admin', 'admin@test.it', $hashSicuro, 'admin', 'default.png', 1]);

    // 5. TEST di verifica immediato
    $stmtTest = $pdo->prepare("SELECT password FROM iscritti WHERE email = 'admin@test.it'");
    $stmtTest->execute();
    $user = $stmtTest->fetch(PDO::FETCH_ASSOC);

    echo "<div style='font-family: sans-serif; padding: 20px;'>";
    echo "<h2 style='color: green;'>✅ Account Admin ricreato con successo!</h2>";
    echo "<p>L'hash generato e salvato nel tuo DB è: <code>" . htmlspecialchars($user['password']) . "</code></p>";
    
    // Testiamo la password verificandola al volo
    if (password_verify('123456', $user['password'])) {
        echo "<h3 style='color:green;'>✅ TEST POSITIVO: La password '123456' ora viene riconosciuta perfettamente!</h3>";
        echo "<a href='../index.php' style='display:inline-block; margin-top:20px; padding:10px 20px; background:blue; color:white; text-decoration:none; border-radius:5px;'>👉 Torna al Login</a>";
    } else {
        echo "<h3 style='color:red;'>❌ Errore sconosciuto: la decrittografia fallisce ancora.</h3>";
    }
    echo "</div>";

} catch (PDOException $e) {
    echo "Errore Database: " . $e->getMessage();
}
?>