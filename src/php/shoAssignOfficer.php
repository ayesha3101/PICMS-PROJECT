<?php
// ══════════════════════════════════════════════
// shoAssignOfficer.php
// Assigns (or reassigns) an investigating officer
// to a complaint. Only allowed after at least one
// completed appointment exists.
//
// ┌─ WHY TRANSACTION? ─────────────────────────
// │ Assignment involves up to five coordinated writes:
// │  1. INSERT case_assignments (trigger retires old one)
// │     ↳ trigger `before_case_reassign` fires — it sets
// │       the previous row's is_current = 0. This means
// │       the trigger + our INSERT are part of one logical
// │       unit. If our subsequent writes fail, we'd have
// │       a retired assignment with no replacement.
// │  2. UPDATE complaints SET status = 'Officer Assigned'
// │     (trigger `after_status_update` auto-logs System entry)
// │  3. UPDATE officers SET active_caseload = active_caseload + 1
// │     (for the newly assigned officer)
// │  4. UPDATE officers SET active_caseload = active_caseload - 1
// │     (for the previously assigned officer, if reassigning)
// │  5. INSERT case_updates (SHO-authored log note)
// │
// │ Without a transaction: if the network drops after
// │ step 1 but before step 3, the new officer's caseload
// │ counter would be wrong. If step 2 fails, the complaint
// │ would show the wrong status. All five writes are
// │ rolled back together if any step fails.
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
$new_officer_id = (int) ($input['officer_id'] ?? 0);
$sho_id       = (int) $_SESSION['officer_id'];
$station_id   = (int) ($_SESSION['station_id'] ?? 0);
$sho_name     = $_SESSION['officer_name'] ?? 'SHO';

if (!$complaint_id || !$new_officer_id) {
    echo json_encode(['success' => false, 'message' => 'complaint_id and officer_id are required.']);
    exit;
}

// Verify complaint belongs to this station
$chkC = $conn->prepare("
    SELECT complaint_id, status FROM complaints
    WHERE  complaint_id = ? AND station_id = ?
    LIMIT  1
");
$chkC->bind_param('ii', $complaint_id, $station_id);
$chkC->execute();
$complaint = $chkC->get_result()->fetch_assoc();
if (!$complaint) {
    echo json_encode(['success' => false, 'message' => 'Complaint not found at your station.']);
    exit;
}

// Enforce: must have at least one Completed appointment before assignment
$chkAppt = $conn->prepare("
    SELECT COUNT(*) AS cnt FROM appointments
    WHERE  complaint_id = ? AND status = 'Completed'
");
$chkAppt->bind_param('i', $complaint_id);
$chkAppt->execute();
$apptRow = $chkAppt->get_result()->fetch_assoc();
if ((int)($apptRow['cnt'] ?? 0) < 1) {
    echo json_encode(['success' => false, 'message' => 'Cannot assign officer until the appointment has been marked completed.']);
    exit;
}

// Verify new officer belongs to same station and is active, and is Investigating Officer (role_id=1)
$chkO = $conn->prepare("
    SELECT officer_id, full_name FROM officers
    WHERE  officer_id = ? AND station_id = ? AND is_active = 1 AND role_id = 1
    LIMIT  1
");
$chkO->bind_param('ii', $new_officer_id, $station_id);
$chkO->execute();
$newOfficer = $chkO->get_result()->fetch_assoc();
if (!$newOfficer) {
    echo json_encode(['success' => false, 'message' => 'Officer not found, inactive, or not an Investigating Officer at your station.']);
    exit;
}

// Get currently assigned officer (if any) for caseload decrement
$stmtPrev = $conn->prepare("
    SELECT officer_id FROM case_assignments
    WHERE  complaint_id = ? AND is_current = 1
    LIMIT  1
");
$stmtPrev->bind_param('i', $complaint_id);
$stmtPrev->execute();
$prevAssignment = $stmtPrev->get_result()->fetch_assoc();
$prev_officer_id = $prevAssignment ? (int)$prevAssignment['officer_id'] : null;

if ($prev_officer_id === $new_officer_id) {
    echo json_encode(['success' => false, 'message' => 'This officer is already assigned. Select a different officer to reassign.']);
    exit;
}

$isReassign  = $prev_officer_id !== null;
$newStatus   = 'Officer Assigned';
$note        = $isReassign
    ? "Case reassigned to officer {$newOfficer['full_name']} by SHO {$sho_name}."
    : "Investigating officer {$newOfficer['full_name']} assigned by SHO {$sho_name}.";

// ┌─ TRANSACTION START ─────────────────────────────────────────────────────
// │ Reason: Up to five interdependent writes (assignment record, complaint
// │ status, two caseload counters, case log). Atomicity ensures the officer
// │ caseloads and complaint status always stay consistent even if a write
// │ fails mid-way.
// └─────────────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Insert new case_assignment
    //    Trigger `before_case_reassign` fires automatically and retires
    //    the previous assignment row (sets is_current=0, removed_at=NOW()).
    $insA = $conn->prepare("
        INSERT INTO case_assignments (complaint_id, officer_id, assigned_by)
        VALUES (?, ?, ?)
    ");
    $insA->bind_param('iii', $complaint_id, $new_officer_id, $sho_id);
    if (!$insA->execute()) throw new Exception('Failed to create assignment: ' . $conn->error);

    // 2. Update complaint status
    //    Trigger `after_status_update` fires — inserts a System case_update entry.
    $updC = $conn->prepare("
        UPDATE complaints SET status = ? WHERE complaint_id = ?
    ");
    $updC->bind_param('si', $newStatus, $complaint_id);
    if (!$updC->execute()) throw new Exception('Failed to update complaint status: ' . $conn->error);

    // 3. Increment new officer's active_caseload
    $updNewLoad = $conn->prepare("
        UPDATE officers SET active_caseload = active_caseload + 1 WHERE officer_id = ?
    ");
    $updNewLoad->bind_param('i', $new_officer_id);
    if (!$updNewLoad->execute()) throw new Exception('Failed to update new officer caseload: ' . $conn->error);

    // 4. Decrement previous officer's active_caseload (only if reassigning)
    if ($prev_officer_id) {
        $updPrevLoad = $conn->prepare("
            UPDATE officers
            SET    active_caseload = GREATEST(active_caseload - 1, 0)
            WHERE  officer_id = ?
        ");
        $updPrevLoad->bind_param('i', $prev_officer_id);
        if (!$updPrevLoad->execute()) throw new Exception('Failed to update previous officer caseload: ' . $conn->error);
    }

    // 5. Insert SHO-authored case update log
    $insLog = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
    ");
    $insLog->bind_param('isss', $complaint_id, $newStatus, $note, $sho_name);
    if (!$insLog->execute()) throw new Exception('Failed to log case update: ' . $conn->error);

    $conn->commit();
    // ─ TRANSACTION END (committed) ─

    echo json_encode(['success' => true, 'officer_name' => $newOfficer['full_name']]);

} catch (Exception $e) {
    $conn->rollback();
    // ─ TRANSACTION END (rolled back) ─
    error_log('shoAssignOfficer: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error — assignment was not saved.']);
}
