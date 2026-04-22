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
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $officers = (int) $pdo->query("SELECT COUNT(*) FROM officers WHERE is_active = 1")->fetchColumn();

    $activeComplaints = (int) $pdo->query("
        SELECT COUNT(*) FROM complaints
        WHERE status NOT IN ('Resolved','Closed','Rejected','Withdrawn')
    ")->fetchColumn();

    $resolved = (int) $pdo->query("
        SELECT COUNT(*) FROM complaints
        WHERE status = 'Resolved'
          AND MONTH(submitted_at) = MONTH(NOW())
          AND YEAR(submitted_at)  = YEAR(NOW())
    ")->fetchColumn();

    $urgent = (int) $pdo->query("
        SELECT COUNT(*) FROM complaints c
        JOIN complaint_categories cc ON c.category_id = cc.category_id
        WHERE cc.is_urgent = 1
          AND c.status NOT IN ('Resolved','Closed','Rejected','Withdrawn')
    ")->fetchColumn();

    echo json_encode([
        'success'           => true,
        'officers'          => $officers,
        'active_complaints' => $activeComplaints,
        'resolved'          => $resolved,
        'urgent'            => $urgent,
    ]);
} catch (PDOException $e) {
    error_log('adminGetStats: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}