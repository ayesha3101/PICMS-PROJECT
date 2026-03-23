<?php
// ══════════════════════════════════════════════
// updateProfile.php
// Job: update citizen name fields only
//      email and CNIC are locked — never updated here
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// ── Guard: must be logged in
if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];
$data = json_decode(file_get_contents('php://input'), true);

$fname = trim($data['c_fname'] ?? '');
$minit = trim($data['c_minit'] ?? '');
$lname = trim($data['c_lname'] ?? '');

// ── Server-side validation — only name fields allowed
if (strlen($fname) < 2) {
    echo json_encode(['success' => false, 'message' => 'First name must be at least 2 characters']);
    exit;
}
if (strlen($lname) < 2) {
    echo json_encode(['success' => false, 'message' => 'Last name must be at least 2 characters']);
    exit;
}

// ── Update name fields only — email and CNIC deliberately excluded
/*SQL — UPDATE citizen name fields, CNIC and email intentionally not touched */
$stmt = $conn->prepare("
    UPDATE citizens
    SET c_fname = ?, c_minit = ?, c_lname = ?
    WHERE cnic = ?
");
/*END*/
$stmt->bind_param("ssss", $fname, $minit, $lname, $cnic);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to update profile. Please try again.']);
    exit;
}

// ── Update session name to reflect the change immediately
$_SESSION['citizen_name'] = trim("$fname $lname");

echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
?>