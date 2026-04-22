<?php
// adminGetStations.php
// Returns all stations with officer count, case count, current SHO, current superintendent.
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']); exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->query("
        SELECT
            s.station_id,
            s.station_name,
            s.area_covered,
            s.address,
            s.phone,
            (SELECT COUNT(*) FROM officers o WHERE o.station_id = s.station_id AND o.is_active = 1) AS officer_count,
            (SELECT COUNT(*) FROM complaints c
             WHERE c.station_id = s.station_id
               AND c.status NOT IN ('Resolved','Closed','Rejected','Withdrawn')) AS case_count,
            (SELECT o2.full_name FROM station_sho_assignments sa
             JOIN officers o2 ON sa.officer_id = o2.officer_id
             WHERE sa.station_id = s.station_id AND sa.is_current = 1
             LIMIT 1) AS sho_name,
            (SELECT o3.full_name FROM station_superintendent_assignments ssa
             JOIN officers o3 ON ssa.officer_id = o3.officer_id
             WHERE ssa.station_id = s.station_id AND ssa.is_current = 1
             LIMIT 1) AS superintendent_name
        FROM stations s
        ORDER BY s.station_name ASC
    ");

    $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'stations' => $stations]);
} catch (PDOException $e) {
    error_log('adminGetStations: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}