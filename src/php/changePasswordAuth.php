<?php
// ══════════════════════════════════════════════
// changePasswordAuth.php
// Job: change password for a LOGGED-IN citizen
//      verifies current password first, then updates
//      completely separate from changePassword.php
//      which is OTP-gated (forgot password flow)
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// ── Guard: must be logged in via normal session
//    (different from changePassword.php which checks otp_reset_allowed)
if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];
$data = json_decode(file_get_contents('php://input'), true);

$current_password = $data['current_password'] ?? '';
$new_password     = $data['new_password']     ?? '';
$confirm_password = $data['confirm_password'] ?? '';

// ── Validate inputs
if (!$current_password || !$new_password || !$confirm_password) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}
if (strlen($new_password) < 8) {
    echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters']);
    exit;
}
if ($new_password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => 'New passwords do not match']);
    exit;
}
if ($current_password === $new_password) {
    echo json_encode(['success' => false, 'message' => 'New password must be different from current password']);
    exit;
}

// ── Fetch current password hash from DB
/*SQL — SELECT current password hash to verify against what citizen typed */
$stmt = $conn->prepare("
    SELECT password_hash FROM citizens WHERE cnic = ?
");
/*END*/
$stmt->bind_param("s", $cnic);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Account not found']);
    exit;
}

// ── Verify current password is correct before allowing change
if (!password_verify($current_password, $row['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    exit;
}

// ── Hash new password and update
$new_hash = password_hash($new_password, PASSWORD_DEFAULT);

/*SQL — UPDATE password hash for this citizen */
$upd = $conn->prepare("
    UPDATE citizens SET password_hash = ? WHERE cnic = ?
");
/*END*/
$upd->bind_param("ss", $new_hash, $cnic);

if (!$upd->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to update password. Please try again.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
?>