<?php
require_once __DIR__ . '/../config/config.php';
session_start();
header('Content-Type: application/json');

if (
    empty($_SESSION['officer_id']) ||
    ($_SESSION['role'] ?? '') !== 'officer' ||
    (int)($_SESSION['role_id'] ?? 0) !== 3
) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$current = (string)($input['current_password'] ?? '');
$new = (string)($input['new_password'] ?? '');
$confirm = (string)($input['confirm_password'] ?? '');
$officerId = (int)$_SESSION['officer_id'];

if ($current === '' || $new === '' || $confirm === '') {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}
if (strlen($new) < 8) {
    echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters.']);
    exit;
}
if ($new !== $confirm) {
    echo json_encode(['success' => false, 'message' => 'New passwords do not match.']);
    exit;
}
if ($new === $current) {
    echo json_encode(['success' => false, 'message' => 'New password must differ from current password.']);
    exit;
}

$stmt = $conn->prepare("SELECT password_hash FROM officers WHERE officer_id = ? LIMIT 1");
$stmt->bind_param('i', $officerId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row || !password_verify($current, $row['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
    exit;
}

$hash = password_hash($new, PASSWORD_DEFAULT);
$uStmt = $conn->prepare("UPDATE officers SET password_hash = ?, password_changed = 1 WHERE officer_id = ?");
$uStmt->bind_param('si', $hash, $officerId);
$ok = $uStmt->execute();
$uStmt->close();

echo json_encode(['success' => (bool)$ok]);
