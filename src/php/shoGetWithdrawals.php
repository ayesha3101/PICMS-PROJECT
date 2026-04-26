<?php
// ══════════════════════════════════════════════
// shoGetWithdrawals.php
// Returns withdrawal_requests for complaints at
// the SHO's station.
// ?count_only=1 → just returns pending count (nav badge).
// No transaction — read-only.
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer' || empty($_SESSION['is_sho'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

$station_id = (int) ($_SESSION['station_id'] ?? 0);

if (!$station_id) {
    echo json_encode(['success' => false, 'message' => 'No station assigned to this SHO.']);
    exit;
}

// ── Badge count mode
if (!empty($_GET['count_only'])) {
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS pending
        FROM   withdrawal_requests wr
        JOIN   complaints c ON wr.complaint_id = c.complaint_id
        WHERE  c.station_id = ? AND wr.status = 'Pending'
    ");
    $stmt->bind_param('i', $station_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'pending' => (int)($row['pending'] ?? 0)]);
    exit;
}

// ── Full list
$stmt = $conn->prepare("
    SELECT
        wr.request_id,
        wr.complaint_id,
        wr.requested_by   AS cnic,
        wr.reason,
        wr.status,
        wr.rejection_note,
        wr.actioned_by,
        wr.actioned_at,
        wr.created_at,
        c.reference_number,
        c.status          AS complaint_status
    FROM   withdrawal_requests wr
    JOIN   complaints c ON wr.complaint_id = c.complaint_id
    WHERE  c.station_id = ?
    ORDER  BY
        CASE wr.status WHEN 'Pending' THEN 0 ELSE 1 END ASC,
        wr.created_at DESC
");
$stmt->bind_param('i', $station_id);
$stmt->execute();
$requests = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($requests as &$r) {
    $r['request_id']   = (int) $r['request_id'];
    $r['complaint_id'] = (int) $r['complaint_id'];
}
unset($r);

echo json_encode(['success' => true, 'requests' => $requests]);
