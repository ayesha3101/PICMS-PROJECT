<?php
// ══════════════════════════════════════════════
// checkSession.php
// Job: return current citizen session data as JSON
//      called by dashboard JS on page load
//      if not logged in, JS redirects to login
// ══════════════════════════════════════════════
session_start();
header('Content-Type: application/json');

// ── Check all required session keys exist and are valid
if (
    empty($_SESSION['logged_in'])      ||
    $_SESSION['logged_in'] !== true    ||
    empty($_SESSION['citizen_cnic'])
) {
    echo json_encode(['logged_in' => false]);
    exit;
}

// ── Session valid — return citizen info for nav display
echo json_encode([
    'logged_in' => true,
    'name'      => $_SESSION['citizen_name']  ?? 'Citizen',
    'email'     => $_SESSION['citizen_email'] ?? '',
    'cnic'      => $_SESSION['citizen_cnic'],
]);
?>