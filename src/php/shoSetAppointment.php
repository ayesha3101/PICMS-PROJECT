<?php
// ══════════════════════════════════════════════
// shoSetAppointment.php
// Creates a new appointment for an Accepted complaint.
// Steps: insert sho_schedule slot → insert appointment
//        → keep complaint in Accepted state
//        → insert case_update log entry
//
// ┌─ WHY TRANSACTION? ─────────────────────────
// │ Three tables touched in sequence:
// │  1. INSERT sho_schedule (create the time slot)
// │  2. INSERT appointments (link complaint to slot)
// │  3. INSERT case_updates (log the action)
// │
// │ If any step fails (e.g. the trigger detects a
// │ conflict mid-insert, or the network dies), we
// │ do NOT want a dangling schedule slot with no
// │ matching appointment or a missing case log.
// │ All three writes are
// │ rolled back together if anything goes wrong.
// └────────────────────────────────────────────
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/appointmentLifecycle.php';
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
$complaint_id = (int)   ($input['complaint_id'] ?? 0);
$date         = trim($input['date']             ?? '');
$start_time   = trim($input['start_time']       ?? '');
$end_time     = trim($input['end_time']         ?? '');
$location     = trim($input['location']         ?? '');
$officer_id   = (int) $_SESSION['officer_id'];
$station_id   = (int) ($_SESSION['station_id'] ?? 0);
$sho_name     = $_SESSION['officer_name'] ?? 'SHO';

if (!$complaint_id || !$date || !$start_time || !$end_time || !$location) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}
if ($start_time >= $end_time) {
    echo json_encode(['success' => false, 'message' => 'End time must be after start time.']);
    exit;
}
if ($date <= date('Y-m-d')) {
    echo json_encode(['success' => false, 'message' => 'Appointment must be scheduled for a future date.']);
    exit;
}

syncExpiredPendingAppointments($conn, ['station_id' => $station_id, 'complaint_id' => $complaint_id]);

// Verify complaint is Accepted and belongs to this station
$chk = $conn->prepare("
    SELECT complaint_id FROM complaints
    WHERE  complaint_id = ? AND station_id = ? AND status = 'Accepted'
    LIMIT  1
");
$chk->bind_param('ii', $complaint_id, $station_id);
$chk->execute();
if (!$chk->get_result()->fetch_assoc()) {
    echo json_encode(['success' => false, 'message' => 'Complaint not found or not in Accepted status.']);
    exit;
}

// Pre-check schedule conflict before starting transaction
$conflictChk = $conn->prepare("
    SELECT schedule_id FROM sho_schedule
    WHERE  officer_id     = ?
      AND  scheduled_date = ?
      AND  start_time     < ?
      AND  end_time       > ?
    LIMIT  1
");
$conflictChk->bind_param('isss', $officer_id, $date, $end_time, $start_time);
$conflictChk->execute();
if ($conflictChk->get_result()->fetch_assoc()) {
    echo json_encode(['success' => false, 'message' => 'Schedule conflict — please choose a different time slot.']);
    exit;
}

// ┌─ TRANSACTION START ─────────────────────────────────────────────────────
// │ Reason: Three interdependent writes across sho_schedule, appointments,
// │ and case_updates. If any single write fails (including the
// │ DB trigger's conflict check on sho_schedule), the whole appointment is
// │ rolled back — no orphaned records and no partial appointment creation.
// └─────────────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Insert the schedule slot (trigger `before_sho_schedule_insert`
    //    will throw if there's still an overlap — catches race conditions)
    $insSlot = $conn->prepare("
        INSERT INTO sho_schedule (officer_id, scheduled_date, start_time, end_time, slot_type, notes)
        VALUES (?, ?, ?, ?, 'Appointment', ?)
    ");
    $slotNote = "Appointment for case: {$location}";
    $insSlot->bind_param('issss', $officer_id, $date, $start_time, $end_time, $slotNote);
    if (!$insSlot->execute()) throw new Exception('Failed to create schedule slot: ' . $conn->error);

    $schedule_id = $conn->insert_id;

    // 2. Insert the appointment record
    $insAppt = $conn->prepare("
        INSERT INTO appointments (complaint_id, sho_id, schedule_id, location, status)
        VALUES (?, ?, ?, ?, 'Pending')
    ");
    $insAppt->bind_param('iiis', $complaint_id, $officer_id, $schedule_id, $location);
    if (!$insAppt->execute()) throw new Exception('Failed to create appointment: ' . $conn->error);

    // 3. Insert SHO-authored case update log
    $note   = "Appointment scheduled by SHO {$sho_name} on {$date} at {$start_time}. Location: {$location}. Citizen must accept it before the scheduled time.";
    $insLog = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, 'Accepted', ?, ?)
    ");
    $insLog->bind_param('iss', $complaint_id, $note, $sho_name);
    if (!$insLog->execute()) throw new Exception('Failed to log case update: ' . $conn->error);

    $conn->commit();
    // ─ TRANSACTION END (committed) ─

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollback();
    // ─ TRANSACTION END (rolled back) ─
    // Check if the trigger fired a conflict error (SQLSTATE 45000)
    if (strpos($e->getMessage(), 'Schedule conflict') !== false) {
        echo json_encode(['success' => false, 'message' => 'Schedule conflict detected — time slot already booked.']);
    } else {
        error_log('shoSetAppointment: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Server error — appointment was not saved.']);
    }
}
