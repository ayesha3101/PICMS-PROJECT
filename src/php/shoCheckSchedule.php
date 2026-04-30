<?php
// ══════════════════════════════════════════════
// shoCheckSchedule.php
// Checks whether a proposed date/time slot
// overlaps any existing sho_schedule entry
// for this officer. Called live from JS as the
// SHO types in appointment or schedule forms.
// No transaction — read-only check.
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
$date       = trim($input['date']       ?? '');
$start_time = trim($input['start_time'] ?? '');
$end_time   = trim($input['end_time']   ?? '');
$exclude_id = (int) ($input['exclude_id'] ?? 0); // for edit mode — skip self
$officer_id = (int) $_SESSION['officer_id'];

if (!$date || !$start_time || !$end_time) {
    echo json_encode(['conflict' => false]);
    exit;
}

// Overlap condition: existing slot's start < new end AND existing slot's end > new start
// i.e., they share any portion of the time range on the same date
if ($exclude_id) {
    $stmt = $conn->prepare("
        SELECT schedule_id, slot_type, notes, start_time, end_time
        FROM   sho_schedule
        WHERE  officer_id     = ?
          AND  scheduled_date = ?
          AND  start_time     < ?
          AND  end_time       > ?
          AND  schedule_id   != ?
        LIMIT  1
    ");
    $stmt->bind_param('isssi', $officer_id, $date, $end_time, $start_time, $exclude_id);
} else {
    $stmt = $conn->prepare("
        SELECT schedule_id, slot_type, notes, start_time, end_time
        FROM   sho_schedule
        WHERE  officer_id     = ?
          AND  scheduled_date = ?
          AND  start_time     < ?
          AND  end_time       > ?
        LIMIT  1
    ");
    $stmt->bind_param('isss', $officer_id, $date, $end_time, $start_time);
}

$stmt->execute();
$conflict = $stmt->get_result()->fetch_assoc();

if ($conflict) {
    $label = $conflict['slot_type'];
    if ($conflict['notes']) $label .= ': ' . $conflict['notes'];
    $label .= ' (' . substr($conflict['start_time'],0,5) . '–' . substr($conflict['end_time'],0,5) . ')';
    echo json_encode(['conflict' => true, 'conflict_note' => $label]);
} else {
    echo json_encode(['conflict' => false]);
}
