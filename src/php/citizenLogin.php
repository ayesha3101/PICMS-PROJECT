<?php
// ══════════════════════════════════════════════
// login.php
// Job: authenticate citizen by email or CNIC
//      create session on success
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';  //needed to access $conn

header('Content-Type: application/json'); //json response

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { //post only
    echo json_encode(['success' => false, 'message' => 'Invalid request']); //error connecting to database
    exit;
}

$data       = json_decode(file_get_contents('php://input'), true); //get post data
$identifier = trim($data['identifier'] ?? '');
$password   = $data['password']        ?? '';
$mode       = trim($data['mode']       ?? 'email');

if (!$identifier || !$password) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields']);//fields are not filled
    exit;
}

// ── Find citizen by email or CNIC
if ($mode === 'email') { //logged in via email
    /*SQL*/
    $stmt = $conn->prepare("
        SELECT cnic, c_fname, c_lname, email, password_hash, is_verified 
        FROM citizens WHERE email = ?
    ");
    /*END*/
} else {
    /*SQL*/
    $stmt = $conn->prepare("
        SELECT cnic, c_fname, c_lname, email, password_hash, is_verified 
        FROM citizens WHERE cnic = ? 
    ");//to prevent sql injection
    /*END*/
}

$stmt->bind_param("s", $identifier); //as string
$stmt->execute();//execute kerdo query ko
$citizen = $stmt->get_result()->fetch_assoc();//get the result aur array my convert kerdo asaani k liye

// ── Check citizen exists
if (!$citizen) {
    echo json_encode(['success' => false, 'message' => 'No account found with these details']);
    exit;
}

// ── Check if verified
if (!$citizen['is_verified']) {
    echo json_encode(['success' => false, 'message' => 'Please verify your email before logging in']);
    exit;
}

// ── Check password
if (!password_verify($password, $citizen['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Incorrect password']);
    exit;
}

// ── Login success — create session
$_SESSION['citizen_cnic']  = $citizen['cnic'];
$_SESSION['citizen_name']  = $citizen['c_fname'] . ' ' . $citizen['c_lname'];
$_SESSION['citizen_email'] = $citizen['email'];
$_SESSION['logged_in']     = true;

echo json_encode([
    'success'  => true,
    'message'  => 'Login successful',
    'name'     => $_SESSION['citizen_name'],
    'redirect' => 'citizenDashboard.html'
]);
?>