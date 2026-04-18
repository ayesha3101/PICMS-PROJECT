<?php
// officerVerifyOTP.php
// Verifies the OTP sent to officer's email during forgot password flow.
// On success sets a session flag allowing the reset step.

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

    // get officer by email
    $stmt = $pdo->prepare("SELECT officer_id FROM officers WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $officer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$officer) {
        echo json_encode(['success' => false, 'message' => 'Invalid request.']);
        exit;
    }

    $officerId = $officer['officer_id'];

    // get latest unexpired OTP
    $stmt = $pdo->prepare("
        SELECT id, otp, attempts, max_attempts
        FROM officer_otps
        WHERE officer_id = :id
          AND expires_at > NOW()
          AND verified = 0
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute([':id' => $officerId]);
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
        // increment attempts
        $pdo->prepare("UPDATE officer_otps SET attempts = attempts + 1 WHERE id = :id")
            ->execute([':id' => $record['id']]);
        $remaining = $record['max_attempts'] - $record['attempts'] - 1;
        echo json_encode(['success' => false, 'message' => "Incorrect code. {$remaining} attempt(s) remaining."]);
        exit;
    }

    // mark verified
    $pdo->prepare("UPDATE officer_otps SET verified = 1 WHERE id = :id")
        ->execute([':id' => $record['id']]);

    // store in session — reset step will check this
    $_SESSION['officer_otp_verified'] = true;
    $_SESSION['otp_officer_id']       = $officerId;

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    error_log('officerVerifyOTP.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}