<?php
// ══════════════════════════════════════════════
// send_otp.php
// ONLY job: generate OTP and send it via email
// Used by: register.php, forgot_password.php
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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

// ── Rate limiting — max 5 OTP requests per hour
$stmt = $conn->prepare("
    SELECT COUNT(*) AS count FROM otp_verifications 
    WHERE cnic = ? AND created_at > NOW() - INTERVAL 1 HOUR
");
$stmt->bind_param("s", $cnic);
$stmt->execute();
$rate = $stmt->get_result()->fetch_assoc();

if ($rate['count'] >= 5) {
    echo json_encode(['success' => false, 'message' => 'Too many attempts. Please wait an hour.']);
    exit;
}

// ── Delete old unused OTPs for this citizen
$stmt = $conn->prepare("DELETE FROM otp_verifications WHERE cnic = ? AND verified = 0");
$stmt->bind_param("s", $cnic);
$stmt->execute();

// ── Generate and hash OTP
$otp        = rand(100000, 999999);
$hashed_otp = password_hash($otp, PASSWORD_DEFAULT);

// ── Insert new OTP
$stmt = $conn->prepare("
    INSERT INTO otp_verifications (cnic, otp, expires_at) 
    VALUES (?, ?, NOW() + INTERVAL 10 MINUTE)
");
$stmt->bind_param("ss", $cnic, $hashed_otp);
$stmt->execute();

// ── Save to session for verify step
$_SESSION['otp_cnic']    = $cnic;
$_SESSION['otp_email']   = $email;
$_SESSION['otp_purpose'] = $purpose; // so verify_otp knows what to do after

// ── Send email via PHPMailer
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'noreply.picmskarachi@gmail.com';
    $mail->Password   = 'mmbrgoxxlwlvezcv';        // ← replace with Gmail app password
    $mail->SMTPSecure = 'tls';
    $mail->Port       = 587;

    $mail->setFrom('noreply.picmskarachi@gmail.com', 'PICMS Karachi Police');
    $mail->addAddress($email);

    // Subject changes based on purpose
    $subject = $purpose === 'forgot_password'
        ? 'PICMS Password Reset Code'
        : 'PICMS Email Verification Code';

    $heading = $purpose === 'forgot_password'
        ? 'Password Reset Request'
        : 'Email Verification';

    $mail->Subject = $subject;
    $mail->isHTML(true);
    $mail->Body = "
        <div style='font-family: Arial, sans-serif; max-width: 420px; padding: 24px;'>
            <h2 style='color: #0d1b2e;'>PICMS — $heading</h2>
            <p>Dear $firstname,</p>
            <p>Your one-time verification code is:</p>
            <h1 style='letter-spacing: 10px; color: #b8933f; font-size: 36px;'>$otp</h1>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p style='color: #999;'>Do not share this code with anyone.</p>
            <hr style='border:none; border-top:1px solid #eee; margin:16px 0;'/>
            <p style='color:#aaa; font-size:12px;'>Karachi Police — PICMS Citizen Portal</p>
        </div>
    ";

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'OTP sent to your email']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again.']);
}
?>