<?php
// ══════════════════════════════════════════════
// verify_otp.php
// Job: verify OTP for ANY purpose
//      (register, forgot_password, change_password)
//      purpose is read from session
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$otp  = trim($data['otp'] ?? '');

if (!$otp || strlen($otp) !== 6) {
    echo json_encode(['success' => false, 'message' => 'Invalid OTP format']);
    exit;
}

// ── Get cnic and purpose from session
$cnic    = $_SESSION['otp_cnic']    ?? '';
$purpose = $_SESSION['otp_purpose'] ?? 'register';

if (!$cnic) {
    echo json_encode(['success' => false, 'message' => 'Session expired. Please start again.']);
    exit;
}

// ── Get latest unverified OTP for this citizen
$stmt = $conn->prepare("
    SELECT id, otp, expires_at, attempts, max_attempts 
    FROM otp_verifications 
    WHERE cnic = ? AND verified = 0 
    ORDER BY created_at DESC 
    LIMIT 1
");
$stmt->bind_param("s", $cnic);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();

if (!$result) {
    echo json_encode(['success' => false, 'message' => 'No OTP found. Please request a new one.']);
    exit;
}

// ── Check if expired
if (strtotime($result['expires_at']) < time()) {
    echo json_encode(['success' => false, 'message' => 'OTP has expired. Please request a new one.']);
    exit;
}

// ── Check max attempts
if ($result['attempts'] >= $result['max_attempts']) {
    echo json_encode(['success' => false, 'message' => 'Too many wrong attempts. Please request a new OTP.']);
    exit;
}

// ── Verify OTP
if (!password_verify($otp, $result['otp'])) {
    // Increment wrong attempts
    $upd = $conn->prepare("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?");
    $upd->bind_param("i", $result['id']);
    $upd->execute();

    $remaining = $result['max_attempts'] - $result['attempts'] - 1;
    echo json_encode(['success' => false, 'message' => "Incorrect OTP. $remaining attempt(s) remaining."]);
    exit;
}

// ── OTP correct — mark as verified
$upd = $conn->prepare("UPDATE otp_verifications SET verified = 1 WHERE id = ?");
$upd->bind_param("i", $result['id']);
$upd->execute();

// ── Take action based on purpose
if ($purpose === 'register') {
    // Mark citizen as verified
    $upd = $conn->prepare("UPDATE citizens SET is_verified = 1 WHERE cnic = ?");
    $upd->bind_param("s", $cnic);
    $upd->execute();

    // Clear session
    unset($_SESSION['otp_cnic'], $_SESSION['otp_email'], $_SESSION['otp_purpose']);

    echo json_encode(['success' => true, 'message' => 'Account verified! You can now login.']);

} elseif ($purpose === 'forgot_password') {
    // Don't clear session yet — change_password.php needs otp_cnic
    // Just mark OTP as done, allow password reset
    $_SESSION['otp_verified']      = true;
    $_SESSION['otp_reset_allowed'] = true;

    echo json_encode(['success' => true, 'message' => 'OTP verified. You can now reset your password.']);
}
?>