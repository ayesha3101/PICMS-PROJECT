<?php
// adminManageSuperintendent.php
// action=appoint : appoint an officer as Jail Superintendent for a station
// action=remove  : remove current Superintendent
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid method.']); exit;
}

$input     = json_decode(file_get_contents('php://input'), true);
$action    = trim($input['action']      ?? '');
$stationId = (int)($input['station_id'] ?? 0);

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    if ($action === 'appoint') {
        $officerId = (int)($input['officer_id'] ?? 0);
        if (!$stationId || !$officerId) {
            echo json_encode(['success' => false, 'message' => 'station_id and officer_id required.']); exit;
        }

        // trigger before_superintendent_appoint retires old one automatically
        $stmt = $pdo->prepare("
            INSERT INTO station_superintendent_assignments (station_id, officer_id, appointed_by, is_current)
            VALUES (:station, :officer, :admin, 1)
        ");
        $stmt->execute([
            ':station' => $stationId,
            ':officer' => $officerId,
            ':admin'   => $_SESSION['admin_id'],
        ]);

        // update officer role_id to Jail Superintendent (3)
        $pdo->prepare("UPDATE officers SET role_id = 3 WHERE officer_id = :id")
            ->execute([':id' => $officerId]);

        echo json_encode(['success' => true]);

    } elseif ($action === 'remove') {
        $removeType = trim($input['remove_type'] ?? 'position');
        $reason     = trim($input['reason']       ?? '');

        $cur = $pdo->prepare("
            SELECT officer_id FROM station_superintendent_assignments
            WHERE station_id = :s AND is_current = 1 LIMIT 1
        ");
        $cur->execute([':s' => $stationId]);
        $row = $cur->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'No current Superintendent found.']); exit;
        }
        $officerId = $row['officer_id'];

        $pdo->prepare("
            UPDATE station_superintendent_assignments
            SET is_current = 0, removed_at = NOW(), removal_reason = :reason
            WHERE station_id = :s AND is_current = 1
        ")->execute([':reason' => $reason, ':s' => $stationId]);

        if ($removeType === 'duty') {
            $pdo->prepare("UPDATE officers SET is_active = 0, role_id = 1 WHERE officer_id = :id")
                ->execute([':id' => $officerId]);
        } else {
            $pdo->prepare("UPDATE officers SET role_id = 1 WHERE officer_id = :id")
                ->execute([':id' => $officerId]);
        }

        echo json_encode(['success' => true]);

    } else {
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
    }

} catch (PDOException $e) {
    error_log('adminManageSuperintendent: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}