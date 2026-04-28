<?php
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$complaint_id = (int) ($input['complaint_id'] ?? 0);
$reason = trim($input['reason'] ?? '');
$cnic = $_SESSION['citizen_cnic'];

if (!$complaint_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid complaint selected.']);
    exit;
}

if (strlen($reason) < 10) {
    echo json_encode(['success' => false, 'message' => 'Please provide a brief reason of at least 10 characters.']);
    exit;
}

$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        c.status,
        ca.officer_id AS assigned_officer_id
    FROM complaints c
    LEFT JOIN case_assignments ca
        ON ca.complaint_id = c.complaint_id
       AND ca.is_current = 1
    WHERE c.complaint_id = ? AND c.cnic = ?
    LIMIT 1
");
$stmt->bind_param('is', $complaint_id, $cnic);
$stmt->execute();
$complaint = $stmt->get_result()->fetch_assoc();

if (!$complaint) {
    echo json_encode(['success' => false, 'message' => 'Complaint not found.']);
    exit;
}

if (in_array($complaint['status'], ['Rejected', 'Withdrawn', 'Resolved', 'Closed'], true)) {
    echo json_encode(['success' => false, 'message' => 'This case can no longer be withdrawn.']);
    exit;
}

$pendingStmt = $conn->prepare("
    SELECT request_id
    FROM withdrawal_requests
    WHERE complaint_id = ? AND status = 'Pending'
    LIMIT 1
");
$pendingStmt->bind_param('i', $complaint_id);
$pendingStmt->execute();
$pendingRequest = $pendingStmt->get_result()->fetch_assoc();

if ($pendingRequest || $complaint['status'] === 'Withdrawal Pending') {
    echo json_encode(['success' => false, 'message' => 'A withdrawal request is already pending SHO review.']);
    exit;
}

$hasAssignedOfficer = !empty($complaint['assigned_officer_id']);
$conn->begin_transaction();

try {
    if ($hasAssignedOfficer) {
        $insertReq = $conn->prepare("
            INSERT INTO withdrawal_requests (complaint_id, requested_by, reason)
            VALUES (?, ?, ?)
        ");
        $insertReq->bind_param('iss', $complaint_id, $cnic, $reason);
        if (!$insertReq->execute()) {
            throw new Exception('Failed to create withdrawal request.');
        }

        $updateComplaint = $conn->prepare("
            UPDATE complaints
            SET status = 'Withdrawal Pending'
            WHERE complaint_id = ?
        ");
        $updateComplaint->bind_param('i', $complaint_id);
        if (!$updateComplaint->execute()) {
            throw new Exception('Failed to update complaint status.');
        }

        $note = 'Citizen requested case withdrawal. Awaiting SHO review.';
        $updateLog = $conn->prepare("
            INSERT INTO case_updates (complaint_id, status, note, updated_by)
            VALUES (?, 'Withdrawal Pending', ?, 'Citizen')
        ");
        $updateLog->bind_param('is', $complaint_id, $note);
        if (!$updateLog->execute()) {
            throw new Exception('Failed to log withdrawal request.');
        }

        $conn->commit();
        echo json_encode([
            'success' => true,
            'mode' => 'request',
            'message' => 'Withdrawal request submitted. The SHO will approve or reject it.',
        ]);
        exit;
    }

    $updateComplaint = $conn->prepare("
        UPDATE complaints
        SET status = 'Withdrawn'
        WHERE complaint_id = ?
    ");
    $updateComplaint->bind_param('i', $complaint_id);
    if (!$updateComplaint->execute()) {
        throw new Exception('Failed to update complaint status.');
    }

    $note = 'Citizen withdrew the case before an officer was assigned.';
    $updateLog = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, 'Withdrawn', ?, 'Citizen')
    ");
    $updateLog->bind_param('is', $complaint_id, $note);
    if (!$updateLog->execute()) {
        throw new Exception('Failed to log withdrawal.');
    }

    $conn->commit();
    echo json_encode([
        'success' => true,
        'mode' => 'direct',
        'message' => 'Your case has been withdrawn successfully.',
    ]);
} catch (Exception $e) {
    $conn->rollback();
    error_log('citizenSubmitWithdrawal: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}
?>
