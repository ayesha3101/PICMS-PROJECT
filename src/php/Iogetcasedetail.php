<?php
// ioGetCaseDetail.php — Single case detail + timeline
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    $_SESSION['role'] !== 'officer' ||
    (int)$_SESSION['role_id'] !== 1
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$officerId   = (int)$_SESSION['officer_id'];
$complaintId = (int)($_GET['id'] ?? 0);

if (!$complaintId) {
    echo json_encode(['success' => false, 'message' => 'Invalid case ID.']);
    exit;
}

// Verify this case belongs to this IO
$check = $conn->prepare("
    SELECT COUNT(*) AS cnt FROM case_assignments
    WHERE complaint_id = ? AND officer_id = ?
");
$check->bind_param('ii', $complaintId, $officerId);
$check->execute();
$cnt = (int)$check->get_result()->fetch_assoc()['cnt'];
$check->close();

if (!$cnt) {
    echo json_encode(['success' => false, 'message' => 'Case not found.']);
    exit;
}

// Case details
$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        c.cnic,
        c.status,
        c.incident_area,
        c.incident_landmark,
        c.incident_date,
        c.incident_time,
        c.description,
        c.has_witnesses,
        cc.category_name,
        cc.is_urgent,
        s.station_name
    FROM complaints c
    JOIN complaint_categories cc ON c.category_id = cc.category_id
    JOIN stations s              ON c.station_id  = s.station_id
    WHERE c.complaint_id = ?
    LIMIT 1
");
$stmt->bind_param('i', $complaintId);
$stmt->execute();
$case = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Timeline / case updates
$tStmt = $conn->prepare("
    SELECT status, note, updated_by, updated_at
    FROM case_updates
    WHERE complaint_id = ?
    ORDER BY updated_at ASC
");
$tStmt->bind_param('i', $complaintId);
$tStmt->execute();
$updates = $tStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$tStmt->close();

echo json_encode([
    'success' => true,
    'case'    => $case,
    'updates' => $updates,
]);