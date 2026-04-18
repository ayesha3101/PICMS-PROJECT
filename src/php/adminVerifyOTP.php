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

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("SELECT admin_id FROM admin WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'Invalid request.']);
        exit;
    }

    $adminId = $admin['admin_id'];

    // get latest unexpired unverified OTP
    $stmt = $pdo->prepare("
        SELECT id, otp, attempts, max_attempts
        FROM admin_otps
        WHERE admin_id  = :id
          AND expires_at > NOW()
          AND verified   = 0
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute([':id' => $adminId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record) {
        echo json_encode(['success' => false, 'message' => 'Code has expired. Please request a new one.']);
        exit;
    }

    if ($record['attempts'] >= $record['max_attempts']) {
        echo json_encode(['success' => false, 'message' => 'Too many incorrect attempts. Please request a new code.']);
        exit;
    }

    if (!password_verify($otp, $record['otp'])) {
        $pdo->prepare("UPDATE admin_otps SET attempts = attempts + 1 WHERE id = :id")
            ->execute([':id' => $record['id']]);
        $remaining = $record['max_attempts'] - $record['attempts'] - 1;
        echo json_encode(['success' => false, 'message' => "Incorrect code. {$remaining} attempt(s) remaining."]);
        exit;
    }

    // mark verified
    $pdo->prepare("UPDATE admin_otps SET verified = 1 WHERE id = :id")
        ->execute([':id' => $record['id']]);

    $_SESSION['admin_otp_verified'] = true;
    $_SESSION['otp_admin_id']       = $adminId;

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    error_log('adminVerifyOTP.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}