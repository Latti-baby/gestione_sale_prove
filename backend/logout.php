<?php
// backend/api/logout.php
session_start();
session_destroy(); // Distrugge la sessione lato server
echo json_encode(['success' => true]);
?>