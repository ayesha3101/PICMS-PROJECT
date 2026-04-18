<?php
// changeAdminPassword.php
// Called on first login when admin.password_changed = 0.
// Updates password hash and flips password_changed to 1.
// Requires active admin session.

require_once __DIR__ . '/../config/config.php';
session_start();

header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

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

    $pdo->prepare("
        UPDATE admin
        SET password_hash = :hash, password_changed = 1
        WHERE admin_id = :id
    ")->execute([
        ':hash' => $hash,
        ':id'   => $_SESSION['admin_id']
    ]);

    $_SESSION['password_changed'] = true;

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    error_log('changeAdminPassword.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}