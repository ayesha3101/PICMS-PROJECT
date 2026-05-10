<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// Auth check - officers only
if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

$detainee_id = (int)($input['detainee_id'] ?? 0);
$complaint_id = !empty($input['complaint_id']) ? (int)$input['complaint_id'] : null;
$court_name = trim($input['court_name'] ?? '');
$hearing_date = trim($input['hearing_date'] ?? '');
$hearing_type = trim($input['hearing_type'] ?? '');
$hearing_time = !empty($input['hearing_time']) ? trim($input['hearing_time']) : null;

// Validation
if (!$detainee_id || !$hearing_date || !$hearing_type) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields: detainee_id, hearing_date, hearing_type']);
    exit;
}

// Validate hearing_type
$valid_types = ['Remand Extension', 'Bail Hearing', 'Trial', 'Verdict', 'Other'];
if (!in_array($hearing_type, $valid_types, true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid hearing_type. Must be one of: ' . implode(', ', $valid_types)]);
    exit;
}

// Validate hearing_date format
if (!strtotime($hearing_date)) {
    echo json_encode(['success' => false, 'message' => 'Invalid hearing_date format. Use YYYY-MM-DD']);
    exit;
}

// Verify detainee exists
$check = $conn->prepare("SELECT detainee_id FROM detainees WHERE detainee_id = ? LIMIT 1");
if (!$check) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;
}
$check->bind_param('i', $detainee_id);
$check->execute();
$detainee = $check->get_result()->fetch_assoc();
$check->close();

if (!$detainee) {
    echo json_encode(['success' => false, 'message' => 'Detainee not found']);
    exit;
}

// ────────────────────────────────────────────────────────────────
// ATOMIC TRANSACTION: Create hearing + audit logging
// ────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Create hearing record
    $stmt = $conn->prepare("
        INSERT INTO court_hearings
        (detainee_id, complaint_id, court_name, hearing_date, hearing_time, hearing_type)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

    $stmt->bind_param('iissis', $detainee_id, $complaint_id, $court_name, $hearing_date, $hearing_time, $hearing_type);

    if (!$stmt->execute()) {
        throw new Exception("Failed to create hearing: " . $stmt->error);
    }

    $hearing_id = $conn->insert_id;
    $stmt->close();

    // 2. Log the action to case_updates for audit trail
    if ($complaint_id) {
        $logNote = "Court hearing scheduled: $hearing_type on $hearing_date at " . ($hearing_time ?: 'Time TBD') . " in $court_name";
        $log = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, 'Court Hearing Scheduled', ?, 'System')
        ");
        if (!$log) throw new Exception("Prepare failed: " . $conn->error);
        $log->bind_param('is', $complaint_id, $logNote);
        if (!$log->execute()) throw new Exception("Failed to log hearing creation: " . $log->error);
        $log->close();
    }

    // 3. Commit both operations atomically
    $conn->commit();

    echo json_encode([
        'success' => true,
        'hearing_id' => $hearing_id,
        'message' => 'Court hearing scheduled successfully'
    ]);

} catch (Exception $e) {
    // Rollback if anything fails
    $conn->rollback();
    error_log('courtHearingCreate: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to schedule hearing. Please try again.',
        'error' => $e->getMessage()
    ]);
}
?>
