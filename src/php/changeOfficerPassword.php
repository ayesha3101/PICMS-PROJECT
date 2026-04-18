<?php
// changeOfficerPassword.php
// Called immediately after first login when password_changed = 0.
// Sets new password hash and flips password_changed to 1.
// Requires active officer session.

require_once __DIR__ . '/../config/config.php';
session_start();

header('Content-Type: application/json');

// must be logged in as officer
if (empty($_SESSION['officer_id']) || $_SESSION['role'] !== 'officer') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

// must still be on first login (extra guard — prevents re-calling this after already changed)
if (!empty($_SESSION['password_changed'])) {
    echo json_encode(['success' => false, 'message' => 'Password already set.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input       = json_decode(file_get_contents('php://input'), true);
$newPassword = $input['new_password'] ?? '';

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        UPDATE officers
        SET password_hash = :hash, password_changed = 1
        WHERE officer_id = :id
    ");
    $stmt->execute([
        ':hash' => $hash,
        ':id'   => $_SESSION['officer_id']
    ]);

    // update session so subsequent checks reflect the change
    $_SESSION['password_changed'] = true;

    echo json_encode([
        'success' => true,
        'is_sho'  => (bool) $_SESSION['is_sho'],
    ]);

} catch (PDOException $e) {
    error_log('changeOfficerPassword.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}