<?php
// ══════════════════════════════════════════════
// getCaseDetails.php
// Job: return full detail for one complaint
//      including timeline, officer, appointment
//      only returns data if complaint belongs
//      to the logged-in citizen (security check)
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/appointmentLifecycle.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// ── Guard: must be logged in
if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];
$ref  = trim($_GET['ref'] ?? '');

if (!$ref) {
    echo json_encode(['success' => false, 'message' => 'Reference number required']);
    exit;
}

// ── Fetch complaint + station + category + subcategory
//    WHERE cnic = ? ensures citizen can only view their own cases
//    Witnesses fetched separately via the witnesses table
/*SQL — SELECT complaint + station + category for this reference number, owned by this citizen */
$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        c.cnic,
        cc.category_name    AS category,
        cs.subcategory_name AS subcategory,
        c.incident_area,
        c.incident_landmark,
        c.incident_date,
        c.incident_time,
        c.description,
        c.has_witnesses,
        c.status,
        c.rejection_reason,
        c.submitted_at,
        s.station_name,
        s.address  AS station_address,
        s.phone    AS station_phone
    FROM complaints c
    JOIN complaint_categories cc ON c.category_id = cc.category_id
    LEFT JOIN complaint_subcategories cs ON c.subcategory_id = cs.subcategory_id
    LEFT JOIN stations s ON c.station_id = s.station_id
    WHERE c.reference_number = ? AND c.cnic = ?
    LIMIT 1
");
/*END*/
$stmt->bind_param("ss", $ref, $cnic);
$stmt->execute();
$complaint = $stmt->get_result()->fetch_assoc();

if (!$complaint) {
    echo json_encode(['success' => false, 'message' => 'Complaint not found']);
    exit;
}

$complaint_id = $complaint['complaint_id'];

syncExpiredPendingAppointments($conn, ['complaint_id' => (int) $complaint_id, 'cnic' => $cnic]);

// ── Fetch witnesses from the witnesses table if any exist
/*SQL — SELECT witnesses linked to this complaint */
$stmtW = $conn->prepare("
    SELECT witness_name, witness_contact
    FROM witnesses
    WHERE complaint_id = ?
");
/*END*/
$stmtW->bind_param("i", $complaint_id);
$stmtW->execute();
$witnessResult = $stmtW->get_result();
$witnesses = [];
while ($row = $witnessResult->fetch_assoc()) {
    $witnesses[] = $row;
}

// ── Fetch case timeline from case_updates
//    ORDER BY updated_at ASC so timeline renders oldest-first
/*SQL — SELECT all status updates for this complaint, chronological */
$stmtT = $conn->prepare("
    SELECT
        update_id,
        status,
        note,
        updated_by,
        updated_at
    FROM case_updates
    WHERE complaint_id = ?
    ORDER BY updated_at ASC
");
/*END*/
$stmtT->bind_param("i", $complaint_id);
$stmtT->execute();
$timelineResult = $stmtT->get_result();

$timeline = [];
while ($row = $timelineResult->fetch_assoc()) {
    $timeline[] = $row;
}

// ── Fetch assigned officer if one exists (current assignment only)
//    JOIN case_assignments (is_current=1) → officers
/*SQL — SELECT current officer assigned to this complaint via case_assignments */
$stmtO = $conn->prepare("
    SELECT
        o.full_name,
        o.badge_number,
        o.rank
    FROM case_assignments ca
    JOIN officers o ON ca.officer_id = o.officer_id
    WHERE ca.complaint_id = ?
      AND ca.is_current = 1
    LIMIT 1
");
/*END*/
$stmtO->bind_param("i", $complaint_id);
$stmtO->execute();
$officer = $stmtO->get_result()->fetch_assoc();

// ── Fetch latest citizen-facing appointment if one exists
$stmtA = $conn->prepare("
    SELECT
        v.appointment_id,
        v.scheduled_date,
        v.start_time,
        v.end_time,
        v.location,
        v.status,
        v.cancellation_reason,
        v.miss_count
    FROM vw_appointment_details v
    WHERE v.complaint_id = ?
    ORDER BY v.scheduled_date DESC, v.start_time DESC
    LIMIT 1
");
/*END*/
$stmtA->bind_param("i", $complaint_id);
$stmtA->execute();
$appointment = $stmtA->get_result()->fetch_assoc();

echo json_encode([
    'success'     => true,
    'complaint'   => $complaint,
    'witnesses'   => $witnesses,
    'timeline'    => $timeline,
    'officer'     => $officer    ?: null,
    'appointment' => $appointment ?: null,
]);
?>