<?php
// ══════════════════════════════════════════════
// getComplaints.php
// Job: return all complaints for the logged-in
//      citizen as JSON, used by citizenDashboard.js
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// ── Guard: reject if not logged in
if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];

// ── Fetch all complaints for this citizen
//    JOIN stations to get the station name for display
//    ORDER BY submitted_at DESC so newest shows first
/*SQL — SELECT complaints + station name for this citizen */
$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        c.category,
        c.subcategory,
        c.incident_area,
        c.status,
        c.priority,
        c.submitted_at,
        s.station_name
    FROM complaints c
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