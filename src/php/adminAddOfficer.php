<?php
// adminAddOfficer.php
// Inserts a new officer. Admin only.
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['admin_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorised.']); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid method.']); exit;
}

$input      = json_decode(file_get_contents('php://input'), true);
$fullName   = trim($input['full_name']    ?? '');
$badge      = trim($input['badge_number'] ?? '');
$email      = trim($input['email']        ?? '');
$rank       = trim($input['rank']         ?? '');
$roleId     = (int)($input['role_id']     ?? 0);
$stationId  = (int)($input['station_id']  ?? 0) ?: null;
$password   = $input['password']          ?? '';

if (!$fullName || !$badge || !$email || !$rank || !$roleId || strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'All fields required and password min 8 chars.']); exit;
}

$validRanks = ['Inspector','DSP','SI','ASI'];
if (!in_array($rank, $validRanks)) {
    echo json_encode(['success' => false, 'message' => 'Invalid rank.']); exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // check badge unique
    $chk = $pdo->prepare("SELECT COUNT(*) FROM officers WHERE badge_number = :b OR email = :e");
    $chk->execute([':b' => $badge, ':e' => $email]);
    if ((int)$chk->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Badge number or email already exists.']); exit;
    }

    // check role_id valid
    $rChk = $pdo->prepare("SELECT COUNT(*) FROM officer_roles WHERE role_id = :r");
    $rChk->execute([':r' => $roleId]);
    if (!(int)$rChk->fetchColumn()) {
        echo json_encode(['success' => false, 'message' => 'Invalid role.']); exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO officers (full_name, badge_number, email, rank, password_hash, password_changed, station_id, role_id)
        VALUES (:name, :badge, :email, :rank, :hash, 0, :station, :role)
    ");
    $stmt->execute([
        ':name'    => $fullName,
        ':badge'   => $badge,
        ':email'   => $email,
        ':rank'    => $rank,
        ':hash'    => $hash,
        ':station' => $stationId,
        ':role'    => $roleId,
    ]);

    echo json_encode(['success' => true, 'officer_id' => (int)$pdo->lastInsertId()]);
} catch (PDOException $e) {
    error_log('adminAddOfficer: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}