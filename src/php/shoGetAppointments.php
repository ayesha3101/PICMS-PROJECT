<?php
// ══════════════════════════════════════════════
// shoGetAppointments.php
// Returns all appointments for complaints at
// the SHO's station. Supports:
//   ?complaint_id=X  → appointments for one case only
//   ?count_only=1    → only returns pending count (badge)
// No transaction — read-only.
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/appointmentLifecycle.php';
header('Content-Type: application/json');

if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer' || empty($_SESSION['is_sho'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

$officer_id  = (int) $_SESSION['officer_id'];
$station_id  = (int) ($_SESSION['station_id'] ?? 0);
$complaint_id = (int) ($_GET['complaint_id'] ?? 0);

if (!$station_id) {
    echo json_encode(['success' => false, 'message' => 'No station assigned to this SHO.']);
    exit;
}

syncExpiredPendingAppointments($conn, ['station_id' => $station_id]);

// ── Badge count mode: just return pending count for nav badge
if (!empty($_GET['count_only'])) {
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS pending
        FROM   vw_appointment_details v
        WHERE  v.station_id = ? AND v.status = 'Pending'
    ");
    $stmt->bind_param('i', $station_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'pending' => (int)($row['pending'] ?? 0)]);
    exit;
}

// ── Full appointment list
if ($complaint_id) {
    // Single complaint — verify it belongs to this station
    $stmt = $conn->prepare("
        SELECT
            v.appointment_id,
            v.complaint_id,
            v.sho_id,
            v.status,
            v.location,
            v.cancellation_reason,
            v.created_at,
            v.scheduled_date,
            v.start_time,
            v.end_time,
            v.reference_number,
            v.cnic,
            v.miss_count
        FROM   vw_appointment_details v
        WHERE  v.complaint_id = ? AND v.station_id = ?
        ORDER  BY v.scheduled_date DESC, v.start_time DESC
    ");
    $stmt->bind_param('ii', $complaint_id, $station_id);
} else {
    // All appointments for this station
    $stmt = $conn->prepare("
        SELECT
            v.appointment_id,
            v.complaint_id,
            v.sho_id,
            v.status,
            v.location,
            v.cancellation_reason,
            v.created_at,
            v.scheduled_date,
            v.start_time,
            v.end_time,
            v.reference_number,
            v.cnic,
            v.miss_count
        FROM   vw_appointment_details v
        WHERE  v.station_id = ? AND v.sho_id = ?
        ORDER  BY v.scheduled_date DESC, v.start_time DESC
    ");
    $stmt->bind_param('ii', $station_id, $officer_id);
}

$stmt->execute();
$appointments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($appointments as &$a) {
    $a['appointment_id'] = (int) $a['appointment_id'];
    $a['complaint_id']   = (int) $a['complaint_id'];
    $a['miss_count']     = (int) $a['miss_count'];
}
unset($a);

echo json_encode(['success' => true, 'appointments' => $appointments]);
