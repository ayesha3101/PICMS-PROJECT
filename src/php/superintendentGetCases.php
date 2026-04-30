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

$stmt = $conn->prepare("CALL sp_get_station_open_cases(?)");
$stmt->bind_param('i', $stationId);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(['success' => true, 'cases' => $rows]);
