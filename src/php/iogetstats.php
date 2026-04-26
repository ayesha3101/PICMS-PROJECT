<?php
// ioGetStats.php — IO Dashboard Stats
// Uses mysqli via $conn from config.php.

require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    $_SESSION['role'] !== 'officer' ||
    (int) $_SESSION['role_id'] !== 1
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$officerId = (int) $_SESSION['officer_id'];

// Total cases ever assigned to this IO (all time, all is_current values)
$stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM case_assignments WHERE officer_id = ?");
$stmt->bind_param('i', $officerId);
$stmt->execute();
$totalCases = (int) $stmt->get_result()->fetch_assoc()['cnt'];
$stmt->close();

// Active cases (currently assigned, status is active)
$stmt = $conn->prepare("
    SELECT COUNT(*) AS cnt
    FROM case_assignments ca
    JOIN complaints c ON ca.complaint_id = c.complaint_id
    WHERE ca.officer_id = ?
      AND ca.is_current = 1
      AND c.status IN ('Officer Assigned', 'Investigation Ongoing')
");
$stmt->bind_param('i', $officerId);
$stmt->execute();
$activeCases = (int) $stmt->get_result()->fetch_assoc()['cnt'];
$stmt->close();

// Resolved cases (any assignment, resolved/closed status)
$stmt = $conn->prepare("
    SELECT COUNT(*) AS cnt
    FROM case_assignments ca
    JOIN complaints c ON ca.complaint_id = c.complaint_id
    WHERE ca.officer_id = ?
      AND c.status IN ('Resolved', 'Closed')
");
$stmt->bind_param('i', $officerId);
$stmt->execute();
$resolvedCases = (int) $stmt->get_result()->fetch_assoc()['cnt'];
$stmt->close();

echo json_encode([
    'success'       => true,
    'totalCases'    => $totalCases,
    'activeCases'   => $activeCases,
    'resolvedCases' => $resolvedCases,
]);