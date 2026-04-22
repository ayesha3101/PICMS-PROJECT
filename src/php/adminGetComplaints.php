<?php
// adminGetComplaints.php
// Returns all complaints with category, station, assigned officer.
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
            c.complaint_id,
            c.reference_number,
            c.cnic,
            c.status,
            c.incident_area,
            c.submitted_at,
            c.rejection_reason,
            cc.category_name,
            cc.category_id,
            cc.is_urgent,
            COALESCE(cs.subcategory_name, '') AS subcategory_name,
            s.station_name,
            s.station_id,
            (SELECT o.full_name FROM case_assignments ca
             JOIN officers o ON ca.officer_id = o.officer_id
             WHERE ca.complaint_id = c.complaint_id AND ca.is_current = 1
             LIMIT 1) AS assigned_officer
        FROM complaints c
        JOIN complaint_categories cc ON c.category_id = cc.category_id
        LEFT JOIN complaint_subcategories cs ON c.subcategory_id = cs.subcategory_id
        LEFT JOIN stations s ON c.station_id = s.station_id
        ORDER BY c.submitted_at DESC
    ");

    $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // fetch timeline for each complaint
    $timelineStmt = $pdo->prepare("
        SELECT status, note, updated_by, updated_at
        FROM case_updates
        WHERE complaint_id = :id
        ORDER BY updated_at ASC
    ");

    foreach ($complaints as &$complaint) {
        $timelineStmt->execute([':id' => $complaint['complaint_id']]);
        $complaint['timeline'] = $timelineStmt->fetchAll(PDO::FETCH_ASSOC);
        $complaint['is_urgent'] = (bool) $complaint['is_urgent'];
    }
    unset($complaint);

    echo json_encode(['success' => true, 'complaints' => $complaints]);
} catch (PDOException $e) {
    error_log('adminGetComplaints: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}