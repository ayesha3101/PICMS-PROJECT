<?php
// ══════════════════════════════════════════════
// shoDeleteScheduleSlot.php
// Deletes a manual sho_schedule slot.
// Safety rules:
//  - Cannot delete Appointment-type slots
//    (those are linked to appointments records
//     and must stay for referential integrity).
//  - Can only delete slots belonging to this SHO.
//
// No transaction needed here — it is a single
// DELETE on one row with no cascading side-effects
// on other business tables. The FK from appointments
// → sho_schedule means the DB itself will reject
// deleting an Appointment-type slot that is still
// referenced, so we guard at application level first
// to give a clear error message instead of a raw
// constraint error.
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

$input       = json_decode(file_get_contents('php://input'), true);
$schedule_id = (int) ($input['schedule_id'] ?? 0);
$officer_id  = (int) $_SESSION['officer_id'];

if (!$schedule_id) {
    echo json_encode(['success' => false, 'message' => 'schedule_id is required.']);
    exit;
}

// Fetch the slot and verify ownership
$stmt = $conn->prepare("
    SELECT schedule_id, slot_type, scheduled_date
    FROM   sho_schedule
    WHERE  schedule_id = ? AND officer_id = ?
    LIMIT  1
");
$stmt->bind_param('ii', $schedule_id, $officer_id);
$stmt->execute();
$slot = $stmt->get_result()->fetch_assoc();

if (!$slot) {
    echo json_encode(['success' => false, 'message' => 'Slot not found or does not belong to you.']);
    exit;
}

// Block deletion of Appointment-type slots
// (they are auto-created and linked to appointments table via FK)
if ($slot['slot_type'] === 'Appointment') {
    echo json_encode([
        'success' => false,
        'message' => 'Appointment slots are created automatically and cannot be manually deleted. Cancel the appointment instead.',
    ]);
    exit;
}

// Block deletion of past slots that are today or in the future
// to prevent accidental removal of active commitments
// (optional strictness — comment out if not required)
if ($slot['scheduled_date'] >= date('Y-m-d')) {
    // Allow it — SHO may need to remove a future Duty/Court/Leave slot
    // No restriction here; just noted for awareness.
}

// Single DELETE — no transaction needed (one row, no cascading business logic)
$del = $conn->prepare("
    DELETE FROM sho_schedule
    WHERE  schedule_id = ? AND officer_id = ? AND slot_type != 'Appointment'
");
$del->bind_param('ii', $schedule_id, $officer_id);

if (!$del->execute() || $conn->affected_rows < 1) {
    echo json_encode(['success' => false, 'message' => 'Failed to delete slot or slot already removed.']);
    exit;
}

echo json_encode(['success' => true]);
