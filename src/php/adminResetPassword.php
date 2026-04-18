<?php
// adminResetPassword.php
// Final step of forgot password — updates password after OTP verified.
// Requires session flag admin_otp_verified = true.

require_once __DIR__ . '/../config/config.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

if (empty($_SESSION['admin_otp_verified']) || empty($_SESSION['otp_admin_id'])) {
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

    $pdo->prepare("
        UPDATE admin
        SET password_hash = :hash, password_changed = 1
        WHERE admin_id = :id
    ")->execute([
        ':hash' => $hash,
        ':id'   => $_SESSION['otp_admin_id']
    ]);

    // clean up OTPs
    $pdo->prepare("DELETE FROM admin_otps WHERE admin_id = :id")
        ->execute([':id' => $_SESSION['otp_admin_id']]);

    // clear session flags
    unset($_SESSION['admin_otp_verified'], $_SESSION['otp_admin_id']);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    error_log('adminResetPassword.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}