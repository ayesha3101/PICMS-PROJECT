<?php
// officerResetPassword.php
// Final step of forgot password flow — updates password after OTP verified.
// Requires session flag officer_otp_verified = true set by officerVerifyOTP.php.
// Uses mysqli via $conn from config.php.

require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Must have completed OTP verification step
if (empty($_SESSION['officer_otp_verified']) || empty($_SESSION['otp_officer_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorised. Please complete verification first.']);
    exit;
}

$input       = json_decode(file_get_contents('php://input'), true);
$newPassword = $input['new_password'] ?? '';

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}

$hash      = password_hash($newPassword, PASSWORD_DEFAULT);
$officerId = (int) $_SESSION['otp_officer_id'];

// Update password — also set password_changed = 1 in case this was a first-login officer
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

// Clean up OTPs for this officer
$delStmt = $conn->prepare("DELETE FROM officer_otps WHERE officer_id = ?");
$delStmt->bind_param('i', $officerId);
$delStmt->execute();
$delStmt->close();

// Clear session flags
unset($_SESSION['officer_otp_verified'], $_SESSION['otp_officer_id']);

echo json_encode(['success' => true]);