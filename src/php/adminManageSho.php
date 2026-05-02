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

if ($action === 'appoint') {
    $officerId = (int)($input['officer_id'] ?? 0);
    if (!$officerId) {
        echo json_encode(['success' => false, 'message' => 'officer_id required.']); exit;
    }

    $stationCheck = $conn->prepare("SELECT station_id FROM stations WHERE station_id = ? LIMIT 1");
    $stationCheck->bind_param("i", $stationId);
    $stationCheck->execute();
    if (!$stationCheck->get_result()->fetch_assoc()) {
        echo json_encode(['success' => false, 'message' => 'Station not found.']); exit;
    }
    $stationCheck->close();

    $officerCheck = $conn->prepare("SELECT officer_id, role_id, station_id FROM officers WHERE officer_id = ? AND is_active = 1 LIMIT 1");
    $officerCheck->bind_param("i", $officerId);
    $officerCheck->execute();
    $officer = $officerCheck->get_result()->fetch_assoc();
    $officerCheck->close();

    if (!$officer) {
        echo json_encode(['success' => false, 'message' => 'Officer not found or inactive.']); exit;
    }
    if ((int)$officer['station_id'] !== $stationId) {
        echo json_encode(['success' => false, 'message' => 'Officer must belong to the selected station.']); exit;
    }
    if ((int)$officer['role_id'] === 3) {
        echo json_encode(['success' => false, 'message' => 'Current Superintendent cannot be appointed as SHO.']); exit;
    }

    $conn->begin_transaction();
    try {
        $cur = $conn->prepare("SELECT officer_id FROM station_sho_assignments WHERE station_id = ? AND is_current = 1 LIMIT 1");
        $cur->bind_param("i", $stationId);
        $cur->execute();
        $existing = $cur->get_result()->fetch_assoc();
        $cur->close();

        if ($existing && (int)$existing['officer_id'] === $officerId) {
            $conn->commit();
            echo json_encode(['success' => true]);
            exit;
        }

        $assignedElsewhere = $conn->prepare(
            "SELECT
                EXISTS(SELECT 1 FROM station_sho_assignments sa WHERE sa.officer_id = ? AND sa.is_current = 1) AS in_sho,
                EXISTS(SELECT 1 FROM station_superintendent_assignments ssa WHERE ssa.officer_id = ? AND ssa.is_current = 1) AS in_supt"
        );
        $assignedElsewhere->bind_param("ii", $officerId, $officerId);
        $assignedElsewhere->execute();
        $status = $assignedElsewhere->get_result()->fetch_assoc();
        $assignedElsewhere->close();

        if (!empty($status['in_sho']) || !empty($status['in_supt'])) {
            throw new Exception('Officer already holds an active leadership assignment.');
        }

        if ($existing) {
            $upd = $conn->prepare("UPDATE station_sho_assignments SET is_current = 0, removed_at = NOW() WHERE station_id = ? AND is_current = 1");
            $upd->bind_param("i", $stationId);
            if (!$upd->execute()) {
                throw new Exception('Failed to retire previous SHO assignment.');
            }
            $upd->close();

            $dem = $conn->prepare("UPDATE officers SET role_id = 1 WHERE officer_id = ?");
            $dem->bind_param("i", $existing['officer_id']);
            if (!$dem->execute()) {
                throw new Exception('Failed to demote previous SHO.');
            }
            $dem->close();
        }

        $ins = $conn->prepare("INSERT INTO station_sho_assignments (station_id, officer_id, appointed_by, is_current) VALUES (?, ?, ?, 1)");
        if (!$ins) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        $ins->bind_param("iii", $stationId, $officerId, $_SESSION['admin_id']);
        if (!$ins->execute()) {
            throw new Exception('Failed to create SHO assignment: ' . $ins->error);
        }
        $ins->close();

        $pro = $conn->prepare("UPDATE officers SET role_id = 2, station_id = ? WHERE officer_id = ?");
        $pro->bind_param("ii", $stationId, $officerId);
        if (!$pro->execute()) {
            throw new Exception('Failed to promote officer to SHO.');
        }
        $pro->close();

        $conn->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage() ?: 'Server error. Please try again.']);
    }

} elseif ($action === 'remove') {
    $removeType = trim($input['remove_type'] ?? 'position');
    $reason     = trim($input['reason']       ?? '');

    // Get current SHO
    $cur = $conn->prepare("
        SELECT officer_id FROM station_sho_assignments
        WHERE station_id = ? AND is_current = 1 LIMIT 1
    ");
    $cur->bind_param("i", $stationId);
    $cur->execute();
    $row = $cur->get_result()->fetch_assoc();
    $cur->close();

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'No current SHO found for this station.']); exit;
    }
    $officerId = $row['officer_id'];

    $conn->begin_transaction();
    try {
        // Retire assignment
        $upd = $conn->prepare("
            UPDATE station_sho_assignments
            SET is_current = 0, removed_at = NOW(), removal_reason = ?
            WHERE station_id = ? AND is_current = 1
        ");
        $upd->bind_param("si", $reason, $stationId);
        if (!$upd->execute()) {
            throw new Exception('Failed to retire SHO assignment.');
        }
        $upd->close();

        // Demote back to Investigating Officer, keep active
        $dem = $conn->prepare("UPDATE officers SET role_id = 1 WHERE officer_id = ?");
        $dem->bind_param("i", $officerId);
        if (!$dem->execute()) {
            throw new Exception('Failed to update officer status.');
        }
        $dem->close();

        $conn->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage() ?: 'Server error. Please try again.']);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Unknown action. Use appoint or remove.']);
}