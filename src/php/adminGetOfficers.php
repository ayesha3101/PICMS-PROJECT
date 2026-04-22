<?php
// adminGetOfficers.php
// Returns all officers with station name and role name.
// Admin uses this read-only — officer management (add/edit/delete) is NOT admin's job.
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
            o.officer_id,
            o.full_name,
            o.badge_number,
            o.email,
            o.rank,
            o.active_caseload,
            o.is_active,
            o.station_id,
            COALESCE(s.station_name, '') AS station_name,
            o.role_id,
            r.role_name
        FROM officers o
        LEFT JOIN stations s ON o.station_id = s.station_id
        JOIN officer_roles r ON o.role_id = r.role_id
        ORDER BY o.full_name ASC
    ");

    $officers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast types
    foreach ($officers as &$o) {
        $o['officer_id']     = (int)$o['officer_id'];
        $o['station_id']     = $o['station_id'] ? (int)$o['station_id'] : null;
        $o['role_id']        = (int)$o['role_id'];
        $o['active_caseload']= (int)$o['active_caseload'];
        $o['is_active']      = (bool)$o['is_active'];
    }
    unset($o);

    echo json_encode(['success' => true, 'officers' => $officers]);
} catch (PDOException $e) {
    error_log('adminGetOfficers: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}