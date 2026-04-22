<?php
// ══════════════════════════════════════════════
// sendOTP.php
// ONLY job: generate OTP and send it via email
// Used by: citizenRegister.php, forgotPassword.php
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/otpService.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$data      = json_decode(file_get_contents('php://input'), true);
$cnic      = trim($data['cnic']      ?? '');
$email     = trim($data['email']     ?? '');
$firstname = trim($data['firstname'] ?? '');
$purpose   = trim($data['purpose']   ?? 'register'); // 'register' or 'forgot_password'

if (!$cnic || !$email) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$result = sendOtpForCitizen($conn, $cnic, $email, $firstname, $purpose);
echo json_encode($result);
?>