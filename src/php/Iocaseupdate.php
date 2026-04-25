<?php
// ioCaseUpdate.php — IO submits a case update
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
$officerName = $_SESSION['officer_name'] ?? 'Investigating Officer';

if (!$complaintId || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'Case ID and status are required.']);
    exit;
}

$allowed = ['Investigation Ongoing', 'Resolved'];
if (!in_array($status, $allowed)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status.']);
    exit;
}

// Verify this case belongs to this IO
$check = $conn->prepare("
    SELECT COUNT(*) AS cnt FROM case_assignments
    WHERE complaint_id = ? AND officer_id = ? AND is_current = 1
");
$check->bind_param('ii', $complaintId, $officerId);
$check->execute();
$cnt = (int)$check->get_result()->fetch_assoc()['cnt'];
$check->close();

if (!$cnt) {
    echo json_encode(['success' => false, 'message' => 'Case not found or not assigned to you.']);
    exit;
}

// Insert into case_updates
$stmt = $conn->prepare("
    INSERT INTO case_updates (complaint_id, status, note, updated_by)
    VALUES (?, ?, ?, ?)
");
$stmt->bind_param('isss', $complaintId, $status, $note, $officerName);
$stmt->execute();
$stmt->close();

// Update complaint status
$upd = $conn->prepare("UPDATE complaints SET status = ? WHERE complaint_id = ?");
$upd->bind_param('si', $status, $complaintId);
$upd->execute();
$upd->close();

echo json_encode(['success' => true, 'message' => 'Case updated successfully.']);