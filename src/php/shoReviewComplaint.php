<?php
// ══════════════════════════════════════════════
// shoReviewComplaint.php
// SHO accepts or rejects a Submitted complaint.
//
// ┌─ WHY TRANSACTION? ─────────────────────────
// │ Two writes must both succeed or both fail:
// │  1. UPDATE complaints SET status = 'Accepted'|'Rejected'
// │  2. INSERT case_updates (manual entry with SHO note)
// │
// │ The DB trigger `after_status_update` fires on
// │ the complaints UPDATE and inserts a System entry
// │ automatically. We ALSO insert a second, richer
// │ entry with the SHO's name and reason. If the
// │ complaint update succeeds but our case_updates
// │ insert fails, the timeline would be missing the
// │ SHO's note. Using a transaction guarantees both
// │ writes land together or neither does.
// └────────────────────────────────────────────
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer' || empty($_SESSION['is_sho'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid method.']);
    exit;
}

$input        = json_decode(file_get_contents('php://input'), true);
$complaint_id = (int) ($input['complaint_id'] ?? 0);
$action       = trim($input['action']         ?? ''); // 'accept' or 'reject'
$reason       = trim($input['reason']         ?? '');
$officer_id   = (int) $_SESSION['officer_id'];
$station_id   = (int) ($_SESSION['station_id'] ?? 0);
$sho_name     = $_SESSION['officer_name'] ?? 'SHO';

if (!$complaint_id || !in_array($action, ['accept', 'reject'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    exit;
}
if ($action === 'reject' && empty($reason)) {
    echo json_encode(['success' => false, 'message' => 'Rejection reason is required.']);
    exit;
}

// Verify complaint belongs to this station and is in 'Submitted' status
$chk = $conn->prepare("
    SELECT complaint_id FROM complaints
    WHERE  complaint_id = ? AND station_id = ? AND status = 'Submitted'
    LIMIT  1
");
$chk->bind_param('ii', $complaint_id, $station_id);
$chk->execute();
if (!$chk->get_result()->fetch_assoc()) {
    echo json_encode(['success' => false, 'message' => 'Complaint not found or already reviewed.']);
    exit;
}

$newStatus = $action === 'accept' ? 'Accepted' : 'Rejected';
$note      = $action === 'accept'
    ? "Complaint accepted by SHO {$sho_name}."
    : "Complaint rejected by SHO {$sho_name}. Reason: {$reason}";

// ┌─ TRANSACTION START ─────────────────────────────────────────────────────
// │ Reason: UPDATE complaints + INSERT case_updates must be atomic.
// │ If the network drops after the status change but before the update log
// │ is written, the timeline would miss the SHO's decision note.
// └─────────────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Update complaint status (trigger will also fire an auto System entry)
    $upd = $conn->prepare("
        UPDATE complaints
        SET    status = ?, rejection_reason = ?
        WHERE  complaint_id = ?
    ");
    $rejReason = $action === 'reject' ? $reason : null;
    $upd->bind_param('ssi', $newStatus, $rejReason, $complaint_id);
    if (!$upd->execute()) throw new Exception('Failed to update complaint status.');

    // 2. Insert SHO-authored case update (richer than the auto System entry)
    $ins = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
    ");
    $ins->bind_param('isss', $complaint_id, $newStatus, $note, $sho_name);
    if (!$ins->execute()) throw new Exception('Failed to insert case update.');

    $conn->commit();
    // ─ TRANSACTION END (committed) ─

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollback();
    // ─ TRANSACTION END (rolled back) ─
    error_log('shoReviewComplaint: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error — changes were not saved.']);
}
