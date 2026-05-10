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

try {
    $stmt = $conn->prepare("CALL sp_get_station_open_cases(?)");
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
    $stmt->bind_param('i', $stationId);
    if (!$stmt->execute()) throw new Exception("Query failed: " . $stmt->error);
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(['success' => true, 'cases' => $rows]);
} catch (Exception $e) {
    error_log('superintendentGetCases: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch cases. Please try again.',
        'error' => $e->getMessage()
    ]);
}
