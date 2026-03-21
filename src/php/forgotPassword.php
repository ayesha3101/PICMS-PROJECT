<?php
// ══════════════════════════════════════════════
// forgot_password.php
// Job: check citizen exists by email
//      then trigger send_otp.php
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/otpService.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$data  = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address']);
    exit;
}

// ── Check citizen exists and is verified
/*SQL*/
$stmt = $conn->prepare("
    SELECT cnic, c_fname FROM citizens 
    WHERE email = ? AND is_verified = 1
");
/*END*/
$stmt->bind_param("s", $email);
$stmt->execute();
$citizen = $stmt->get_result()->fetch_assoc();

if (!$citizen) {
    echo json_encode(['success' => false, 'message' => 'No verified account found with this email']);
    exit;
}

// ── Citizen found — send OTP directly (no localhost loopback request)
$otpResult = sendOtpForCitizen(
    $conn,
    $citizen['cnic'],
    $email,
    $citizen['c_fname'],
    'forgot_password'
);
echo json_encode($otpResult);
?>