<?php

function syncExpiredPendingAppointments(mysqli $conn, array $filters = []): void
{
    $where = ["v.status = 'Pending'", "v.scheduled_at <= NOW()"];

    if (!empty($filters['cnic'])) {
        $cnic = $conn->real_escape_string((string) $filters['cnic']);
        $where[] = "v.cnic = '{$cnic}'";
    }

    if (!empty($filters['station_id'])) {
        $where[] = "v.station_id = " . (int) $filters['station_id'];
    }

    if (!empty($filters['complaint_id'])) {
        $where[] = "v.complaint_id = " . (int) $filters['complaint_id'];
    }

    $sql = "
        SELECT
            v.appointment_id,
            v.complaint_id,
            v.reference_number,
            v.miss_count
        FROM vw_appointment_details v
        WHERE " . implode(' AND ', $where) . "
        ORDER BY v.scheduled_at ASC
    ";

    $result = $conn->query($sql);
    if (!$result) {
        error_log('syncExpiredPendingAppointments query failed: ' . $conn->error);
        return;
    }

    while ($row = $result->fetch_assoc()) {
        $appointmentId = (int) $row['appointment_id'];
        $complaintId = (int) $row['complaint_id'];
        $newMissCount = ((int) $row['miss_count']) + 1;
        $nextComplaintStatus = $newMissCount >= 2 ? 'Closed' : 'Accepted';
        $note = $newMissCount >= 2
            ? "Case automatically closed because the citizen did not accept two scheduled appointments in time."
            : "Appointment expired because the citizen did not accept it before the scheduled time. SHO can schedule a replacement appointment.";

        $conn->begin_transaction();

        try {
            $updAppointment = $conn->prepare("
                UPDATE appointments
                SET status = 'Cancelled',
                    cancellation_reason = 'Citizen did not accept appointment before the scheduled time.'
                WHERE appointment_id = ? AND status = 'Pending'
            ");
            $updAppointment->bind_param('i', $appointmentId);
            if (!$updAppointment->execute()) {
                throw new Exception('Failed to expire appointment.');
            }

            if ($updAppointment->affected_rows === 0) {
                $conn->rollback();
                continue;
            }

            $updComplaint = $conn->prepare("
                UPDATE complaints
                SET status = ?
                WHERE complaint_id = ?
            ");
            $updComplaint->bind_param('si', $nextComplaintStatus, $complaintId);
            if (!$updComplaint->execute()) {
                throw new Exception('Failed to update complaint after expired appointment.');
            }

            $insLog = $conn->prepare("
                INSERT INTO case_updates (complaint_id, status, note, updated_by)
                VALUES (?, ?, ?, 'System')
            ");
            $insLog->bind_param('iss', $complaintId, $nextComplaintStatus, $note);
            if (!$insLog->execute()) {
                throw new Exception('Failed to log expired appointment action.');
            }

            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
            error_log('syncExpiredPendingAppointments item failed: ' . $e->getMessage());
        }
    }
}
?>
