<?php
// ══════════════════════════════════════════════
// getCaseDetail.php
// Job: return full detail for one complaint
//      including timeline, officer, appointment
//      only returns data if complaint belongs
//      to the logged-in citizen (security check)
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

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

// ── Fetch complaint + station detail
//    WHERE cnic = ? ensures citizen can only view their own cases
/*SQL — SELECT complaint + station for this reference number, owned by this citizen */
$stmt = $conn->prepare("
    SELECT
        c.complaint_id,
        c.reference_number,
        c.cnic,
        c.category,
        c.subcategory,
        c.incident_area,
        c.incident_landmark,
        c.incident_date,
        c.incident_time,
        c.description,
        c.has_witnesses,
        c.witness_name,
        c.witness_contact,
        c.is_anonymous,
        c.status,
        c.priority,
        c.rejection_reason,
        c.submitted_at,
        s.station_name,
        s.address  AS station_address,
        s.phone    AS station_phone
    FROM complaints c
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

// ── Fetch assigned officer if one exists
//    JOIN case_assignments → officers to get officer details
/*SQL — SELECT officer assigned to this complaint via case_assignments */
$stmtO = $conn->prepare("
    SELECT
        o.full_name,
        o.badge_number,
        o.rank
    FROM case_assignments ca
    JOIN officers o ON ca.officer_id = o.officer_id
    WHERE ca.complaint_id = ?
    ORDER BY ca.assigned_at DESC
    LIMIT 1
");
/*END*/
$stmtO->bind_param("i", $complaint_id);
$stmtO->execute();
$officer = $stmtO->get_result()->fetch_assoc();

// ── Fetch upcoming appointment if one exists
//    Only show Pending or Confirmed appointments
/*SQL — SELECT latest non-completed appointment for this complaint */
$stmtA = $conn->prepare("
    SELECT
        scheduled_date,
        scheduled_time,
        location,
        status
    FROM appointments
    WHERE complaint_id = ?
      AND status IN ('Pending', 'Confirmed')
    ORDER BY scheduled_date ASC
    LIMIT 1
");
/*END*/
$stmtA->bind_param("i", $complaint_id);
$stmtA->execute();
$appointment = $stmtA->get_result()->fetch_assoc();

echo json_encode([
    'success'     => true,
    'complaint'   => $complaint,
    'timeline'    => $timeline,
    'officer'     => $officer    ?: null,
    'appointment' => $appointment ?: null,
]);
?>