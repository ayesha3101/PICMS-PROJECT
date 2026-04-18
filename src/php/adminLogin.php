<?php
// adminLogin.php
// Authenticates the admin by badge_number OR email + password.
// Admin lives in its own table — completely separate from officers.
// Returns JSON with success, password_changed flag.

require_once __DIR__ . '/../config/config.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$password = $input['password']     ?? '';
$badge    = trim($input['badge_number'] ?? '');
$email    = trim($input['email']        ?? '');

if (empty($password) || (empty($badge) && empty($email))) {
    echo json_encode(['success' => false, 'message' => 'Credentials are required.']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    if (!empty($badge)) {
        $stmt = $pdo->prepare("SELECT * FROM admin WHERE badge_number = :val LIMIT 1");
        $stmt->execute([':val' => $badge]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM admin WHERE email = :val LIMIT 1");
        $stmt->execute([':val' => $email]);
    }

    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    // generic message — never reveal whether badge/email exists
    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials. Please try again.']);
        exit;
    }

    // success — set session
    session_regenerate_id(true);
    $_SESSION['admin_id']          = $admin['admin_id'];
    $_SESSION['admin_name']        = $admin['full_name'];
    $_SESSION['admin_badge']       = $admin['badge_number'];
    $_SESSION['password_changed']  = (bool) $admin['password_changed'];
    $_SESSION['role']              = 'admin';

    echo json_encode([
        'success'          => true,
        'password_changed' => (bool) $admin['password_changed'],
        'name'             => $admin['full_name'],
    ]);

} catch (PDOException $e) {
    error_log('adminLogin.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}