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
$cellId = (int)($input['cell_id'] ?? 0);

if (!$detaineeId || !$cellId) {
    echo json_encode(['success' => false, 'message' => 'Detainee and cell are required.']);
    exit;
}

try {
    $proc = $conn->prepare("CALL sp_assign_detainee_cell(?, ?, ?)");
    if (!$proc) {
        throw new Exception('Unable to prepare assignment procedure.');
    }
    $officerId = (int)($_SESSION['officer_id'] ?? 0);
    $proc->bind_param('iii', $detaineeId, $cellId, $officerId);
    if (!$proc->execute()) {
        throw new Exception('Cell assignment failed.');
    }
    $proc->close();

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
