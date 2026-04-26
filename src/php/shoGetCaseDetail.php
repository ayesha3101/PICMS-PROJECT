<?php
// ══════════════════════════════════════════════
// shoGetCaseDetail.php
// Full detail for one complaint:
//   complaint row + witnesses + timeline + appointments + miss_count
// SHO can only view cases at their own station (security).
// No transaction — read-only.
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
header('Content-Type: application/json');

if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer' || empty($_SESSION['is_sho'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

$complaint_id = (int) ($_GET['complaint_id'] ?? 0);
$station_id   = (int) ($_SESSION['station_id'] ?? 0);

if (!$complaint_id || !$station_id) {
    echo json_encode(['success' => false, 'message' => 'Missing complaint_id.']);
    exit;
}

// ── Main complaint row (enforce station ownership)
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
    JOIN   complaint_categories cc        ON c.category_id    = cc.category_id
    LEFT   JOIN complaint_subcategories cs ON c.subcategory_id = cs.subcategory_id
    WHERE  c.complaint_id = ? AND c.station_id = ?
    LIMIT  1
");
$stmt->bind_param('ii', $complaint_id, $station_id);
$stmt->execute();
$complaint = $stmt->get_result()->fetch_assoc();

if (!$complaint) {
    echo json_encode(['success' => false, 'message' => 'Complaint not found or not at your station.']);
    exit;
}
$complaint['is_urgent']     = (bool) $complaint['is_urgent'];
$complaint['has_witnesses'] = (bool) $complaint['has_witnesses'];

// ── Witnesses
$stmtW = $conn->prepare("
    SELECT witness_name, witness_contact
    FROM   witnesses
    WHERE  complaint_id = ?
");
$stmtW->bind_param('i', $complaint_id);
$stmtW->execute();
$witnesses = $stmtW->get_result()->fetch_all(MYSQLI_ASSOC);

// ── Case timeline (oldest first for display)
$stmtT = $conn->prepare("
    SELECT update_id, status, note, updated_by, updated_at
    FROM   case_updates
    WHERE  complaint_id = ?
    ORDER  BY updated_at ASC
");
$stmtT->bind_param('i', $complaint_id);
$stmtT->execute();
$timeline = $stmtT->get_result()->fetch_all(MYSQLI_ASSOC);

// ── Appointments for this complaint (most recent first)
$stmtA = $conn->prepare("
    SELECT
        a.appointment_id,
        a.status,
        a.location,
        a.cancellation_reason,
        a.created_at,
        a.complaint_id,
        ss.scheduled_date,
        ss.start_time,
        ss.end_time,
        c.reference_number,
        c.cnic
    FROM   appointments a
    JOIN   sho_schedule ss ON a.schedule_id = ss.schedule_id
    JOIN   complaints   c  ON a.complaint_id = c.complaint_id
    WHERE  a.complaint_id = ?
    ORDER  BY ss.scheduled_date DESC, ss.start_time DESC
");
$stmtA->bind_param('i', $complaint_id);
$stmtA->execute();
$appointments = $stmtA->get_result()->fetch_all(MYSQLI_ASSOC);

// ── miss_count = number of cancelled appointments for this complaint
//    (each cancellation because citizen didn't appear counts as a miss)
$stmtM = $conn->prepare("
    SELECT COUNT(*) AS miss_count
    FROM   appointments
    WHERE  complaint_id = ? AND status = 'Cancelled'
");
$stmtM->bind_param('i', $complaint_id);
$stmtM->execute();
$missRow  = $stmtM->get_result()->fetch_assoc();
$miss_count = (int) ($missRow['miss_count'] ?? 0);

echo json_encode([
    'success'      => true,
    'complaint'    => $complaint,
    'witnesses'    => $witnesses,
    'timeline'     => $timeline,
    'appointments' => $appointments,
    'miss_count'   => $miss_count,
]);
