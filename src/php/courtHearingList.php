<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// Auth check - officers only
if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$station_id = (int)($_SESSION['station_id'] ?? 0);
$filter = trim($_GET['filter'] ?? 'upcoming'); // upcoming, completed, all
$limit = (int)($_GET['limit'] ?? 100);
$offset = (int)($_GET['offset'] ?? 0);

// Validate inputs
if ($limit > 500) $limit = 500; // Cap at 500
if ($offset < 0) $offset = 0;
if (!in_array($filter, ['upcoming', 'completed', 'all'], true)) {
    $filter = 'upcoming';
}

try {
    // Build query based on filter
    $query = "
        SELECT
            h.hearing_id,
            h.hearing_date,
            h.hearing_time,
            h.hearing_type,
            h.court_name,
            h.result,
            h.next_hearing_date,
            h.notes,
            d.detainee_id,
            d.station_id,
            s.station_name,
            CONCAT(d.d_fname, ' ', COALESCE(d.d_minit, ''), ' ', d.d_lname) AS detainee_name,
            c.complaint_id,
            c.reference_number
        FROM court_hearings h
        JOIN detainees d ON d.detainee_id = h.detainee_id
        JOIN stations s ON s.station_id = d.station_id
        LEFT JOIN complaints c ON c.complaint_id = h.complaint_id
        WHERE d.station_id = ?
    ";

    if ($filter === 'upcoming') {
        $query .= " AND h.hearing_date >= CURDATE() AND h.result IS NULL";
        $orderBy = "h.hearing_date ASC";
    } elseif ($filter === 'completed') {
        $query .= " AND (h.result IS NOT NULL OR h.hearing_date < CURDATE())";
        $orderBy = "h.hearing_date DESC";
    } else {
        $orderBy = "h.hearing_date DESC";
    }

    $query .= " ORDER BY $orderBy LIMIT ? OFFSET ?";

    $stmt = $conn->prepare($query);
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

    $stmt->bind_param('iii', $station_id, $limit, $offset);
    if (!$stmt->execute()) throw new Exception("Query failed: " . $stmt->error);

    $result = $stmt->get_result();
    $hearings = [];

    while ($row = $result->fetch_assoc()) {
        $hearings[] = $row;
    }
    $stmt->close();

    // Get total count for pagination
    $countQuery = "
        SELECT COUNT(*) as total
        FROM court_hearings h
        JOIN detainees d ON d.detainee_id = h.detainee_id
        WHERE d.station_id = ?
    ";

    if ($filter === 'upcoming') {
        $countQuery .= " AND h.hearing_date >= CURDATE() AND h.result IS NULL";
    } elseif ($filter === 'completed') {
        $countQuery .= " AND (h.result IS NOT NULL OR h.hearing_date < CURDATE())";
    }

    $countStmt = $conn->prepare($countQuery);
    if (!$countStmt) throw new Exception("Count prepare failed: " . $conn->error);

    $countStmt->bind_param('i', $station_id);
    if (!$countStmt->execute()) throw new Exception("Count query failed: " . $countStmt->error);

    $countResult = $countStmt->get_result()->fetch_assoc();
    $total = (int)$countResult['total'];
    $countStmt->close();

    echo json_encode([
        'success' => true,
        'hearings' => $hearings,
        'count' => count($hearings),
        'total' => $total,
        'filter' => $filter,
        'offset' => $offset,
        'limit' => $limit,
        'pagination' => [
            'current_page' => (int)($offset / $limit) + 1,
            'total_pages' => (int)ceil($total / $limit),
            'has_more' => ($offset + $limit) < $total
        ]
    ]);

} catch (Exception $e) {
    error_log('courtHearingList: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch hearings. Please try again.',
        'error' => $e->getMessage()
    ]);
}
?>
