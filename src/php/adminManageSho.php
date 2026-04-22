<?php
// adminManageSHO.php
// action=appoint : appoint an officer as SHO for a station
// action=remove  : remove current SHO (optionally deactivate officer)
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

if (!$stationId) {
    echo json_encode(['success' => false, 'message' => 'station_id required.']); exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    if ($action === 'appoint') {
        $officerId = (int)($input['officer_id'] ?? 0);
        if (!$officerId) {
            echo json_encode(['success' => false, 'message' => 'officer_id required.']); exit;
        }

        // Verify officer exists and is active
        $chk = $pdo->prepare("SELECT officer_id FROM officers WHERE officer_id = :id AND is_active = 1");
        $chk->execute([':id' => $officerId]);
        if (!$chk->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Officer not found or inactive.']); exit;
        }

        $pdo->beginTransaction();

        // Retire any existing current SHO assignment for this station
        // Also demote that officer back to role_id=1 (Investigating Officer)
        $cur = $pdo->prepare("
            SELECT officer_id FROM station_sho_assignments
            WHERE station_id = :s AND is_current = 1 LIMIT 1
        ");
        $cur->execute([':s' => $stationId]);
        $existing = $cur->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $pdo->prepare("
                UPDATE station_sho_assignments
                SET is_current = 0, removed_at = NOW()
                WHERE station_id = :s AND is_current = 1
            ")->execute([':s' => $stationId]);

            // Demote previous SHO back to Investigating Officer
            $pdo->prepare("UPDATE officers SET role_id = 1 WHERE officer_id = :id")
                ->execute([':id' => $existing['officer_id']]);
        }

        // Insert new SHO assignment
        $pdo->prepare("
            INSERT INTO station_sho_assignments (station_id, officer_id, appointed_by, is_current)
            VALUES (:station, :officer, :admin, 1)
        ")->execute([
            ':station' => $stationId,
            ':officer' => $officerId,
            ':admin'   => $_SESSION['admin_id'],
        ]);

        // Promote officer to SHO role (role_id = 2)
        $pdo->prepare("UPDATE officers SET role_id = 2, station_id = :st WHERE officer_id = :id")
            ->execute([':st' => $stationId, ':id' => $officerId]);

        $pdo->commit();
        echo json_encode(['success' => true]);

    } elseif ($action === 'remove') {
        $removeType = trim($input['remove_type'] ?? 'position');
        $reason     = trim($input['reason']       ?? '');

        // Get current SHO
        $cur = $pdo->prepare("
            SELECT officer_id FROM station_sho_assignments
            WHERE station_id = :s AND is_current = 1 LIMIT 1
        ");
        $cur->execute([':s' => $stationId]);
        $row = $cur->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'No current SHO found for this station.']); exit;
        }
        $officerId = $row['officer_id'];

        $pdo->beginTransaction();

        // Retire assignment
        $pdo->prepare("
            UPDATE station_sho_assignments
            SET is_current = 0, removed_at = NOW(), removal_reason = :reason
            WHERE station_id = :s AND is_current = 1
        ")->execute([':reason' => $reason, ':s' => $stationId]);

        if ($removeType === 'duty') {
            // Deactivate officer entirely
            $pdo->prepare("UPDATE officers SET is_active = 0, role_id = 1 WHERE officer_id = :id")
                ->execute([':id' => $officerId]);
        } else {
            // Just demote back to Investigating Officer, keep active
            $pdo->prepare("UPDATE officers SET role_id = 1 WHERE officer_id = :id")
                ->execute([':id' => $officerId]);
        }

        $pdo->commit();
        echo json_encode(['success' => true]);

    } else {
        echo json_encode(['success' => false, 'message' => 'Unknown action. Use appoint or remove.']);
    }

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log('adminManageSHO: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}