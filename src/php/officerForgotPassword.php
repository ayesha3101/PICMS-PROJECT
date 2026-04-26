<?php
// officerForgotPassword.php
// Sends a password-reset OTP to the officer's registered email.
// Uses mysqli via $conn from config.php.

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

// Check officer exists — always return success to avoid email enumeration
$stmt = $conn->prepare("SELECT officer_id, full_name FROM officers WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$officer = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$officer) {
    echo json_encode(['success' => true]);
    exit;
}

$officerId = (int) $officer['officer_id'];

// Rate limiting — max 3 OTPs per 10 minutes
$rateStmt = $conn->prepare("
    SELECT COUNT(*) AS cnt FROM officer_otps
    WHERE officer_id = ?
      AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
");
$rateStmt->bind_param('i', $officerId);
$rateStmt->execute();
$rateCount = (int) $rateStmt->get_result()->fetch_assoc()['cnt'];
$rateStmt->close();

if ($rateCount >= 3) {
    echo json_encode(['success' => false, 'message' => 'Too many requests. Please wait 10 minutes.']);
    exit;
}

// Generate 6-digit OTP
$otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$otpHash = password_hash($otp, PASSWORD_DEFAULT);

// Invalidate old OTPs for this officer
$delStmt = $conn->prepare("DELETE FROM officer_otps WHERE officer_id = ?");
$delStmt->bind_param('i', $officerId);
$delStmt->execute();
$delStmt->close();

// Insert new OTP (expires in 10 minutes)
$insStmt = $conn->prepare("
    INSERT INTO officer_otps (officer_id, otp, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
");
$insStmt->bind_param('is', $officerId, $otpHash);
$insStmt->execute();
$insStmt->close();

// Store officer_id in session for verification step
$_SESSION['otp_officer_id'] = $officerId;

// Send email via otpService
$sent = sendOTPEmail($email, $officer['full_name'], $otp);

if (!$sent) {
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again.']);
    exit;
}

echo json_encode(['success' => true]);