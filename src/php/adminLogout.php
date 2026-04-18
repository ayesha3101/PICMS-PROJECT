<?php
// adminLogout.php
// Destroys admin session and redirects to login.

session_start();
session_unset();
session_destroy();

header('Content-Type: application/json');
echo json_encode(['success' => true]);