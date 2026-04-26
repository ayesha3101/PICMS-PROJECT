<?php
// officerLogin.php — Investigating Officer / SHO / Superintendent login.
// Role is determined purely by officers.role_id (FK to officer_roles).
// role_id 1 = Investigating Officer
// role_id 2 = SHO
// role_id 3 = Jail Superintendent
// Uses mysqli via $conn from config.php.

require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$password = $input['password']          ?? '';
$badge    = trim($input['badge_number'] ?? '');
$email    = trim($input['email']        ?? '');

if (empty($password) || (empty($badge) && empty($email))) {
    echo json_encode(['success' => false, 'message' => 'Credentials are required.']);
    exit;
}

// Fetch officer by badge OR email
if (!empty($badge)) {
    $stmt = $conn->prepare("SELECT * FROM officers WHERE badge_number = ? LIMIT 1");
    $stmt->bind_param('s', $badge);
} else {
    $stmt = $conn->prepare("SELECT * FROM officers WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
}
$stmt->execute();
$officer = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$officer || !password_verify($password, $officer['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials. Please try again.']);
    exit;
}

if (!$officer['is_active']) {
    echo json_encode(['success' => false, 'message' => 'Your account has been deactivated. Contact admin.']);
    exit;
}

// Fetch role name from officer_roles
$rStmt = $conn->prepare("SELECT role_name FROM officer_roles WHERE role_id = ? LIMIT 1");
$rStmt->bind_param('i', $officer['role_id']);
$rStmt->execute();
$roleRow  = $rStmt->get_result()->fetch_assoc();
$roleName = $roleRow['role_name'] ?? 'Investigating Officer';
$rStmt->close();

session_regenerate_id(true);
$_SESSION['officer_id']       = (int)  $officer['officer_id'];
$_SESSION['officer_name']     =        $officer['full_name'];
$_SESSION['badge_number']     =        $officer['badge_number'];
$_SESSION['rank']             =        $officer['rank'];
$_SESSION['station_id']       =        $officer['station_id'];
$_SESSION['role_id']          = (int)  $officer['role_id'];
$_SESSION['password_changed'] = (bool) $officer['password_changed'];
$_SESSION['role']             = 'officer';

echo json_encode([
    'success'          => true,
    'role_id'          => (int)  $officer['role_id'],
    'role_name'        => $roleName,
    'password_changed' => (bool) $officer['password_changed'],
    'name'             => $officer['full_name'],
    'rank'             => $officer['rank'],
]);