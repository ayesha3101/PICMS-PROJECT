<?php
// ══════════════════════════════════════════════
// forgot_password.php
// Job: check citizen exists by email
//      then trigger send_otp.php
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

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

// ── Citizen found — send OTP
$otpData = json_encode([
    'cnic'      => $citizen['cnic'],
    'email'     => $email,
    'firstname' => $citizen['c_fname'],
    'purpose'   => 'forgot_password'
]);

// Build URL to the sibling endpoint (works regardless of project folder name)
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$dir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
$sendOtpUrl = $scheme . '://' . $host . $dir . '/sendOTP.php';

$ch = curl_init($sendOtpUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $otpData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_COOKIE, 'PHPSESSID=' . session_id());
$otpResponse = curl_exec($ch);
curl_close($ch);

echo $otpResponse;
?>