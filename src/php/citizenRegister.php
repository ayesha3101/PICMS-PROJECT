<?php
// ══════════════════════════════════════════════
// citizenRegister.php
// Job: validate + save citizen to DB
//      then call sendOTP.php to send OTP
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/otpService.php';

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
$stmt = $conn->prepare("SELECT cnic, is_verified FROM citizens WHERE cnic = ?");
$stmt->bind_param("s", $cnic);
$stmt->execute();
$existing = $stmt->get_result()->fetch_assoc();

if ($existing) {
    if ($existing['is_verified'] == 1) {
        // fully registered — block them
        echo json_encode(['success' => false, 'message' => 'This CNIC is already registered']);
        exit;
    } else {
        // registered but never verified — delete and let them retry
        $del = $conn->prepare("DELETE FROM citizens WHERE cnic = ?");
        $del->bind_param("s", $cnic);
        $del->execute();
        // also clean up old OTPs
        $del = $conn->prepare("DELETE FROM otp_verifications WHERE cnic = ?");
        $del->bind_param("s", $cnic);
        $del->execute();
    }
}

// ── Check if email already registered
$stmt = $conn->prepare("SELECT email, is_verified FROM citizens WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$existing = $stmt->get_result()->fetch_assoc();

if ($existing) {
    if ($existing['is_verified'] == 1) {
        echo json_encode(['success' => false, 'message' => 'This email is already registered']);
        exit;
    } else {
        $del = $conn->prepare("DELETE FROM citizens WHERE email = ?");
        $del->bind_param("s", $email);
        $del->execute();
    }
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

// ── Citizen saved — now send OTP directly (no localhost loopback request)
$otpResult = sendOtpForCitizen($conn, $cnic, $email, $firstname, 'register');
echo json_encode($otpResult);
?>