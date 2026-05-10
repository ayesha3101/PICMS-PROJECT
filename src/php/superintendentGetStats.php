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
if (!$stationId) {
    echo json_encode(['success' => false, 'message' => 'No station assigned.']);
    exit;
}

try {
    $q1 = $conn->prepare("
        SELECT total_cases, open_cases, closed_cases
        FROM vw_station_case_stats
        WHERE station_id = ?
        LIMIT 1
    ");
    if (!$q1) throw new Exception("Prepare failed: " . $conn->error);
    $q1->bind_param('i', $stationId);
    if (!$q1->execute()) throw new Exception("Query failed: " . $q1->error);
    $stationStats = $q1->get_result()->fetch_assoc() ?: ['total_cases' => 0, 'open_cases' => 0, 'closed_cases' => 0];
    $q1->close();

    $q2 = $conn->prepare("SELECT COUNT(*) AS cnt FROM detainees WHERE station_id = ? AND release_date IS NULL");
    if (!$q2) throw new Exception("Prepare failed: " . $conn->error);
    $q2->bind_param('i', $stationId);
    if (!$q2->execute()) throw new Exception("Query failed: " . $q2->error);
    $activeDetainees = (int)$q2->get_result()->fetch_assoc()['cnt'];
    $q2->close();

    $q3 = $conn->prepare("SELECT COUNT(*) AS cnt FROM jail_cells WHERE station_id = ?");
    if (!$q3) throw new Exception("Prepare failed: " . $conn->error);
    $q3->bind_param('i', $stationId);
    if (!$q3->execute()) throw new Exception("Query failed: " . $q3->error);
    $cells = (int)$q3->get_result()->fetch_assoc()['cnt'];
    $q3->close();

    $q4 = $conn->prepare("
        SELECT COUNT(*) AS cnt
        FROM vw_hearing_calendar
        WHERE station_id = ? AND hearing_date >= CURDATE()
    ");
    if (!$q4) throw new Exception("Prepare failed: " . $conn->error);
    $q4->bind_param('i', $stationId);
    if (!$q4->execute()) throw new Exception("Query failed: " . $q4->error);
    $upcomingHearings = (int)$q4->get_result()->fetch_assoc()['cnt'];
    $q4->close();

    echo json_encode([
        'success' => true,
        'total_cases' => (int)$stationStats['total_cases'],
        'open_cases' => (int)$stationStats['open_cases'],
        'closed_cases' => (int)$stationStats['closed_cases'],
        'active_detainees' => $activeDetainees,
        'cells' => $cells,
        'upcoming_hearings' => $upcomingHearings,
    ]);
} catch (Exception $e) {
    error_log('superintendentGetStats: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch stats. Please try again.',
        'error' => $e->getMessage()
    ]);
}
