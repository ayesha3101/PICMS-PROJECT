<?php
// ══════════════════════════════════════════════
// shoWithdrawalAction.php
// SHO approves or rejects a citizen's withdrawal
// request.
//
// ┌─ WHY TRANSACTION? ─────────────────────────
// │ APPROVED path — four writes must all land:
// │  1. UPDATE withdrawal_requests SET status='Approved'
// │  2. UPDATE complaints SET status='Withdrawn'
// │     (trigger `after_status_update` auto-logs System entry)
// │  3. If an officer was assigned, decrement their
// │     active_caseload counter
// │  4. INSERT case_updates (SHO note)
// │
// │ If the complaint update (step 2) succeeds but
// │ the caseload decrement (step 3) fails, an officer
// │ would permanently show an inflated active_caseload.
// │ If the case_updates insert (step 4) fails, the
// │ timeline loses the SHO's approval note.
// │ The transaction ensures all four land together.
// │
// │ REJECTED path — two writes:
// │  1. UPDATE withdrawal_requests SET status='Rejected'
// │  2. UPDATE complaints SET status back to original
// │     (was set to 'Withdrawal Pending' by citizen —
// │      rejecting returns it to 'Investigation Ongoing'
// │      or 'Officer Assigned' as appropriate)
// │  3. INSERT case_updates (SHO note)
// │ Same atomicity argument applies.
// └────────────────────────────────────────────
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (empty($_SESSION['officer_id']) || ($_SESSION['role'] ?? '') !== 'officer' || (int)($_SESSION['role_id'] ?? 0) !== 2) {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid method.']);
    exit;
}

$input      = json_decode(file_get_contents('php://input'), true);
$request_id = (int)   ($input['request_id']     ?? 0);
$action     = trim($input['action']             ?? ''); // 'Approved' or 'Rejected'
$rej_note   = trim($input['rejection_note']     ?? '');
$sho_id     = (int) $_SESSION['officer_id'];
$station_id = (int) ($_SESSION['station_id'] ?? 0);
$sho_name   = $_SESSION['officer_name'] ?? 'SHO';

if (!$request_id || !in_array($action, ['Approved', 'Rejected'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    exit;
}

// Fetch the withdrawal request and verify it belongs to this station
$stmt = $conn->prepare("
    SELECT
        wr.request_id,
        wr.complaint_id,
        wr.status          AS wd_status,
        c.status           AS complaint_status,
        c.station_id,
        (SELECT ca.officer_id
         FROM   case_assignments ca
         WHERE  ca.complaint_id = wr.complaint_id AND ca.is_current = 1
         LIMIT  1) AS assigned_officer_id
    FROM   withdrawal_requests wr
    JOIN   complaints c ON wr.complaint_id = c.complaint_id
    WHERE  wr.request_id = ? AND c.station_id = ?
    LIMIT  1
");
$stmt->bind_param('ii', $request_id, $station_id);
$stmt->execute();
$wd = $stmt->get_result()->fetch_assoc();

if (!$wd) {
    echo json_encode(['success' => false, 'message' => 'Request not found at your station.']);
    exit;
}
if ($wd['wd_status'] !== 'Pending') {
    echo json_encode(['success' => false, 'message' => 'This request has already been actioned.']);
    exit;
}

$complaint_id      = (int) $wd['complaint_id'];
$assigned_officer  = $wd['assigned_officer_id'] ? (int)$wd['assigned_officer_id'] : null;

// ┌─ TRANSACTION START ─────────────────────────────────────────────────────
// │ Reason: Approving a withdrawal touches up to 4 tables (withdrawal_requests,
// │ complaints, officers caseload, case_updates). Rejecting touches 3.
// │ All writes must be atomic — partial updates would leave the DB inconsistent
// │ (e.g. request marked Approved but complaint still showing Withdrawal Pending).
// └─────────────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    if ($action === 'Approved') {
        // 1. Mark the withdrawal request as Approved
        $updWd = $conn->prepare("
            UPDATE withdrawal_requests
            SET    status = 'Approved', actioned_by = ?, actioned_at = NOW()
            WHERE  request_id = ?
        ");
        $updWd->bind_param('ii', $sho_id, $request_id);
        if (!$updWd->execute()) throw new Exception('Failed to approve withdrawal request: ' . $conn->error);

        // 2. Set complaint status to Withdrawn
        //    (trigger `after_status_update` fires → auto System entry)
        $updC = $conn->prepare("
            UPDATE complaints SET status = 'Withdrawn' WHERE complaint_id = ?
        ");
        $updC->bind_param('i', $complaint_id);
        if (!$updC->execute()) throw new Exception('Failed to update complaint status: ' . $conn->error);

        // 3. Decrement officer caseload if one was assigned
        if ($assigned_officer) {
            $updLoad = $conn->prepare("
                UPDATE officers
                SET    active_caseload = GREATEST(active_caseload - 1, 0)
                WHERE  officer_id = ?
            ");
            $updLoad->bind_param('i', $assigned_officer);
            if (!$updLoad->execute()) throw new Exception('Failed to update officer caseload: ' . $conn->error);
        }

        // 4. Log SHO's approval
        $note   = "Withdrawal request approved by SHO {$sho_name}. Case is now Withdrawn.";
        $insLog = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, 'Withdrawn', ?, ?)
        ");
        $insLog->bind_param('iss', $complaint_id, $note, $sho_name);
        if (!$insLog->execute()) throw new Exception('Failed to log withdrawal approval: ' . $conn->error);

    } else {
        // ── REJECTED path

        // 1. Mark the withdrawal request as Rejected
        $updWd = $conn->prepare("
            UPDATE withdrawal_requests
            SET    status = 'Rejected', rejection_note = ?, actioned_by = ?, actioned_at = NOW()
            WHERE  request_id = ?
        ");
        $updWd->bind_param('sii', $rej_note, $sho_id, $request_id);
        if (!$updWd->execute()) throw new Exception('Failed to reject withdrawal request: ' . $conn->error);

        // 2. Restore complaint to appropriate status
        //    If officer assigned → 'Investigation Ongoing'
        //    Otherwise → 'Accepted' (so SHO can still proceed)
        $restoreStatus = $assigned_officer ? 'Investigation Ongoing' : 'Accepted';
        $updC = $conn->prepare("
            UPDATE complaints SET status = ? WHERE complaint_id = ?
        ");
        $updC->bind_param('si', $restoreStatus, $complaint_id);
        if (!$updC->execute()) throw new Exception('Failed to restore complaint status: ' . $conn->error);

        // 3. Log SHO's rejection
        $noteDetail = $rej_note ? " Reason: {$rej_note}." : '';
        $note       = "Withdrawal request rejected by SHO {$sho_name}.{$noteDetail} Case restored to {$restoreStatus}.";
        $insLog     = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, ?, ?, ?)
        ");
        $insLog->bind_param('isss', $complaint_id, $restoreStatus, $note, $sho_name);
        if (!$insLog->execute()) throw new Exception('Failed to log withdrawal rejection: ' . $conn->error);
    }

    $conn->commit();
    // ─ TRANSACTION END (committed) ─

    echo json_encode(['success' => true, 'action' => $action]);

} catch (Exception $e) {
    $conn->rollback();
    // ─ TRANSACTION END (rolled back) ─
    error_log('shoWithdrawalAction: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error — changes were not saved.']);
}
