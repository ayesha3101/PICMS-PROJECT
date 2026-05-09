<?php
// ioCaseUpdate.php — IO submits a case update.
// Enforces: case must be assigned to this IO AND at their station.
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input       = json_decode(file_get_contents('php://input'), true);
$complaintId = (int)($input['complaint_id'] ?? 0);
$status      = trim($input['status']        ?? '');
$note        = trim($input['note']          ?? '');
$officerId   = (int)$_SESSION['officer_id'];
$stationId   = (int)($_SESSION['station_id'] ?? 0);
$officerName = $_SESSION['officer_name'] ?? 'Investigating Officer';

if (!$complaintId || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'Case ID and status are required.']);
    exit;
}

$allowed = ['Investigation Ongoing', 'Resolved'];
if (!in_array($status, $allowed, true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status.']);
    exit;
}

if (!$stationId) {
    echo json_encode(['success' => false, 'message' => 'No station assigned to your account.']);
    exit;
}

// Verify: assigned to this IO AND at their station
$check = $conn->prepare("
    SELECT COUNT(*) AS cnt
    FROM case_assignments ca
    JOIN complaints c ON ca.complaint_id = c.complaint_id
    WHERE ca.complaint_id = ?
      AND ca.officer_id   = ?
      AND ca.is_current   = 1
      AND c.station_id    = ?
");
$check->bind_param('iii', $complaintId, $officerId, $stationId);
$check->execute();
$cnt = (int)$check->get_result()->fetch_assoc()['cnt'];
$check->close();

if (!$cnt) {
    echo json_encode(['success' => false, 'message' => 'Case not found or access denied.']);
    exit;
}

// Check: don't allow re-resolving an already resolved/closed case
$statusCheck = $conn->prepare("SELECT status FROM complaints WHERE complaint_id = ? LIMIT 1");
$statusCheck->bind_param('i', $complaintId);
$statusCheck->execute();
$currentStatus = $statusCheck->get_result()->fetch_assoc()['status'] ?? '';
$statusCheck->close();

if (in_array($currentStatus, ['Resolved', 'Closed'], true)) {
    echo json_encode(['success' => false, 'message' => 'This case is already resolved or closed.']);
    exit;
}

if (!in_array($currentStatus, ['Officer Assigned', 'Investigation Ongoing'], true)) {
    echo json_encode(['success' => false, 'message' => 'Case is not in a valid state for IO updates.']);
    exit;
}

// ────────────────────────────────────────────────────────────────
// ATOMIC TRANSACTION: Both operations must succeed or both rollback
// ────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Update complaint status
    $upd = $conn->prepare("UPDATE complaints SET status = ? WHERE complaint_id = ?");
    if (!$upd) throw new Exception("Prepare failed: " . $conn->error);
    $upd->bind_param('si', $status, $complaintId);
    if (!$upd->execute()) throw new Exception("Failed to update complaint status: " . $upd->error);
    $upd->close();

    // 2. Insert into case_updates (audit log)
    $stmt = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
    ");
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
    $stmt->bind_param('isss', $complaintId, $status, $note, $officerName);
    if (!$stmt->execute()) throw new Exception("Failed to log case update: " . $stmt->error);
    $stmt->close();

    // Commit both operations atomically
    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Case updated successfully.']);

} catch (Exception $e) {
    // Rollback if anything fails
    $conn->rollback();
    error_log('ioCaseUpdate: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update case. Please try again.',
        'error' => $e->getMessage()
    ]);
}