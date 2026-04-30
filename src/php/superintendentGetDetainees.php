<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    ($_SESSION['role'] ?? '') !== 'officer' ||
    (int)($_SESSION['role_id'] ?? 0) !== 3
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$stationId = (int)($_SESSION['station_id'] ?? 0);

$stmt = $conn->prepare("
    SELECT
        d.detainee_id,
        d.cnic,
        d.d_fname,
        d.d_minit,
        d.d_lname,
        d.age,
        d.gender,
        d.purpose_of_admission,
        d.admission_date,
        d.release_date,
        d.complaint_id,
        c.reference_number,
        jc.cell_id,
        jc.cell_code,
        jc.gender AS cell_gender
    FROM detainees d
    LEFT JOIN complaints c ON c.complaint_id = d.complaint_id
    LEFT JOIN jail_cells jc ON jc.cell_id = d.cell_id
    WHERE d.station_id = ?
    ORDER BY d.admission_date DESC, d.detainee_id DESC
");
$stmt->bind_param('i', $stationId);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(['success' => true, 'detainees' => $rows]);
