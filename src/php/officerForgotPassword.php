<?php
// officerForgotPassword.php
// Sends a password-reset OTP to the officer's registered email.
// Reuses the same OTP flow as the citizen side via otpService.php,
// but writes into a separate officer_otp_verifications table
// (or reuses otp_verifications with a role column — adjust to your preference).
// Here we store OTPs in a dedicated officer_otps table for clean separation.

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/otpService.php'; // reuse your existing PHPMailer sender

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

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // check officer exists with this email
    $stmt = $pdo->prepare("SELECT officer_id, full_name FROM officers WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $officer = $stmt->fetch(PDO::FETCH_ASSOC);

    // always return success — don't reveal whether email is registered
    if (!$officer) {
        echo json_encode(['success' => true]);
        exit;
    }

    // rate limiting — max 3 OTPs per 10 minutes
    $rateCheck = $pdo->prepare("
        SELECT COUNT(*) FROM officer_otps
        WHERE officer_id = :id
          AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
    ");
    $rateCheck->execute([':id' => $officer['officer_id']]);
    if ((int) $rateCheck->fetchColumn() >= 3) {
        echo json_encode(['success' => false, 'message' => 'Too many requests. Please wait 10 minutes.']);
        exit;
    }

    // generate 6-digit OTP
    $otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpHash = password_hash($otp, PASSWORD_DEFAULT);

    // invalidate old OTPs for this officer
    $pdo->prepare("DELETE FROM officer_otps WHERE officer_id = :id")
        ->execute([':id' => $officer['officer_id']]);

    // insert new OTP (expires in 10 minutes)
    $pdo->prepare("
        INSERT INTO officer_otps (officer_id, otp, expires_at)
        VALUES (:id, :otp, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ")->execute([
        ':id'  => $officer['officer_id'],
        ':otp' => $otpHash
    ]);

    // store officer_id in session for verification step
    $_SESSION['otp_officer_id'] = $officer['officer_id'];

    // send email via your existing otpService
    $sent = sendOTPEmail($email, $officer['full_name'], $otp);

    if (!$sent) {
        echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again.']);
        exit;
    }

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    error_log('officerForgotPassword.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}