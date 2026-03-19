<?php
// ══════════════════════════════════════════════
// register.php
// Job: validate + save citizen to DB
//      then call send_otp.php to send OTP
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$data       = json_decode(file_get_contents('php://input'), true);
$cnic       = trim($data['cnic']       ?? '');
$email      = trim($data['email']      ?? '');
$firstname  = trim($data['firstname']  ?? '');
$middlename = trim($data['middlename'] ?? '');
$lastname   = trim($data['lastname']   ?? '');
$password   = $data['password']        ?? '';

// ── Server side validation
if (!$cnic || !$email || !$firstname || !$lastname || !$password) {
    echo json_encode(['success' => false, 'message' => 'All required fields must be filled']);
    exit;
}
if (!preg_match('/^\d{5}-\d{7}-\d{1}$/', $cnic)) {
    echo json_encode(['success' => false, 'message' => 'Invalid CNIC format']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}
if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
    exit;
}

// ── Check if CNIC already registered
/*SQL*/ $stmt = $conn->prepare("SELECT cnic FROM citizens WHERE cnic = ?"); /*END*/
$stmt->bind_param("s", $cnic);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'This CNIC is already registered']);
    exit;
}

// ── Check if email already registered
/*SQL*/ $stmt = $conn->prepare("SELECT email FROM citizens WHERE email = ?"); /*END*/
$stmt->bind_param("s", $email);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'This email is already registered']);
    exit;
}

// ── Hash password and save citizen
$password_hash = password_hash($password, PASSWORD_DEFAULT);
/*SQL*/
$stmt = $conn->prepare("
    INSERT INTO citizens (cnic, c_fname, c_minit, c_lname, email, password_hash, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, 0)
");
/*END*/
$stmt->bind_param("ssssss", $cnic, $firstname, $middlename, $lastname, $email, $password_hash);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
    exit;
}

// ── Citizen saved — now send OTP via curl
$otpData = json_encode([
    'cnic'      => $cnic,
    'email'     => $email,
    'firstname' => $firstname,
    'purpose'   => 'register'
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