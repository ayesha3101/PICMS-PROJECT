<?php
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];

$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        c.status,
        c.submitted_at,
        c.incident_area,
        cc.category_name AS category,
        s.station_name,
        o.full_name AS assigned_officer_name,
        o.badge_number AS assigned_officer_badge,
        wr.request_id AS latest_request_id,
        wr.status AS latest_request_status,
        wr.reason AS latest_request_reason,
        wr.rejection_note AS latest_rejection_note,
        wr.created_at AS latest_request_created_at,
        wr.actioned_at AS latest_request_actioned_at
    FROM complaints c
    JOIN complaint_categories cc ON c.category_id = cc.category_id
    LEFT JOIN stations s ON c.station_id = s.station_id
    LEFT JOIN case_assignments ca
        ON ca.complaint_id = c.complaint_id
       AND ca.is_current = 1
    LEFT JOIN officers o
        ON o.officer_id = ca.officer_id
    LEFT JOIN withdrawal_requests wr
        ON wr.request_id = (
            SELECT wr2.request_id
            FROM withdrawal_requests wr2
            WHERE wr2.complaint_id = c.complaint_id
            ORDER BY wr2.request_id DESC
            LIMIT 1
        )
    WHERE c.cnic = ?
    ORDER BY c.submitted_at DESC
");
$stmt->bind_param('s', $cnic);
$stmt->execute();
$result = $stmt->get_result();

$cases = [];
while ($row = $result->fetch_assoc()) {
    $row['complaint_id'] = (int) $row['complaint_id'];
    $row['latest_request_id'] = $row['latest_request_id'] ? (int) $row['latest_request_id'] : null;
    $row['has_assigned_officer'] = !empty($row['assigned_officer_name']);

    $status = $row['status'];
    $latestRequestStatus = $row['latest_request_status'] ?? null;
    $hasAssignedOfficer = $row['has_assigned_officer'];
    $isTerminal = in_array($status, ['Rejected', 'Withdrawn', 'Resolved', 'Closed'], true);

    $row['withdrawal_mode'] = null;
    if (!$isTerminal && $status !== 'Withdrawal Pending') {
        $row['withdrawal_mode'] = $hasAssignedOfficer ? 'request' : 'direct';
    }

    $row['can_withdraw'] = $row['withdrawal_mode'] !== null;
    $row['has_pending_request'] = $latestRequestStatus === 'Pending';

    $cases[] = $row;
}

echo json_encode([
    'success' => true,
    'cases' => $cases,
]);
?>
