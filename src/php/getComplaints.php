<?php
// ══════════════════════════════════════════════
// getComplaints.php
// Job: return all complaints for the logged-in
//      citizen as JSON, used by citizenDashboard.js
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// ── Guard: reject if not logged in
if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];

// ── Fetch all complaints for this citizen
//    JOIN stations to get station name
//    JOIN complaint_categories to get category name
//    LEFT JOIN complaint_subcategories to get subcategory name
//    ORDER BY submitted_at DESC so newest shows first
/*SQL — SELECT complaints + category + station name for this citizen */
$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        cc.category_name   AS category,
        cs.subcategory_name AS subcategory,
        c.incident_area,
        c.status,
        c.submitted_at,
        s.station_name
    FROM complaints c
    JOIN complaint_categories cc ON c.category_id = cc.category_id
    LEFT JOIN complaint_subcategories cs ON c.subcategory_id = cs.subcategory_id
    LEFT JOIN stations s ON c.station_id = s.station_id
    WHERE c.cnic = ?
    ORDER BY c.submitted_at DESC
");
/*END*/
$stmt->bind_param("s", $cnic);
$stmt->execute();
$result = $stmt->get_result();

$complaints = [];
while ($row = $result->fetch_assoc()) {
    $complaints[] = $row;
}

echo json_encode([
    'success'    => true,
    'complaints' => $complaints,
]);
?>