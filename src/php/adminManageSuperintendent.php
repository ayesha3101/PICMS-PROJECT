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

if (!$stationId) {
    echo json_encode(['success' => false, 'message' => 'station_id required.']); exit;
}

if ($action === 'appoint') {
    $officerId = (int)($input['officer_id'] ?? 0);
    if (!$officerId) {
        echo json_encode(['success' => false, 'message' => 'officer_id required.']); exit;
    }

    // Verify officer exists and is active
    $chk = $conn->prepare("SELECT officer_id FROM officers WHERE officer_id = ? AND is_active = 1");
    $chk->bind_param("i", $officerId);
    $chk->execute();
    if (!$chk->get_result()->fetch_assoc()) {
        echo json_encode(['success' => false, 'message' => 'Officer not found or inactive.']); exit;
    }
    $chk->close();

    $conn->begin_transaction();

    // Get existing current superintendent for this station
    $cur = $conn->prepare("
        SELECT officer_id FROM station_superintendent_assignments
        WHERE station_id = ? AND is_current = 1 LIMIT 1
    ");
    $cur->bind_param("i", $stationId);
    $cur->execute();
    $existing = $cur->get_result()->fetch_assoc();
    $cur->close();

    if ($existing) {
        // Retire existing superintendent assignment
        $upd = $conn->prepare("
            UPDATE station_superintendent_assignments
            SET is_current = 0, removed_at = NOW()
            WHERE station_id = ? AND is_current = 1
        ");
        $upd->bind_param("i", $stationId);
        $upd->execute();
        $upd->close();

        // Demote previous superintendent back to Investigating Officer
        $dem = $conn->prepare("UPDATE officers SET role_id = 1 WHERE officer_id = ?");
        $dem->bind_param("i", $existing['officer_id']);
        $dem->execute();
        $dem->close();
    }

    // Insert new superintendent assignment
    $ins = $conn->prepare("
        INSERT INTO station_superintendent_assignments (station_id, officer_id, appointed_by, is_current)
        VALUES (?, ?, ?, 1)
    ");
    $ins->bind_param("iii", $stationId, $officerId, $_SESSION['admin_id']);
    $ins->execute();
    $ins->close();

    // Promote officer to Jail Superintendent role (role_id = 3)
    $pro = $conn->prepare("UPDATE officers SET role_id = 3, station_id = ? WHERE officer_id = ?");
    $pro->bind_param("ii", $stationId, $officerId);
    $pro->execute();
    $pro->close();

    if ($conn->errno) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']); exit;
    }

    $conn->commit();
    echo json_encode(['success' => true]);

} elseif ($action === 'remove') {
    $removeType = trim($input['remove_type'] ?? 'position');
    $reason     = trim($input['reason']       ?? '');

    // Get current superintendent
    $cur = $conn->prepare("
        SELECT officer_id FROM station_superintendent_assignments
        WHERE station_id = ? AND is_current = 1 LIMIT 1
    ");
    $cur->bind_param("i", $stationId);
    $cur->execute();
    $row = $cur->get_result()->fetch_assoc();
    $cur->close();

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'No current Superintendent found for this station.']); exit;
    }
    $officerId = $row['officer_id'];

    $conn->begin_transaction();

    // Retire assignment
    $upd = $conn->prepare("
        UPDATE station_superintendent_assignments
        SET is_current = 0, removed_at = NOW(), removal_reason = ?
        WHERE station_id = ? AND is_current = 1
    ");
    $upd->bind_param("si", $reason, $stationId);
    $upd->execute();
    $upd->close();

    if ($removeType === 'duty') {
        // Deactivate officer entirely
        $dem = $conn->prepare("UPDATE officers SET is_active = 0, role_id = 1 WHERE officer_id = ?");
    } else {
        // Just demote back to Investigating Officer, keep active
        $dem = $conn->prepare("UPDATE officers SET role_id = 1 WHERE officer_id = ?");
    }
    $dem->bind_param("i", $officerId);
    $dem->execute();
    $dem->close();

    if ($conn->errno) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']); exit;
    }

    $conn->commit();
    echo json_encode(['success' => true]);

} else {
    echo json_encode(['success' => false, 'message' => 'Unknown action. Use appoint or remove.']);
}