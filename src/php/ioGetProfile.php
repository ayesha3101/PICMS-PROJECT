<?php
// ioGetProfile.php — IO profile + station name
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

$officerId = (int)$_SESSION['officer_id'];

$stmt = $conn->prepare("
    SELECT
        o.full_name,
        o.badge_number,
        o.email,
        o.rank,
        o.active_caseload,
        COALESCE(s.station_name, 'Unassigned') AS station_name,
        COALESCE(s.area_covered, '—')           AS area_covered
    FROM officers o
    LEFT JOIN stations s ON o.station_id = s.station_id
    WHERE o.officer_id = ?
    LIMIT 1
");
$stmt->bind_param('i', $officerId);
$stmt->execute();
$officer = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$officer) {
    echo json_encode(['success' => false, 'message' => 'Officer not found.']);
    exit;
}

echo json_encode([
    'success'        => true,
    'full_name'      => $officer['full_name'],
    'badge_number'   => $officer['badge_number'],
    'email'          => $officer['email'],
    'rank'           => $officer['rank'],
    'active_caseload'=> $officer['active_caseload'],
    'station_name'   => $officer['station_name'],
    'area_covered'   => $officer['area_covered'],
]);