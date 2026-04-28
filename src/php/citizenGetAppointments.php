<?php
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/appointmentLifecycle.php';

header('Content-Type: application/json');

if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];

syncExpiredPendingAppointments($conn, ['cnic' => $cnic]);

if (!empty($_GET['count_only'])) {
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS pending
        FROM vw_appointment_details
        WHERE cnic = ? AND status = 'Pending'
    ");
    $stmt->bind_param('s', $cnic);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'pending' => (int) ($row['pending'] ?? 0)]);
    exit;
}

$stmt = $conn->prepare("
    SELECT
        v.appointment_id,
        v.complaint_id,
        v.reference_number,
        v.station_name,
        v.location,
        v.status,
        v.cancellation_reason,
        v.created_at,
        v.scheduled_date,
        v.start_time,
        v.end_time,
        v.scheduled_at,
        v.miss_count
    FROM vw_appointment_details v
    WHERE v.cnic = ?
    ORDER BY v.scheduled_date DESC, v.start_time DESC
");
$stmt->bind_param('s', $cnic);
$stmt->execute();
$appointments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

foreach ($appointments as &$appointment) {
    $appointment['appointment_id'] = (int) $appointment['appointment_id'];
    $appointment['complaint_id'] = (int) $appointment['complaint_id'];
    $appointment['miss_count'] = (int) $appointment['miss_count'];
    $appointment['can_accept'] = $appointment['status'] === 'Pending';
}
unset($appointment);

echo json_encode([
    'success' => true,
    'appointments' => $appointments,
]);
?>
