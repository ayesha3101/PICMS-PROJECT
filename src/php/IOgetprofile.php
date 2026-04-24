<?php
// ioGetProfile.php — Returns logged-in IO's profile + station name
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
    // 2. Use the global $conn (MySQLi object) from your config
    global $conn;
    $officerId = (int)$_SESSION['officer_id'];

    // 3. Prepare the MySQLi statement
    $query = "
        SELECT 
            o.full_name, 
            o.badge_number, 
            o.email, 
            o.rank, 
            o.active_caseload, 
            s.station_name, 
            s.area_covered
        FROM officers o
        LEFT JOIN stations s ON o.station_id = s.station_id
        WHERE o.officer_id = ?
        LIMIT 1
    ";

    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    // 4. Bind parameters ("i" for integer) and execute
    $stmt->bind_param("i", $officerId);
    $stmt->execute();
    
    // 5. Get results
    $result = $stmt->get_result();
    $officer = $result->fetch_assoc();

    if (!$officer) {
        echo json_encode(['success' => false, 'message' => 'Officer not found.']);
        exit;
    }

    // 6. Output JSON
    echo json_encode([
        'success'         => true,
        'full_name'       => $officer['full_name'],
        'badge_number'    => $officer['badge_number'],
        'email'           => $officer['email'],
        'rank'            => $officer['rank'],
        'active_caseload' => $officer['active_caseload'],
        'station_name'    => $officer['station_name'] ?? 'Unassigned',
        'area_covered'    => $officer['area_covered']  ?? '—',
    ]);

    $stmt->close();

} catch (Exception $e) {
    error_log('ioGetProfile.php Error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error.']);
}