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
$filter = trim($_GET['filter'] ?? 'all');
$limit = (int)($_GET['limit'] ?? 500);
$offset = (int)($_GET['offset'] ?? 0);

if ($limit > 500) $limit = 500;
if ($offset < 0) $offset = 0;
if (!in_array($filter, ['upcoming', 'completed', 'all'], true)) {
    $filter = 'all';
}

try {
    $query = "
        SELECT
            hearing_id,
            hearing_date,
            hearing_time,
            hearing_type,
            court_name,
            result,
            next_hearing_date,
            detainee_id,
            detainee_name,
            gender,
            reference_number
        FROM vw_hearing_calendar
        WHERE station_id = ?
    ";

    if ($filter === 'upcoming') {
        $query .= " AND hearing_date >= CURDATE() AND result IS NULL";
    } elseif ($filter === 'completed') {
        $query .= " AND (result IS NOT NULL OR hearing_date < CURDATE())";
    }

    $query .= " ORDER BY hearing_date DESC, hearing_time DESC LIMIT ? OFFSET ?";

    $stmt = $conn->prepare($query);
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

    $stmt->bind_param('iii', $stationId, $limit, $offset);
    if (!$stmt->execute()) throw new Exception("Query failed: " . $stmt->error);

    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(['success' => true, 'hearings' => $rows, 'filter' => $filter]);
} catch (Exception $e) {
    error_log('superintendentGetHearings: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch hearings. Please try again.',
        'error' => $e->getMessage()
    ]);
}
