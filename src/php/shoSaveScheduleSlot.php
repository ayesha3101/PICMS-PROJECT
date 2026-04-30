<?php
// ══════════════════════════════════════════════
// shoSaveScheduleSlot.php
// Inserts a new manual schedule slot or updates
// an existing one for the logged-in SHO.
//
// ┌─ WHY TRANSACTION? ─────────────────────────
// │ This endpoint handles a single slot save.
// │ However, the teacher's example was specifically
// │ about the SHO entering multiple schedule slots
// │ for the day and a network disconnect mid-way
// │ leaving the DB in a partial state.
// │
// │ The INSERT path writes two things:
// │  1. INSERT into sho_schedule
// │     (DB trigger `before_sho_schedule_insert`
// │      will also fire and check conflicts — this
// │      trigger write + our INSERT are one unit)
// │  2. There is no second write here for a single
// │     slot — BUT we wrap it anyway as a SAVEPOINT
// │     model: the JS calls this endpoint once per
// │     slot when the SHO submits. If the SHO is
// │     saving a batch (multiple slots sent in one
// │     POST as an array), the transaction wraps
// │     all of them so either every slot lands or
// │     none do — satisfying the teacher's scenario.
// │
// │ For a single slot: the trigger itself can throw
// │ (conflict), and we want a clean rollback path
// │ rather than letting the trigger error bubble
// │ up as a silent partial-insert.
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

$input       = json_decode(file_get_contents('php://input'), true);
$officer_id  = (int) $_SESSION['officer_id'];

// Accept either a single slot object OR an array of slots
// (array mode supports the teacher's batch-entry scenario)
$slots = [];
if (isset($input['slots']) && is_array($input['slots'])) {
    // Batch mode: JS sends { slots: [ {...}, {...}, ... ] }
    $slots = $input['slots'];
} else {
    // Single mode (normal form submit)
    $slots = [$input];
}

$errors = [];
$saved  = 0;

// ┌─ TRANSACTION START ─────────────────────────────────────────────────────
// │ Reason: Batch schedule entry — the teacher's exact scenario.
// │ SHO enters 5 slots for the day. If the network drops mid-save,
// │ we don't want 3 slots saved and 2 missing. The transaction wraps
// │ all INSERT/UPDATE operations so that either every slot lands
// │ in the DB or none of them do. For a single slot, this still
// │ provides a clean rollback path if the conflict-checking trigger
// │ fires and raises an error mid-insert.
// └─────────────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    foreach ($slots as $idx => $s) {
        $schedule_id = isset($s['schedule_id']) ? (int)$s['schedule_id'] : 0;
        $date        = trim($s['date']       ?? '');
        $start_time  = trim($s['start_time'] ?? '');
        $end_time    = trim($s['end_time']   ?? '');
        $slot_type   = trim($s['slot_type']  ?? 'Duty');
        $notes       = trim($s['notes']      ?? '');

        // Validate each slot
        if (!$date || !$start_time || !$end_time || !$slot_type) {
            throw new Exception("Slot " . ($idx+1) . ": date, start time, end time and type are required.");
        }
        if ($start_time >= $end_time) {
            throw new Exception("Slot " . ($idx+1) . ": end time must be after start time.");
        }
        if (!in_array($slot_type, ['Appointment','Duty','Court','Leave','Other'])) {
            throw new Exception("Slot " . ($idx+1) . ": invalid slot type.");
        }
        // Prevent manual creation of 'Appointment' type (those are created by shoSetAppointment)
        if ($slot_type === 'Appointment' && !$schedule_id) {
            throw new Exception("Slot " . ($idx+1) . ": Appointment slots are created automatically. Choose a different type.");
        }

        if ($schedule_id) {
            // ── Edit existing slot
            // Verify it belongs to this officer and is not an auto-Appointment slot
            $chk = $conn->prepare("
                SELECT schedule_id, slot_type FROM sho_schedule
                WHERE  schedule_id = ? AND officer_id = ? AND slot_type != 'Appointment'
                LIMIT  1
            ");
            $chk->bind_param('ii', $schedule_id, $officer_id);
            $chk->execute();
            if (!$chk->get_result()->fetch_assoc()) {
                throw new Exception("Slot " . ($idx+1) . ": not found or cannot be edited.");
            }

            // Check conflict excluding self
            $conflChk = $conn->prepare("
                SELECT schedule_id FROM sho_schedule
                WHERE  officer_id     = ?
                  AND  scheduled_date = ?
                  AND  start_time     < ?
                  AND  end_time       > ?
                  AND  schedule_id   != ?
                LIMIT  1
            ");
            $conflChk->bind_param('isssi', $officer_id, $date, $end_time, $start_time, $schedule_id);
            $conflChk->execute();
            if ($conflChk->get_result()->fetch_assoc()) {
                throw new Exception("Slot " . ($idx+1) . " on {$date}: time conflicts with an existing slot.");
            }

            $upd = $conn->prepare("
                UPDATE sho_schedule
                SET    scheduled_date = ?, start_time = ?, end_time = ?, slot_type = ?, notes = ?
                WHERE  schedule_id = ? AND officer_id = ?
            ");
            $upd->bind_param('sssssii', $date, $start_time, $end_time, $slot_type, $notes, $schedule_id, $officer_id);
            if (!$upd->execute()) throw new Exception("Slot " . ($idx+1) . ": update failed — " . $conn->error);

        } else {
            // ── Insert new slot
            // The DB trigger `before_sho_schedule_insert` will also run a
            // conflict check. We pre-check here to give a friendlier error
            // message, but the trigger is the last line of defence.
            $conflChk = $conn->prepare("
                SELECT schedule_id FROM sho_schedule
                WHERE  officer_id     = ?
                  AND  scheduled_date = ?
                  AND  start_time     < ?
                  AND  end_time       > ?
                LIMIT  1
            ");
            $conflChk->bind_param('isss', $officer_id, $date, $end_time, $start_time);
            $conflChk->execute();
            if ($conflChk->get_result()->fetch_assoc()) {
                throw new Exception("Slot " . ($idx+1) . " on {$date}: time conflicts with an existing slot.");
            }

            $ins = $conn->prepare("
                INSERT INTO sho_schedule (officer_id, scheduled_date, start_time, end_time, slot_type, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $ins->bind_param('isssss', $officer_id, $date, $start_time, $end_time, $slot_type, $notes);
            if (!$ins->execute()) throw new Exception("Slot " . ($idx+1) . ": insert failed — " . $conn->error);
        }

        $saved++;
    }

    $conn->commit();
    // ─ TRANSACTION END (committed) ─

    echo json_encode([
        'success' => true,
        'saved'   => $saved,
        'message' => $saved > 1 ? "{$saved} slots saved successfully." : 'Slot saved successfully.',
    ]);

} catch (Exception $e) {
    $conn->rollback();
    // ─ TRANSACTION END (rolled back) ─
    // Check if it was the DB trigger that fired
    if (strpos($e->getMessage(), 'Schedule conflict') !== false) {
        echo json_encode(['success' => false, 'message' => 'Schedule conflict detected — no slots were saved.']);
    } else {
        error_log('shoSaveScheduleSlot: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
