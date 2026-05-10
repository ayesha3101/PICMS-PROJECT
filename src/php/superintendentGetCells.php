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

try {
    $stmt = $conn->prepare("
        SELECT
            jc.cell_id,
            jc.cell_code,
            jc.gender,
            jc.capacity,
            COUNT(d.detainee_id) AS occupied,
            (jc.capacity - COUNT(d.detainee_id)) AS available_capacity
        FROM jail_cells jc
        LEFT JOIN detainees d
          ON d.cell_id = jc.cell_id
         AND d.release_date IS NULL
        WHERE jc.station_id = ?
        GROUP BY jc.cell_id, jc.cell_code, jc.gender, jc.capacity
        ORDER BY jc.cell_code ASC
    ");
    if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);
    $stmt->bind_param('i', $stationId);
    if (!$stmt->execute()) throw new Exception("Query failed: " . $stmt->error);
    $cells = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(['success' => true, 'cells' => $cells]);
} catch (Exception $e) {
    error_log('superintendentGetCells: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch cells. Please try again.',
        'error' => $e->getMessage()
    ]);
}
