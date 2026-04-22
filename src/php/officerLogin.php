<?php
// officerLogin.php — fixed to return role_id for correct dashboard routing.
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']); exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$password = $input['password']      ?? '';
$badge    = trim($input['badge_number'] ?? '');
$email    = trim($input['email']        ?? '');

if (empty($password) || (empty($badge) && empty($email))) {
    echo json_encode(['success' => false, 'message' => 'Credentials are required.']); exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    if (!empty($badge)) {
        $stmt = $pdo->prepare("SELECT * FROM officers WHERE badge_number = :val LIMIT 1");
        $stmt->execute([':val' => $badge]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM officers WHERE email = :val LIMIT 1");
        $stmt->execute([':val' => $email]);
    }

    $officer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$officer || !password_verify($password, $officer['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials. Please try again.']); exit;
    }

    if (!$officer['is_active']) {
        echo json_encode(['success' => false, 'message' => 'Your account has been deactivated. Contact admin.']); exit;
    }

    // SHO check — role_id=2 officers may or may not be current SHO
    $shoStmt = $pdo->prepare("
        SELECT COUNT(*) FROM station_sho_assignments
        WHERE officer_id = :id AND is_current = 1
    ");
    $shoStmt->execute([':id' => $officer['officer_id']]);
    $is_sho = (bool) $shoStmt->fetchColumn();

    // Fetch role name
    $rStmt = $pdo->prepare("SELECT role_name FROM officer_roles WHERE role_id = :id");
    $rStmt->execute([':id' => $officer['role_id']]);
    $roleName = $rStmt->fetchColumn() ?: 'Investigating Officer';

    session_regenerate_id(true);
    $_SESSION['officer_id']       = $officer['officer_id'];
    $_SESSION['officer_name']     = $officer['full_name'];
    $_SESSION['badge_number']     = $officer['badge_number'];
    $_SESSION['rank']             = $officer['rank'];
    $_SESSION['station_id']       = $officer['station_id'];
    $_SESSION['role_id']          = $officer['role_id'];
    $_SESSION['is_sho']           = $is_sho;
    $_SESSION['password_changed'] = (bool) $officer['password_changed'];
    $_SESSION['role']             = 'officer';

    echo json_encode([
        'success'          => true,
        'is_sho'           => $is_sho,
        'role_id'          => (int) $officer['role_id'],
        'role_name'        => $roleName,
        'password_changed' => (bool) $officer['password_changed'],
        'name'             => $officer['full_name'],
        'rank'             => $officer['rank'],
    ]);

} catch (PDOException $e) {
    error_log('officerLogin.php: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}