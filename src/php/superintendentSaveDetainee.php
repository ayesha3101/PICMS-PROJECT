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

$stationId = (int)($_SESSION['station_id'] ?? 0);
$officerId = (int)$_SESSION['officer_id'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

$detaineeId = (int)($input['detainee_id'] ?? 0);
$cnic = trim((string)($input['cnic'] ?? ''));
$fname = trim((string)($input['d_fname'] ?? ''));
$minit = trim((string)($input['d_minit'] ?? ''));
$lname = trim((string)($input['d_lname'] ?? ''));
$age = (int)($input['age'] ?? 0);
$gender = trim((string)($input['gender'] ?? ''));
$purpose = trim((string)($input['purpose_of_admission'] ?? ''));
$admissionDate = trim((string)($input['admission_date'] ?? ''));
$complaintId = !empty($input['complaint_id']) ? (int)$input['complaint_id'] : null;

if ($fname === '' || $lname === '' || $age < 1 || !in_array($gender, ['Male', 'Female'], true) || $admissionDate === '') {
    echo json_encode(['success' => false, 'message' => 'Missing or invalid required fields.']);
    exit;
}

if (!in_array($purpose, ['Remand','Sentence','Preventive Detention','Other'], true)) {
    $purpose = 'Other';
}

if ($complaintId !== null) {
    $cs = $conn->prepare("SELECT complaint_id FROM complaints WHERE complaint_id = ? AND station_id = ? LIMIT 1");
    $cs->bind_param('ii', $complaintId, $stationId);
    $cs->execute();
    $ok = $cs->get_result()->fetch_assoc();
    $cs->close();
    if (!$ok) {
        echo json_encode(['success' => false, 'message' => 'Selected case does not belong to your station.']);
        exit;
    }
}

if ($detaineeId > 0) {
    $stmt = $conn->prepare("
        UPDATE detainees
        SET cnic = ?, d_fname = ?, d_minit = ?, d_lname = ?, age = ?, gender = ?,
            complaint_id = ?, purpose_of_admission = ?, admission_date = ?
        WHERE detainee_id = ? AND station_id = ?
    ");
    $stmt->bind_param(
        'ssssisissii',
        $cnic,
        $fname,
        $minit,
        $lname,
        $age,
        $gender,
        $complaintId,
        $purpose,
        $admissionDate,
        $detaineeId,
        $stationId
    );
} else {
    $stmt = $conn->prepare("
        INSERT INTO detainees (
            cnic, d_fname, d_minit, d_lname, age, gender, station_id,
            complaint_id, purpose_of_admission, admission_date, admitted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param(
        'ssssisiissi',
        $cnic,
        $fname,
        $minit,
        $lname,
        $age,
        $gender,
        $stationId,
        $complaintId,
        $purpose,
        $admissionDate,
        $officerId
    );
}

if (!$stmt->execute()) {
    $stmt->close();
    echo json_encode(['success' => false, 'message' => 'Failed to save detainee.']);
    exit;
}
$stmt->close();

echo json_encode(['success' => true]);
