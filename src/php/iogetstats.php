<?php
// ioGetStats.php — IO Dashboard Stats
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    $_SESSION['role'] !== 'officer' ||
    (int)$_SESSION['role_id'] !== 1
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$officerId = (int)$_SESSION['officer_id'];

// Total cases assigned to this IO
$result     = $conn->query("SELECT COUNT(*) AS cnt FROM case_assignments WHERE officer_id = $officerId");
$totalCases = (int)$result->fetch_assoc()['cnt'];

// Active cases
$result     = $conn->query("
    SELECT COUNT(*) AS cnt
    FROM case_assignments ca
    JOIN complaints c ON ca.complaint_id = c.complaint_id
    WHERE ca.officer_id = $officerId
      AND ca.is_current = 1
      AND c.status IN ('Officer Assigned', 'Investigation Ongoing')
");
$activeCases = (int)$result->fetch_assoc()['cnt'];

// Resolved cases
$result       = $conn->query("
    SELECT COUNT(*) AS cnt
    FROM case_assignments ca
    JOIN complaints c ON ca.complaint_id = c.complaint_id
    WHERE ca.officer_id = $officerId
      AND c.status IN ('Resolved', 'Closed')
");
$resolvedCases = (int)$result->fetch_assoc()['cnt'];

echo json_encode([
    'success'       => true,
    'totalCases'    => $totalCases,
    'activeCases'   => $activeCases,
    'resolvedCases' => $resolvedCases,
]);