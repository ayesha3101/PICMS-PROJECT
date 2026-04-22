<?php
// officerLogin.php
// Authenticates SHOs and investigating officers.
// Accepts badge_number OR email + password.
// Returns JSON — JS decides redirect based on is_sho + password_changed.
// is_sho is derived from station_sho_assignments (no such column on officers table).

require_once __DIR__ . '/../config/config.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$password = $input['password'] ?? '';
$badge    = trim($input['badge_number'] ?? '');
$email    = trim($input['email'] ?? '');

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

    // look up by badge OR email — whichever was supplied
    if (!empty($badge)) {
        $stmt = $pdo->prepare("SELECT * FROM officers WHERE badge_number = :val LIMIT 1");
        $stmt->execute([':val' => $badge]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM officers WHERE email = :val LIMIT 1");
        $stmt->execute([':val' => $email]);
    }

    $officer = $stmt->fetch(PDO::FETCH_ASSOC);

    // generic message — don't reveal whether badge/email exists
    if (!$officer || !password_verify($password, $officer['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials. Please try again.']);
        exit;
    }

    // ── Determine if this officer is a current SHO
    //    The officers table has no is_sho column;
    //    SHO status lives in station_sho_assignments (is_current = 1).
    $shoStmt = $pdo->prepare("
        SELECT COUNT(*) FROM station_sho_assignments
        WHERE officer_id = :id AND is_current = 1
    ");
    $shoStmt->execute([':id' => $officer['officer_id']]);
    $is_sho = (bool) $shoStmt->fetchColumn();

    // success — set session
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
        'password_changed' => (bool) $officer['password_changed'],
        'name'             => $officer['full_name'],
        'rank'             => $officer['rank'],
    ]);

} catch (PDOException $e) {
    error_log('officerLogin.php error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error. Please try again.']);
}