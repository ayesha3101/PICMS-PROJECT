<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    ($_SESSION['role'] ?? '') !== 'officer' ||
    (int)($_SESSION['role_id'] ?? 0) !== 3
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$stationId = (int)($_SESSION['station_id'] ?? 0);
$officerId = (int)$_SESSION['officer_id'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

$detaineeId = (int)($input['detainee_id'] ?? 0);
$cnic = trim((string)($input['cnic'] ?? ''));
$fname = trim((string)($input['d_fname'] ?? ''));
$minit = trim((string)($input['d_minit'] ?? ''));
$lname = trim((string)($input['d_lname'] ?? ''));
$age = (int)($input['age'] ?? 0);
$gender = trim((string)($input['gender'] ?? ''));
$purpose = trim((string)($input['purpose_of_admission'] ?? ''));
$admissionDate = trim((string)($input['admission_date'] ?? ''));
$complaintId = !empty($input['complaint_id']) ? (int)$input['complaint_id'] : null;

if ($fname === '' || $lname === '' || $age < 1 || !in_array($gender, ['Male', 'Female'], true) || $admissionDate === '') {
    echo json_encode(['success' => false, 'message' => 'Missing or invalid required fields.']);
    exit;
}

if (!in_array($purpose, ['Remand','Sentence','Preventive Detention','Other'], true)) {
    $purpose = 'Other';
}

if ($complaintId !== null) {
    $cs = $conn->prepare("SELECT complaint_id FROM complaints WHERE complaint_id = ? AND station_id = ? LIMIT 1");
    $cs->bind_param('ii', $complaintId, $stationId);
    $cs->execute();
    $ok = $cs->get_result()->fetch_assoc();
    $cs->close();
    if (!$ok) {
        echo json_encode(['success' => false, 'message' => 'Selected case does not belong to your station.']);
        exit;
    }
}

// ────────────────────────────────────────────────────────────────
// ATOMIC TRANSACTION: Detainee save + audit logging
// ────────────────────────────────────────────────────────────────
$conn->begin_transaction();

try {
    if ($detaineeId > 0) {
        // UPDATE case
        $stmt = $conn->prepare("
            UPDATE detainees
            SET cnic = ?, d_fname = ?, d_minit = ?, d_lname = ?, age = ?, gender = ?,
                complaint_id = ?, purpose_of_admission = ?, admission_date = ?
            WHERE detainee_id = ? AND station_id = ?
        ");
        if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
        $stmt->bind_param(
            'ssssisissii',
            $cnic,
            $fname,
            $minit,
            $lname,
            $age,
            $gender,
            $complaintId,
            $purpose,
            $admissionDate,
            $detaineeId,
            $stationId
        );
        if (!$stmt->execute()) throw new Exception("Failed to update detainee: " . $stmt->error);
        $lastId = $detaineeId;
    } else {
        // INSERT case
        $stmt = $conn->prepare("
            INSERT INTO detainees (
                cnic, d_fname, d_minit, d_lname, age, gender, station_id,
                complaint_id, purpose_of_admission, admission_date, admitted_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
        $stmt->bind_param(
            'ssssisiissi',
            $cnic,
            $fname,
            $minit,
            $lname,
            $age,
            $gender,
            $stationId,
            $complaintId,
            $purpose,
            $admissionDate,
            $officerId
        );
        if (!$stmt->execute()) throw new Exception("Failed to insert detainee: " . $stmt->error);
        $lastId = $conn->insert_id;
    }
    $stmt->close();

    // 2. Log the action to case_updates for audit trail
    $action = $detaineeId > 0 ? 'UPDATE' : 'INSERT';
    $logNote = "$action detainee: $fname $lname (Age: $age, Gender: $gender)";

    if ($complaintId) {
        $log = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, 'Detention', ?, 'System')
        ");
        if (!$log) throw new Exception("Prepare failed: " . $conn->error);
        $log->bind_param('is', $complaintId, $logNote);
        if (!$log->execute()) throw new Exception("Failed to log detention action: " . $log->error);
        $log->close();
    }

    // Commit both operations atomically
    $conn->commit();

    echo json_encode([
        'success' => true,
        'detainee_id' => $lastId,
        'message' => 'Detainee saved successfully'
    ]);

} catch (Exception $e) {
    // Rollback if anything fails
    $conn->rollback();
    error_log('superintendentSaveDetainee: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save detainee. Please try again.',
        'error' => $e->getMessage()
    ]);
}
