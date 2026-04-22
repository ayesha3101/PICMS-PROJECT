<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
// ══════════════════════════════════════════════
// submitComplaint.php
// Job: validate and insert a new complaint
//      and generate reference number KHI-YY-XXXXX
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// ── Guard: must be logged in
if (empty($_SESSION['logged_in']) || empty($_SESSION['citizen_cnic'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$cnic = $_SESSION['citizen_cnic'];

// ── Pull and sanitize all fields from request body
$category_id       = (int)($data['category_id']       ?? 0);
$subcategory_id    = (int)($data['subcategory_id']     ?? 0) ?: null;
$incident_date     = trim($data['incident_date']       ?? '');
$incident_time     = trim($data['incident_time']       ?? '') ?: null;
$description       = trim($data['description']         ?? '');
$incident_area     = trim($data['incident_area']       ?? '');
$incident_landmark = trim($data['incident_landmark']   ?? '');
$station_id        = (int)($data['station_id']         ?? 0);
$has_witnesses     = (int)($data['has_witnesses']      ?? 0);
$witness_name      = trim($data['witness_name']        ?? '');
$witness_contact   = trim($data['witness_contact']     ?? '');

// ── Server-side validation
if (!$category_id || !$incident_date || !$description || !$incident_area || !$station_id) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}
if (strlen($description) < 20) {
    echo json_encode(['success' => false, 'message' => 'Description must be at least 20 characters']);
    exit;
}
if (strtotime($incident_date) > time()) {
    echo json_encode(['success' => false, 'message' => 'Incident date cannot be in the future']);
    exit;
}

// ── Resolve category name to check urgency
$catStmt = $conn->prepare("SELECT category_name, is_urgent FROM complaint_categories WHERE category_id = ? LIMIT 1");
$catStmt->bind_param("i", $category_id);
$catStmt->execute();
$catRow = $catStmt->get_result()->fetch_assoc();

if (!$catRow) {
    echo json_encode(['success' => false, 'message' => 'Invalid complaint category']);
    exit;
}

// ── Insert complaint with a temporary placeholder reference number
//    We need complaint_id first to build the real reference number
/*SQL — INSERT new complaint row, reference_number filled after */
$stmt = $conn->prepare("
    INSERT INTO complaints (
        reference_number, cnic, station_id,
        category_id, subcategory_id,
        incident_area, incident_landmark,
        incident_date, incident_time,
        description,
        has_witnesses,
        status
    ) VALUES (
        'TEMP', ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?,
        ?,
        'Submitted'
    )
");
/*END*/
$stmt->bind_param(
    "siisssssssi",
    $cnic, $station_id,
    $category_id, $subcategory_id,
    $incident_area, $incident_landmark,
    $incident_date, $incident_time,
    $description,
    $has_witnesses
);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to submit complaint. Please try again.']);
    exit;
}

// ── Get the auto-incremented complaint_id just inserted
$complaint_id = $conn->insert_id;

// ── Generate reference number: KHI-YY-XXXXX
//    Year = last 2 digits, sequence = zero-padded complaint_id
$year             = date('y');
$sequence         = str_pad($complaint_id, 5, '0', STR_PAD_LEFT);
$reference_number = "KHI-{$year}-{$sequence}";

// ── Update the row with the real reference number
/*SQL — UPDATE complaint with generated reference number */
$upd = $conn->prepare("
    UPDATE complaints SET reference_number = ? WHERE complaint_id = ?
");
/*END*/
$upd->bind_param("si", $reference_number, $complaint_id);
$upd->execute();

// ── If witnesses were reported, insert into the witnesses table
if ($has_witnesses && $witness_name !== '') {
    /*SQL — INSERT witness record linked to this complaint */
    $wStmt = $conn->prepare("
        INSERT INTO witnesses (complaint_id, witness_name, witness_contact)
        VALUES (?, ?, ?)
    ");
    /*END*/
    $wStmt->bind_param("iss", $complaint_id, $witness_name, $witness_contact);
    $wStmt->execute();
}

// ── Insert first timeline entry into case_updates
//    (trigger handles future status changes — this is the initial Submitted entry)
/*SQL — INSERT first timeline entry for this complaint */
$upd2 = $conn->prepare("
    INSERT INTO case_updates (complaint_id, status, note, updated_by)
    VALUES (?, 'Submitted', 'Complaint submitted by citizen', 'System')
");
/*END*/
$upd2->bind_param("i", $complaint_id);
$upd2->execute();

echo json_encode([
    'success'          => true,
    'message'          => 'Complaint submitted successfully',
    'reference_number' => $reference_number,
    'complaint_id'     => $complaint_id,
]);
?>