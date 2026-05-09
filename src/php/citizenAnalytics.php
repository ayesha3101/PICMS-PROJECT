<?php
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];

// Advanced query: Monthly summary of complaints and appointments
// Includes: Joins, GROUP BY, window functions (OVER for running totals), DATE_FORMAT, CASE WHEN, dynamic input (CNIC)
$query = "
    WITH complaint_summary AS (
        SELECT
            DATE_FORMAT(c.created_at, '%Y-%m') AS month,
            COUNT(c.complaint_id) AS total_complaints,
            SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_complaints,
            cc.category_name
        FROM complaints c
        JOIN complaint_categories cc ON c.category_id = cc.category_id
        WHERE c.cnic = ?
        GROUP BY DATE_FORMAT(c.created_at, '%Y-%m'), cc.category_name
        HAVING COUNT(c.complaint_id) > 0
    ),
    appointment_summary AS (
        SELECT
            DATE_FORMAT(v.scheduled_date, '%Y-%m') AS month,
            COUNT(v.appointment_id) AS total_appointments,
            SUM(CASE WHEN v.status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments
        FROM vw_appointment_details v
        WHERE v.cnic = ?
        GROUP BY DATE_FORMAT(v.scheduled_date, '%Y-%m')
    )
    SELECT
        cs.month,
        cs.category_name,
        cs.total_complaints,
        cs.resolved_complaints,
        COALESCE(ap.total_appointments, 0) AS total_appointments,
        COALESCE(ap.completed_appointments, 0) AS completed_appointments,
        SUM(cs.total_complaints) OVER (PARTITION BY cs.month ORDER BY cs.total_complaints DESC) AS running_complaint_total
    FROM complaint_summary cs
    LEFT JOIN appointment_summary ap ON cs.month = ap.month
    ORDER BY cs.month DESC, cs.total_complaints DESC
";

$stmt = $conn->prepare($query);
$stmt->bind_param('ss', $cnic, $cnic);
$stmt->execute();
$result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(['success' => true, 'analytics' => $result]);
?></content>
<parameter name="filePath">c:\xampp\htdocs\PICMS-PROJECT\src\php\citizenAnalytics.php