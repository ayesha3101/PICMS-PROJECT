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

$hearing_id = (int)($input['hearing_id'] ?? 0);
$result = trim($input['result'] ?? '');
$next_hearing_date = !empty($input['next_hearing_date']) ? trim($input['next_hearing_date']) : null;
$notes = trim($input['notes'] ?? '');

// Validation
if (!$hearing_id) {
    echo json_encode(['success' => false, 'message' => 'Hearing ID is required']);
    exit;
}

if (!$result) {
    echo json_encode(['success' => false, 'message' => 'Hearing result is required']);
    exit;
}

// Validate next_hearing_date if provided
if ($next_hearing_date && !strtotime($next_hearing_date)) {
    echo json_encode(['success' => false, 'message' => 'Invalid next_hearing_date format. Use YYYY-MM-DD']);
    exit;
}

// Get current hearing details
$check = $conn->prepare("
    SELECT h.detainee_id, h.complaint_id, h.hearing_type
    FROM court_hearings h
    WHERE h.hearing_id = ?
    LIMIT 1
");
if (!$check) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;
}
$check->bind_param('i', $hearing_id);
$check->execute();
$hearing = $check->get_result()->fetch_assoc();
$check->close();

if (!$hearing) {
    echo json_encode(['success' => false, 'message' => 'Hearing not found']);
    exit;
}

// ────────────────────────────────────────────────────────────────
// ATOMIC TRANSACTION: Update hearing + audit logging + detainee status
// ────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    // 1. Update hearing with result
    $stmt = $conn->prepare("
        UPDATE court_hearings
        SET result = ?, next_hearing_date = ?, notes = ?
        WHERE hearing_id = ?
    ");
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
    $stmt->bind_param('sssi', $result, $next_hearing_date, $notes, $hearing_id);

    if (!$stmt->execute()) {
        throw new Exception("Failed to update hearing: " . $stmt->error);
    }
    $stmt->close();

    // 2. Log the update
    $complaint_id = $hearing['complaint_id'];
    if ($complaint_id) {
        $logNote = "Hearing result: $result. Hearing type: {$hearing['hearing_type']}";
        if ($next_hearing_date) $logNote .= " | Next hearing: $next_hearing_date";
        if ($notes) $logNote .= " | Notes: $notes";

        $log = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, 'Court Result', ?, 'System')
        ");
        if (!$log) throw new Exception("Prepare failed: " . $conn->error);
        $log->bind_param('is', $complaint_id, $logNote);
        if (!$log->execute()) throw new Exception("Failed to log hearing result: " . $log->error);
        $log->close();
    }

    // 3. If verdict (acquitted/guilty), mark detainee as released
    if (strpos(strtolower($result), 'acquitted') !== false || strpos(strtolower($result), 'guilty') !== false || strpos(strtolower($result), 'convicted') !== false) {
        $detainee_id = $hearing['detainee_id'];
        $release = $conn->prepare("
            UPDATE detainees
            SET release_date = CURDATE(), release_reason = ?
            WHERE detainee_id = ?
        ");
        if (!$release) throw new Exception("Prepare failed: " . $conn->error);

        $releaseReason = "Released following $result verdict";
        $release->bind_param('si', $releaseReason, $detainee_id);
        if (!$release->execute()) throw new Exception("Failed to mark detainee as released: " . $release->error);
        $release->close();
    }

    // 4. Commit all operations atomically
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Hearing updated successfully'
    ]);

} catch (Exception $e) {
    // Rollback if anything fails
    $conn->rollback();
    error_log('courtHearingUpdate: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update hearing. Please try again.',
        'error' => $e->getMessage()
    ]);
}
?>
