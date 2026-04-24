<?php
// ioGetRecentCases.php — Recent 5 assigned cases for IO dashboard
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// 1. Authorization Check
if (
    empty($_SESSION['officer_id']) ||
    $_SESSION['role'] !== 'officer' ||
    (int)$_SESSION['role_id'] !== 1
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

try {
    // 2. Use the global MySQLi connection from config.php
    global $conn;
    $officerId = (int)$_SESSION['officer_id'];

    // 3. Prepare the query using '?' placeholder instead of ':id'
    $query = "
        SELECT
            c.complaint_id,
            c.reference_number,
            c.cnic,
            c.status,
            c.submitted_at,
            c.incident_area,
            cc.category_name,
            cc.is_urgent,
            ca.assigned_at
        FROM case_assignments ca
        JOIN complaints c  ON ca.complaint_id = c.complaint_id
        JOIN complaint_categories cc ON c.category_id = cc.category_id
        WHERE ca.officer_id = ?
          AND ca.is_current  = 1
        ORDER BY ca.assigned_at DESC
        LIMIT 5
    ";

    $stmt = $conn->prepare($query);

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    // 4. Bind parameters ("i" for integer) and execute
    $stmt->bind_param("i", $officerId);
    $stmt->execute();

    // 5. Get results as an array of associative arrays
    $result = $stmt->get_result();
    $cases = [];
    while ($row = $result->fetch_assoc()) {
        $cases[] = $row;
    }

    // 6. Return JSON response
    echo json_encode(['success' => true, 'cases' => $cases]);

    $stmt->close();

} catch (Exception $e) {
    error_log('ioGetRecentCases.php: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}