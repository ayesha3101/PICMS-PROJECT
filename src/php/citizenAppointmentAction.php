<?php
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/appointmentLifecycle.php';

header('Content-Type: application/json');

if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid method.']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];
$input = json_decode(file_get_contents('php://input'), true);
$appointment_id = (int) ($input['appointment_id'] ?? 0);
$action = trim($input['action'] ?? '');

if (!$appointment_id || $action !== 'accept') {
    echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    exit;
}

syncExpiredPendingAppointments($conn, ['cnic' => $cnic]);

$stmt = $conn->prepare("
    SELECT
        v.appointment_id,
        v.complaint_id,
        v.reference_number,
        v.status,
        v.scheduled_at
    FROM vw_appointment_details v
    WHERE v.appointment_id = ? AND v.cnic = ?
    LIMIT 1
");
$stmt->bind_param('is', $appointment_id, $cnic);
$stmt->execute();
$appointment = $stmt->get_result()->fetch_assoc();

if (!$appointment) {
    echo json_encode(['success' => false, 'message' => 'Appointment not found.']);
    exit;
}

if ($appointment['status'] !== 'Pending') {
    echo json_encode(['success' => false, 'message' => 'Only pending appointments can be accepted.']);
    exit;
}

if (strtotime($appointment['scheduled_at']) <= time()) {
    echo json_encode(['success' => false, 'message' => 'This appointment can no longer be accepted because its scheduled time has passed.']);
    exit;
}

$conn->begin_transaction();

try {
    $upd = $conn->prepare("
        UPDATE appointments
        SET status = 'Accepted'
        WHERE appointment_id = ? AND status = 'Pending'
    ");
    $upd->bind_param('i', $appointment_id);
    if (!$upd->execute()) {
        throw new Exception('Failed to accept appointment.');
    }

    if ($upd->affected_rows === 0) {
        throw new Exception('Appointment is no longer pending.');
    }

    $note = 'Citizen accepted the scheduled appointment.';
    $insLog = $conn->prepare("
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (?, 'Accepted', ?, 'Citizen')
    ");
    $complaint_id = (int) $appointment['complaint_id'];
    $insLog->bind_param('is', $complaint_id, $note);
    if (!$insLog->execute()) {
        throw new Exception('Failed to log appointment acceptance.');
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Appointment accepted successfully.']);
} catch (Exception $e) {
    $conn->rollback();
    error_log('citizenAppointmentAction: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}
?>
