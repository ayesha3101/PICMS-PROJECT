<?php
// ══════════════════════════════════════════════
// shoGetCaseUpdates.php
// Returns all case_updates rows for complaints
// at the SHO's station, newest first.
// Joins complaints table to get reference_number.
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

$stmt = $conn->prepare("
    SELECT
        cu.update_id,
        cu.complaint_id,
        cu.status,
        cu.note,
        cu.updated_by,
        cu.updated_at,
        c.reference_number
    FROM   case_updates cu
    JOIN   complaints   c  ON cu.complaint_id = c.complaint_id
    WHERE  c.station_id = ?
    ORDER  BY cu.updated_at DESC
    LIMIT  500
");
$stmt->bind_param('i', $station_id);
$stmt->execute();
$updates = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($updates as &$u) {
    $u['update_id']    = (int) $u['update_id'];
    $u['complaint_id'] = (int) $u['complaint_id'];
}
unset($u);

echo json_encode(['success' => true, 'updates' => $updates]);
