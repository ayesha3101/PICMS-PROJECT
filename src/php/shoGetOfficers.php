<?php
// ══════════════════════════════════════════════
// shoGetOfficers.php
// Returns investigating officers at the SHO's
// station (role_id = 1 = Investigating Officer).
//
// ?full=1  → includes list of assigned case refs
//            (used by Officers page for display)
// default  → lean list for assignment modal
//
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
$full       = !empty($_GET['full']);

if (!$station_id) {
    echo json_encode(['success' => false, 'message' => 'No station assigned to this SHO.']);
    exit;
}

// Fetch all active investigating officers at this station
// role_id = 1 = 'Investigating Officer'
$stmt = $conn->prepare("
    SELECT
        o.officer_id,
        o.full_name,
        o.badge_number,
        o.email,
        o.rank,
        o.active_caseload,
        o.is_active
    FROM   officers o
    WHERE  o.station_id = ?
      AND  o.role_id    = 1
      AND  o.is_active  = 1
    ORDER  BY o.active_caseload ASC, o.full_name ASC
");
$stmt->bind_param('i', $station_id);
$stmt->execute();
$officers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($officers as &$o) {
    $o['officer_id']     = (int)  $o['officer_id'];
    $o['active_caseload']= (int)  $o['active_caseload'];
    $o['is_active']      = (bool) $o['is_active'];

    if ($full) {
        // Fetch reference numbers of currently assigned active cases
        $stmtC = $conn->prepare("
            SELECT c.reference_number
            FROM   case_assignments ca
            JOIN   complaints c ON ca.complaint_id = c.complaint_id
            WHERE  ca.officer_id = ? AND ca.is_current = 1
              AND  c.status NOT IN ('Resolved','Closed','Rejected','Withdrawn')
            ORDER  BY c.submitted_at DESC
        ");
        $stmtC->bind_param('i', $o['officer_id']);
        $stmtC->execute();
        $cases = $stmtC->get_result()->fetch_all(MYSQLI_ASSOC);
        $o['assigned_cases'] = array_column($cases, 'reference_number');
    }
}
unset($o);

echo json_encode(['success' => true, 'officers' => $officers]);
