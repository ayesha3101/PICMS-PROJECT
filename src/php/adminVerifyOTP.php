<?php
// adminVerifyOTP.php
// Verifies the OTP sent during admin forgot password flow.
// On success sets session flag for reset step.

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

// Find admin by email
$stmt = $conn->prepare("SELECT admin_id FROM admin WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$admin = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$admin) {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$adminId = (int) $admin['admin_id'];

// Get latest unexpired unverified OTP
$stmt = $conn->prepare("
    SELECT id, otp, attempts, max_attempts
    FROM admin_otps
    WHERE admin_id  = ?
      AND expires_at > NOW()
      AND verified   = 0
    ORDER BY created_at DESC
    LIMIT 1
");
$stmt->bind_param("i", $adminId);
$stmt->execute();
$record = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$record) {
    echo json_encode(['success' => false, 'message' => 'Code has expired. Please request a new one.']);
    exit;
}

if ($record['attempts'] >= $record['max_attempts']) {
    echo json_encode(['success' => false, 'message' => 'Too many incorrect attempts. Please request a new code.']);
    exit;
}

if (!password_verify($otp, $record['otp'])) {
    $upd = $conn->prepare("UPDATE admin_otps SET attempts = attempts + 1 WHERE id = ?");
    $upd->bind_param("i", $record['id']);
    $upd->execute();
    $upd->close();

    $remaining = $record['max_attempts'] - $record['attempts'] - 1;
    echo json_encode(['success' => false, 'message' => "Incorrect code. {$remaining} attempt(s) remaining."]);
    exit;
}

// Mark verified
$upd = $conn->prepare("UPDATE admin_otps SET verified = 1 WHERE id = ?");
$upd->bind_param("i", $record['id']);
$upd->execute();
$upd->close();

if ($conn->errno) {
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
    exit;
}

$_SESSION['admin_otp_verified'] = true;
$_SESSION['otp_admin_id']       = $adminId;

echo json_encode(['success' => true]);