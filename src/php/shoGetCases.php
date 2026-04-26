<?php
// ══════════════════════════════════════════════
// shoGetCases.php
// Returns all complaints for the SHO's station.
// Includes assigned officer, category, urgency.
// No transaction needed — read-only.
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

// Main query — joins category, subcategory, current officer assignment
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
        c.rejection_reason,
        c.submitted_at,
        cc.category_id,
        cc.category_name,
        cc.is_urgent,
        COALESCE(cs.subcategory_name, '') AS subcategory_name,
        -- Current assigned officer (subquery, uses is_current flag)
        (SELECT o.officer_id
         FROM   case_assignments ca
         JOIN   officers o ON ca.officer_id = o.officer_id
         WHERE  ca.complaint_id = c.complaint_id AND ca.is_current = 1
         LIMIT  1) AS assigned_officer_id,
        (SELECT o.full_name
         FROM   case_assignments ca
         JOIN   officers o ON ca.officer_id = o.officer_id
         WHERE  ca.complaint_id = c.complaint_id AND ca.is_current = 1
         LIMIT  1) AS assigned_officer_name
    FROM   complaints c
    JOIN   complaint_categories cc    ON c.category_id    = cc.category_id
    LEFT   JOIN complaint_subcategories cs ON c.subcategory_id = cs.subcategory_id
    WHERE  c.station_id = ?
    ORDER  BY c.submitted_at DESC
");
$stmt->bind_param('i', $station_id);
$stmt->execute();
$cases = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Cast types
foreach ($cases as &$c) {
    $c['complaint_id']       = (int)  $c['complaint_id'];
    $c['is_urgent']          = (bool) $c['is_urgent'];
    $c['has_witnesses']      = (bool) $c['has_witnesses'];
    $c['assigned_officer_id'] = $c['assigned_officer_id'] ? (int) $c['assigned_officer_id'] : null;
}
unset($c);

echo json_encode(['success' => true, 'cases' => $cases]);
