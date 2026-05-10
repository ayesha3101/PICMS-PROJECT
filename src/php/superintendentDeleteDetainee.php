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
$officerId = (int)$_SESSION['officer_id'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$detaineeId = (int)($input['detainee_id'] ?? 0);

if (!$detaineeId) {
    echo json_encode(['success' => false, 'message' => 'Invalid detainee ID.']);
    exit;
}

// ────────────────────────────────────────────────────────────────
// ATOMIC TRANSACTION: Delete detainee + audit logging
// ────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // Verify detainee exists and belongs to this station
    $check = $conn->prepare("SELECT d_fname, d_lname, complaint_id FROM detainees WHERE detainee_id = ? AND station_id = ? LIMIT 1");
    if (!$check) throw new Exception("Prepare failed: " . $conn->error);
    $check->bind_param('ii', $detaineeId, $stationId);
    if (!$check->execute()) throw new Exception("Check failed: " . $check->error);
    $detainee = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$detainee) {
        throw new Exception("Detainee not found or unauthorized.");
    }

    $complaintId = $detainee['complaint_id'];

    // Delete the detainee
    $stmt = $conn->prepare("DELETE FROM detainees WHERE detainee_id = ? AND station_id = ?");
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
    $stmt->bind_param('ii', $detaineeId, $stationId);
    if (!$stmt->execute()) throw new Exception("Delete failed: " . $stmt->error);
    if ($stmt->affected_rows <= 0) throw new Exception("Failed to delete detainee.");
    $stmt->close();

    // Log deletion to audit trail if associated with a complaint
    if ($complaintId) {
        $logNote = "DELETE detainee: {$detainee['d_fname']} {$detainee['d_lname']}";
        $log = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, 'Detention', ?, 'System')
        ");
        if (!$log) throw new Exception("Prepare failed: " . $conn->error);
        $log->bind_param('is', $complaintId, $logNote);
        if (!$log->execute()) throw new Exception("Failed to log deletion: " . $log->error);
        $log->close();
    }

    // Commit both operations atomically
    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Detainee deleted successfully']);

} catch (Exception $e) {
    // Rollback if anything fails
    $conn->rollback();
    error_log('superintendentDeleteDetainee: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete detainee. Please try again.',
        'error' => $e->getMessage()
    ]);
}
