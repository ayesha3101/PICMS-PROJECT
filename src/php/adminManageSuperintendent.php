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

    // Verify station exists
    $stChk = $conn->prepare("SELECT station_id FROM stations WHERE station_id = ? LIMIT 1");
    $stChk->bind_param("i", $stationId);
    $stChk->execute();
    if (!$stChk->get_result()->fetch_assoc()) {
        echo json_encode(['success' => false, 'message' => 'Station not found.']); exit;
    }
    $stChk->close();

    // Verify officer exists, is active, and belongs to selected station
    $chk = $conn->prepare("
        SELECT officer_id, role_id, station_id
        FROM officers
        WHERE officer_id = ? AND is_active = 1
        LIMIT 1
    ");
    $chk->bind_param("i", $officerId);
    $chk->execute();
    $officer = $chk->get_result()->fetch_assoc();
    if (!$officer) {
        echo json_encode(['success' => false, 'message' => 'Officer not found or inactive.']); exit;
    }
    $chk->close();
    if ((int)$officer['station_id'] !== $stationId) {
        echo json_encode(['success' => false, 'message' => 'Officer must belong to the selected station.']); exit;
    }
    if ((int)$officer['role_id'] === 2) {
        echo json_encode(['success' => false, 'message' => 'Current SHO cannot be appointed as superintendent.']); exit;
    }

    $conn->begin_transaction();
    try {
        // Ensure officer is not already current SHO/Superintendent for any station
        $assignedElsewhere = $conn->prepare("
            SELECT
                EXISTS(SELECT 1 FROM station_sho_assignments sa WHERE sa.officer_id = ? AND sa.is_current = 1) AS in_sho,
                EXISTS(SELECT 1 FROM station_superintendent_assignments ssa WHERE ssa.officer_id = ? AND ssa.is_current = 1) AS in_supt
        ");
        $assignedElsewhere->bind_param("ii", $officerId, $officerId);
        $assignedElsewhere->execute();
        $a = $assignedElsewhere->get_result()->fetch_assoc();
        $assignedElsewhere->close();
        if (!empty($a['in_sho']) || !empty($a['in_supt'])) {
            throw new Exception('Officer already holds a current station leadership assignment.');
        }

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
            throw new Exception('Server error');
        }

        $conn->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage() ?: 'Server error. Please try again.']);
    }

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