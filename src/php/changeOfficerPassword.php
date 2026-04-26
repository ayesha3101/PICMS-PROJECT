<?php
// changeOfficerPassword.php
// Called immediately after first login when password_changed = 0.
// Sets new password hash and flips password_changed to 1.
// Requires active officer session.
// Uses mysqli via $conn from config.php.

require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

// Must be logged in as officer
if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

// Extra guard — prevent re-calling after password already changed
if (!empty($_SESSION['password_changed'])) {
    echo json_encode(['success' => false, 'message' => 'Password already set.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input       = json_decode(file_get_contents('php://input'), true);
$newPassword = $input['new_password'] ?? '';

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}

$hash      = password_hash($newPassword, PASSWORD_DEFAULT);
$officerId = (int) $_SESSION['officer_id'];

$stmt = $conn->prepare("
    UPDATE officers
    SET password_hash = ?, password_changed = 1
    WHERE officer_id = ?
");
$stmt->bind_param('si', $hash, $officerId);

if (!$stmt->execute()) {
    $stmt->close();
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
    exit;
}
$stmt->close();

// Update session so subsequent checks reflect the change
$_SESSION['password_changed'] = true;

echo json_encode([
    'success' => true,
    'role_id' => (int) ($_SESSION['role_id'] ?? 1),
]);