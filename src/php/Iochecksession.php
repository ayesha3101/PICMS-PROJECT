<?php
// ioCheckSession.php — Session guard for Investigating Officer
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    $_SESSION['role'] !== 'officer' ||
    (int)$_SESSION['role_id'] !== 1
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

echo json_encode([
    'success'      => true,
    'officer_id'   => $_SESSION['officer_id'],
    'officer_name' => $_SESSION['officer_name'],
    'badge_number' => $_SESSION['badge_number'],
    'rank'         => $_SESSION['rank'],
    'station_id'   => $_SESSION['station_id'],
]); 