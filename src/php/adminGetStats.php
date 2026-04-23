<?php
// adminGetStats.php
// Returns real dashboard stat counts from DB.
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']); exit;
}

try {
    $officers = (int) $conn->query("
        SELECT COUNT(*) FROM officers WHERE is_active = 1
    ")->fetch_row()[0];

    $activeComplaints = (int) $conn->query("
        SELECT COUNT(*) FROM complaints
        WHERE status NOT IN ('Resolved','Closed','Rejected','Withdrawn')
    ")->fetch_row()[0];

    $resolved = (int) $conn->query("
        SELECT COUNT(*) FROM complaints
        WHERE status = 'Resolved'
          AND MONTH(submitted_at) = MONTH(NOW())
          AND YEAR(submitted_at)  = YEAR(NOW())
    ")->fetch_row()[0];

    $urgent = (int) $conn->query("
        SELECT COUNT(*) FROM complaints c
        JOIN complaint_categories cc ON c.category_id = cc.category_id
        WHERE cc.is_urgent = 1
          AND c.status NOT IN ('Resolved','Closed','Rejected','Withdrawn')
    ")->fetch_row()[0];

    echo json_encode([
        'success'           => true,
        'officers'          => $officers,
        'active_complaints' => $activeComplaints,
        'resolved'          => $resolved,
        'urgent'            => $urgent,
    ]);
} catch (Exception $e) {
    error_log('adminGetStats: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}