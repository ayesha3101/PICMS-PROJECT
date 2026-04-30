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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$stationId = (int)($_SESSION['station_id'] ?? 0);
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$detaineeId = (int)($input['detainee_id'] ?? 0);

if (!$detaineeId) {
    echo json_encode(['success' => false, 'message' => 'Invalid detainee ID.']);
    exit;
}

$stmt = $conn->prepare("DELETE FROM detainees WHERE detainee_id = ? AND station_id = ?");
$stmt->bind_param('ii', $detaineeId, $stationId);
$stmt->execute();
$deleted = $stmt->affected_rows > 0;
$stmt->close();

if (!$deleted) {
    echo json_encode(['success' => false, 'message' => 'Detainee not found.']);
    exit;
}

echo json_encode(['success' => true]);
