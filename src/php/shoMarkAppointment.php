<?php
// ══════════════════════════════════════════════
// shoMarkAppointment.php
// Marks a Confirmed appointment as Completed or Cancelled.
// On second cancellation → complaint auto-closed.
//
// ┌─ WHY TRANSACTION? ─────────────────────────
// │ COMPLETED path:
// │  • UPDATE appointments.status = 'Completed'
// │  • INSERT case_updates (log)
// │  Two writes — must both land or neither.
// │
// │ CANCELLED path (up to 2 strikes):
// │  Strike 1  (miss_count goes to 1):
// │   • UPDATE appointments.status = 'Cancelled'
// │   • UPDATE complaints.status = 'Accepted'
// │     (resets so SHO can reschedule)
// │   • INSERT case_updates (log)
// │   Three writes — atomic.
// │
// │  Strike 2  (miss_count goes to 2):
// │   • UPDATE appointments.status = 'Cancelled'
// │   • UPDATE complaints.status = 'Closed'
// │     (trigger also fires a System entry)
// │   • INSERT case_updates (SHO note — 2nd no-show)
// │   Three writes — atomic.
// │
// │ Without a transaction, a crash between writes
// │ could leave the complaint in Accepted status
// │ but the appointment still showing Confirmed,
// │ or the case closed without a log entry.
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

$input          = json_decode(file_get_contents('php://input'), true);
$appointment_id = (int)   ($input['appointment_id'] ?? 0);
$outcome        = trim($input['outcome']            ?? ''); // 'Completed' or 'Cancelled'
$officer_id     = (int) $_SESSION['officer_id'];
$sho_name       = $_SESSION['officer_name'] ?? 'SHO';

if (!$appointment_id || !in_array($outcome, ['Completed', 'Cancelled'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    exit;
}

// Fetch appointment and confirm it belongs to this SHO and is Confirmed
$stmtA = $conn->prepare("
    SELECT a.appointment_id, a.complaint_id, a.status, a.sho_id,
           c.station_id
    FROM   appointments a
    JOIN   complaints   c ON a.complaint_id = c.complaint_id
    WHERE  a.appointment_id = ? AND a.sho_id = ? AND a.status = 'Confirmed'
    LIMIT  1
");
$stmtA->bind_param('ii', $appointment_id, $officer_id);
$stmtA->execute();
$appt = $stmtA->get_result()->fetch_assoc();

if (!$appt) {
    echo json_encode(['success' => false, 'message' => 'Appointment not found or not in Confirmed status.']);
    exit;
}

$complaint_id = (int) $appt['complaint_id'];

// Count existing cancellations for this complaint (the miss count BEFORE this action)
$stmtM = $conn->prepare("
    SELECT COUNT(*) AS miss_count
    FROM   appointments
    WHERE  complaint_id = ? AND status = 'Cancelled'
");
$stmtM->bind_param('i', $complaint_id);
$stmtM->execute();
$missRow    = $stmtM->get_result()->fetch_assoc();
$miss_count = (int) ($missRow['miss_count'] ?? 0); // current count BEFORE this cancellation

// ┌─ TRANSACTION START ─────────────────────────────────────────────────────
// │ Reason: Two-to-three interdependent writes (appointment + complaint
// │ status + case log). Each outcome path needs atomic execution.
// └─────────────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    if ($outcome === 'Completed') {
        // ── Mark appointment completed
        $updA = $conn->prepare("
            UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?
        ");
        $updA->bind_param('i', $appointment_id);
        if (!$updA->execute()) throw new Exception('Failed to mark appointment completed.');

        // ── Log it
        $note   = "Citizen attended appointment. Marked completed by SHO {$sho_name}.";
        $insLog = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, 'Accepted', ?, ?)
        ");
        // status stays 'Accepted' until officer is assigned (which changes it to 'Officer Assigned')
        $curStatus = 'Accepted';
        $insLog->bind_param('iss', $complaint_id, $note, $sho_name);
        if (!$insLog->execute()) throw new Exception('Failed to log completion.');

    } else {
        // ── CANCELLED path
        $cancelReason = 'Citizen did not appear for scheduled appointment.';

        $updA = $conn->prepare("
            UPDATE appointments
            SET    status = 'Cancelled', cancellation_reason = ?
            WHERE  appointment_id = ?
        ");
        $updA->bind_param('si', $cancelReason, $appointment_id);
        if (!$updA->execute()) throw new Exception('Failed to cancel appointment.');

        $newMissCount = $miss_count + 1;

        if ($newMissCount >= 2) {
            // ── Strike 2: auto-close the case
            $updC = $conn->prepare("
                UPDATE complaints SET status = 'Closed' WHERE complaint_id = ?
            ");
            $updC->bind_param('i', $complaint_id);
            if (!$updC->execute()) throw new Exception('Failed to close complaint.');

            $note   = "Case automatically closed by system. Citizen failed to attend 2 scheduled appointments. SHO: {$sho_name}.";
            $logStatus = 'Closed';
        } else {
            // ── Strike 1: reset complaint to Accepted so SHO can reschedule
            $updC = $conn->prepare("
                UPDATE complaints SET status = 'Accepted' WHERE complaint_id = ?
            ");
            $updC->bind_param('i', $complaint_id);
            if (!$updC->execute()) throw new Exception('Failed to reset complaint status.');

            $note   = "Citizen did not appear for appointment (no-show #{$newMissCount}). SHO {$sho_name} can reschedule.";
            $logStatus = 'Accepted';
        }

        $insLog = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, ?, ?, ?)
        ");
        $insLog->bind_param('isss', $complaint_id, $logStatus, $note, $sho_name);
        if (!$insLog->execute()) throw new Exception('Failed to log cancellation.');
    }

    $conn->commit();
    // ─ TRANSACTION END (committed) ─

    echo json_encode(['success' => true, 'outcome' => $outcome]);

} catch (Exception $e) {
    $conn->rollback();
    // ─ TRANSACTION END (rolled back) ─
    error_log('shoMarkAppointment: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error — changes were not saved.']);
}
