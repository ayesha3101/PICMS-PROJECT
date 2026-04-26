<?php
// officerVerifyOTP.php
// Verifies the OTP sent to officer's email during forgot password flow.
// On success sets a session flag allowing the reset step.
// Uses mysqli via $conn from config.php.

require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$otp   = trim($input['otp']   ?? '');
$email = trim($input['email'] ?? '');

if (empty($otp) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Missing data.']);
    exit;
}

// Get officer by email
$stmt = $conn->prepare("SELECT officer_id FROM officers WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$officer = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$officer) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$officerId = (int) $officer['officer_id'];

// Get latest unexpired, unverified OTP
$otpStmt = $conn->prepare("
    SELECT id, otp, attempts, max_attempts
    FROM officer_otps
    WHERE officer_id = ?
      AND expires_at > NOW()
      AND verified = 0
    ORDER BY created_at DESC
    LIMIT 1
");
$otpStmt->bind_param('i', $officerId);
$otpStmt->execute();
$record = $otpStmt->get_result()->fetch_assoc();
$otpStmt->close();

if (!$record) {
    echo json_encode(['success' => false, 'message' => 'Code has expired. Please request a new one.']);
    exit;
}

if ((int) $record['attempts'] >= (int) $record['max_attempts']) {
    echo json_encode(['success' => false, 'message' => 'Too many incorrect attempts. Please request a new code.']);
    exit;
}

if (!password_verify($otp, $record['otp'])) {
    // Increment attempts
    $incStmt = $conn->prepare("UPDATE officer_otps SET attempts = attempts + 1 WHERE id = ?");
    $incStmt->bind_param('i', $record['id']);
    $incStmt->execute();
    $incStmt->close();

    $remaining = (int) $record['max_attempts'] - (int) $record['attempts'] - 1;
    echo json_encode(['success' => false, 'message' => "Incorrect code. {$remaining} attempt(s) remaining."]);
    exit;
}

// Mark verified
$verStmt = $conn->prepare("UPDATE officer_otps SET verified = 1 WHERE id = ?");
$verStmt->bind_param('i', $record['id']);
$verStmt->execute();
$verStmt->close();

// Store in session — reset step will check this
$_SESSION['officer_otp_verified'] = true;
$_SESSION['otp_officer_id']       = $officerId;

echo json_encode(['success' => true]);