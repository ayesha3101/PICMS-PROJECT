<?php
// officerResetPassword.php
// Final step of forgot password flow — updates password after OTP verified.
// Requires session flag officer_otp_verified = true set by officerVerifyOTP.php.

require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// must have completed OTP step
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

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);

    // update password — also set password_changed = 1 in case this was a first-login officer
    $pdo->prepare("
        UPDATE officers
        SET password_hash = :hash, password_changed = 1
        WHERE officer_id = :id
    ")->execute([
        ':hash' => $hash,
        ':id'   => $_SESSION['otp_officer_id']
    ]);

    // clean up OTPs for this officer
    $pdo->prepare("DELETE FROM officer_otps WHERE officer_id = :id")
        ->execute([':id' => $_SESSION['otp_officer_id']]);

    // clear session flags
    unset($_SESSION['officer_otp_verified'], $_SESSION['otp_officer_id']);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    error_log('officerResetPassword.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}