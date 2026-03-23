<?php
// ══════════════════════════════════════════════
// getProfile.php
// Job: return logged-in citizen's full profile
//      from the citizens table
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// ── Guard: must be logged in
if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$cnic = $_SESSION['citizen_cnic'];

// ── Fetch all citizen fields for the profile page
/*SQL — SELECT full citizen profile row by CNIC */
$stmt = $conn->prepare("
    SELECT
        cnic,
        c_fname,
        c_minit,
        c_lname,
        email,
        is_verified,
        created_at
    FROM citizens
    WHERE cnic = ?
    LIMIT 1
");
/*END*/
$stmt->bind_param("s", $cnic);
$stmt->execute();
$citizen = $stmt->get_result()->fetch_assoc();

if (!$citizen) {
    echo json_encode(['success' => false, 'message' => 'Profile not found']);
    exit;
}

echo json_encode([
    'success' => true,
    'citizen' => $citizen,
]);
?>