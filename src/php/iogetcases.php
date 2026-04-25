<?php
// ioGetCases.php — All cases assigned to this IO
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

$officerId = (int)$_SESSION['officer_id'];

$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        c.cnic,
        c.status,
        c.incident_area,
        c.incident_date,
        c.description,
        cc.category_name,
        cc.is_urgent,
        s.station_name,
        ca.assigned_at
    FROM case_assignments ca
    JOIN complaints c             ON ca.complaint_id = c.complaint_id
    JOIN complaint_categories cc  ON c.category_id   = cc.category_id
    JOIN stations s               ON c.station_id    = s.station_id
    WHERE ca.officer_id = ?
      AND ca.is_current = 1
    ORDER BY ca.assigned_at DESC
");
$stmt->bind_param('i', $officerId);
$stmt->execute();
$cases = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(['success' => true, 'cases' => $cases]);