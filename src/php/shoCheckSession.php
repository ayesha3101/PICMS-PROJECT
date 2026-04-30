<?php
// ══════════════════════════════════════════════
// shoCheckSession.php
// Returns SHO session info. Guards all SHO pages.
// Authorization is role-based: officers.role_id = 2 (SHO).
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    ($_SESSION['role'] ?? '') !== 'officer' ||
    (int)($_SESSION['role_id'] ?? 0) !== 2
) {
    echo json_encode(['valid' => false]);
    exit;
}

// Pull station name for UI display
$stmt = $conn->prepare("
    SELECT s.station_name
    FROM   officers o
    LEFT   JOIN stations s ON o.station_id = s.station_id
    WHERE  o.officer_id = ?
    LIMIT  1
");
$stmt->bind_param('i', $_SESSION['officer_id']);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

echo json_encode([
    'valid'        => true,
    'officer_id'   => $_SESSION['officer_id'],
    'name'         => $_SESSION['officer_name']  ?? 'SHO',
    'badge'        => $_SESSION['badge_number']  ?? '',
    'rank'         => $_SESSION['rank']          ?? '',
    'station_id'   => $_SESSION['station_id']    ?? null,
    'station_name' => $row['station_name']        ?? '',
    'email'        => $_SESSION['officer_email'] ?? '',
]);
