<?php
// adminCheckSession.php
// Called by adminDashboard.js on every page load.
// Returns admin session info if valid, else valid: false.

require_once __DIR__ . '/../config/config.php';
session_start();

header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['valid' => false]);
    exit;
}

echo json_encode([
    'valid' => true,
    'name'  => $_SESSION['admin_name']  ?? 'Admin',
    'badge' => $_SESSION['admin_badge'] ?? '',
]);