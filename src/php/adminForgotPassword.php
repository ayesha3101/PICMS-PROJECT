<?php
// adminForgotPassword.php
// Sends a 6-digit OTP to the admin's registered email.
// Stores hashed OTP in admin_otps table.
// Rate limited to 3 requests per 10 minutes.

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/otpService.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'A valid email address is required.']);
    exit;
}

// find admin by email
$stmt = $conn->prepare("SELECT admin_id, full_name FROM admin WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$admin  = $result->fetch_assoc();
$stmt->close();

// always return success — don't reveal if email is registered
if (!$admin) {
    echo json_encode(['success' => true]);
    exit;
}

// rate limit — max 3 OTPs per 10 minutes
$stmt = $conn->prepare("
    SELECT COUNT(*) FROM admin_otps
    WHERE admin_id = ?
      AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
");
$stmt->bind_param("i", $admin['admin_id']);
$stmt->execute();
$stmt->bind_result($otpCount);
$stmt->fetch();
$stmt->close();

if ((int) $otpCount >= 3) {
    echo json_encode(['success' => false, 'message' => 'Too many requests. Please wait 10 minutes.']);
    exit;
}

// generate + hash OTP
$otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$otpHash = password_hash($otp, PASSWORD_DEFAULT);

// invalidate old OTPs for this admin
$stmt = $conn->prepare("DELETE FROM admin_otps WHERE admin_id = ?");
$stmt->bind_param("i", $admin['admin_id']);
$stmt->execute();
$stmt->close();

// insert new OTP — expires in 10 minutes
$stmt = $conn->prepare("
    INSERT INTO admin_otps (admin_id, otp, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
");
$stmt->bind_param("is", $admin['admin_id'], $otpHash);
$stmt->execute();
$stmt->close();

// store for verification step
$_SESSION['otp_admin_id'] = $admin['admin_id'];

// send via PHPMailer (reusing existing otpService)
$sent = sendOTPEmail($email, $admin['full_name'], $otp);

if (!$sent) {
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again.']);
    exit;
}

echo json_encode(['success' => true]);