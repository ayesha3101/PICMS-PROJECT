<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    ($_SESSION['role'] ?? '') !== 'officer' ||
    (int)($_SESSION['role_id'] ?? 0) !== 3
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$officerId = (int)$_SESSION['officer_id'];

$stmt = $conn->prepare("
    SELECT
        o.full_name,
        o.badge_number,
        o.email,
        o.rank,
        COALESCE(s.station_name, 'Unassigned') AS station_name
    FROM officers o
    LEFT JOIN stations s ON s.station_id = o.station_id
    WHERE o.officer_id = ?
    LIMIT 1
");
$stmt->bind_param('i', $officerId);
$stmt->execute();
$profile = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$profile) {
    echo json_encode(['success' => false, 'message' => 'Officer not found.']);
    exit;
}

echo json_encode(['success' => true, 'profile' => $profile]);
