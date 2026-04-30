<?php
// ══════════════════════════════════════════════
// shoGetSchedule.php
// Returns all sho_schedule rows for the logged-in
// SHO — both manually-created slots (Duty, Court,
// Leave, Other) and auto-created Appointment slots.
// No transaction — read-only.
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (empty($_SESSION['officer_id']) || ($_SESSION['role'] ?? '') !== 'officer' || (int)($_SESSION['role_id'] ?? 0) !== 2) {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

$officer_id = (int) $_SESSION['officer_id'];

$stmt = $conn->prepare("
    SELECT
        s.schedule_id,
        s.officer_id,
        s.scheduled_date,
        s.start_time,
        s.end_time,
        s.slot_type,
        s.notes,
        s.created_at,
        -- If this slot is linked to an appointment, surface the case ref
        (SELECT c.reference_number
         FROM   appointments a
         JOIN   complaints   c ON a.complaint_id = c.complaint_id
         WHERE  a.schedule_id = s.schedule_id
         LIMIT  1) AS linked_case_ref
    FROM   sho_schedule s
    WHERE  s.officer_id = ?
    ORDER  BY s.scheduled_date DESC, s.start_time ASC
");
$stmt->bind_param('i', $officer_id);
$stmt->execute();
$slots = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($slots as &$s) {
    $s['schedule_id'] = (int) $s['schedule_id'];
    $s['officer_id']  = (int) $s['officer_id'];
}
unset($s);

echo json_encode(['success' => true, 'slots' => $slots]);
