<?php
// ══════════════════════════════════════════════
// change_password.php
// Job: update citizen password after OTP verified
//      only works if otp_reset_allowed is in session
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// ── Check OTP was verified for password reset
if (empty($_SESSION['otp_reset_allowed']) || empty($_SESSION['otp_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please verify your OTP first.']);
    exit;
}

$data             = json_decode(file_get_contents('php://input'), true);
$new_password     = $data['password']         ?? '';
$confirm_password = $data['confirm_password'] ?? '';
$cnic             = $_SESSION['otp_cnic'];

// ── Validate passwords
if (strlen($new_password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
    exit;
}

if ($new_password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
    exit;
}

// ── Hash and update password
$password_hash = password_hash($new_password, PASSWORD_DEFAULT);
$stmt = $conn->prepare("UPDATE citizens SET password_hash = ? WHERE cnic = ?");
$stmt->bind_param("ss", $password_hash, $cnic);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to update password. Please try again.']);
    exit;
}

// ── Clear all session data
unset(
    $_SESSION['otp_cnic'],
    $_SESSION['otp_email'],
    $_SESSION['otp_purpose'],
    $_SESSION['otp_verified'],
    $_SESSION['otp_reset_allowed']
);

echo json_encode(['success' => true, 'message' => 'Password updated successfully! You can now login.']);
?>