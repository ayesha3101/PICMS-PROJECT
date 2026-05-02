<?php
// adminGetEligibleOfficers.php
// Returns active investigators for a station who are not currently assigned as SHO or Superintendent.
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']); exit;
}

$stationId  = (int)($_GET['station_id'] ?? 0);
$targetRole = trim($_GET['target_role'] ?? '');

if (!$stationId) {
    echo json_encode(['success' => false, 'message' => 'station_id required.']); exit;
}
if (!in_array($targetRole, ['sho', 'superintendent'], true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid target_role.']); exit;
}

try {
    $stmt = $conn->prepare(
        "SELECT o.officer_id, o.full_name, o.badge_number, o.rank, o.role_id, o.station_id
         FROM officers o
         WHERE o.station_id = ?
           AND o.is_active = 1
           AND o.role_id = 1
           AND NOT EXISTS(
               SELECT 1 FROM station_sho_assignments sa
               WHERE sa.officer_id = o.officer_id AND sa.is_current = 1
           )
           AND NOT EXISTS(
               SELECT 1 FROM station_superintendent_assignments ssa
               WHERE ssa.officer_id = o.officer_id AND ssa.is_current = 1
           )
         ORDER BY o.full_name ASC"
    );
    $stmt->bind_param('i', $stationId);
    $stmt->execute();
    $result = $stmt->get_result();
    $officers = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    foreach ($officers as &$o) {
        $o['officer_id'] = (int)$o['officer_id'];
        $o['station_id'] = (int)$o['station_id'];
        $o['role_id']    = (int)$o['role_id'];
    }
    unset($o);

    echo json_encode(['success' => true, 'officers' => $officers]);
} catch (Exception $e) {
    error_log('adminGetEligibleOfficers: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}
