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

$stationId = (int)($_SESSION['station_id'] ?? 0);

$stmt = $conn->prepare("
    SELECT
        hearing_id,
        hearing_date,
        hearing_time,
        hearing_type,
        court_name,
        result,
        next_hearing_date,
        detainee_id,
        detainee_name,
        reference_number
    FROM vw_hearing_calendar
    WHERE station_id = ?
    ORDER BY hearing_date DESC, hearing_time DESC
");
$stmt->bind_param('i', $stationId);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(['success' => true, 'hearings' => $rows]);
