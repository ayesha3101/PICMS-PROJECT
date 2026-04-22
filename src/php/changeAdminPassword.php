<?php
// changeAdminPassword.php
// Two modes:
//   1. First-login (no current_password) — called when password_changed = 0
//   2. Profile page change — requires current_password verification
// Requires active admin session.

require_once __DIR__ . '/../config/config.php';
session_start();

header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input          = json_decode(file_get_contents('php://input'), true);
$newPassword    = $input['new_password']     ?? '';
$currentPassword = $input['current_password'] ?? '';

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

    // Fetch current hash
    $stmt = $pdo->prepare("SELECT password_hash, password_changed FROM admin WHERE admin_id = :id");
    $stmt->execute([':id' => $_SESSION['admin_id']]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        echo json_encode(['success' => false, 'message' => 'Account not found.']);
        exit;
    }

    // If password already changed (profile page mode) — verify current password
    if ($admin['password_changed'] && !empty($currentPassword)) {
        if (!password_verify($currentPassword, $admin['password_hash'])) {
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
            exit;
        }
    } elseif ($admin['password_changed'] && empty($currentPassword)) {
        // Profile page call missing current_password
        echo json_encode(['success' => false, 'message' => 'Current password is required.']);
        exit;
    }
    // If first login (password_changed = 0), no current password needed

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