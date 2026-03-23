<?php
// ══════════════════════════════════════════════
// submitComplaint.php
// Job: validate and insert a new complaint,
//      generate reference number KHI-YY-XXXXX,
//      send confirmation email via PHPMailer
// ══════════════════════════════════════════════
session_start();
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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
$category          = trim($data['category']          ?? '');
$subcategory       = trim($data['subcategory']        ?? '');
$incident_date     = trim($data['incident_date']      ?? '');
$incident_time     = trim($data['incident_time']      ?? '') ?: null;
$description       = trim($data['description']        ?? '');
$incident_area     = trim($data['incident_area']      ?? '');
$incident_landmark = trim($data['incident_landmark']  ?? '');
$station_id        = (int)($data['station_id']        ?? 0);
$has_witnesses     = (int)($data['has_witnesses']     ?? 0);
$witness_name      = trim($data['witness_name']       ?? '');
$witness_contact   = trim($data['witness_contact']    ?? '');
$is_anonymous      = (int)($data['is_anonymous']      ?? 0);

// ── Server-side validation
if (!$category || !$incident_date || !$description || !$incident_area || !$station_id) {
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

// ── Auto-set priority for sensitive categories
$urgent_categories = ['Missing Person', 'Domestic Violence'];
$priority = in_array($category, $urgent_categories) ? 'Urgent' : 'Normal';

// ── Insert complaint with a temporary placeholder reference number
//    We need complaint_id first to build the real reference number
/*SQL — INSERT new complaint row, reference_number filled after */
$stmt = $conn->prepare("
    INSERT INTO complaints (
        reference_number, cnic, station_id,
        category, subcategory,
        incident_area, incident_landmark,
        incident_date, incident_time,
        description,
        has_witnesses, witness_name, witness_contact,
        is_anonymous, priority, status
    ) VALUES (
        'TEMP', ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?,
        ?, ?, ?,
        ?, ?, 'Submitted'
    )
");
/*END*/
$stmt->bind_param(
    "siissssssiissis",
    $cnic, $station_id,
    $category, $subcategory,
    $incident_area, $incident_landmark,
    $incident_date, $incident_time,
    $description,
    $has_witnesses, $witness_name, $witness_contact,
    $is_anonymous, $priority
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

// ── Fetch citizen details for the confirmation email
/*SQL — SELECT citizen name and email for confirmation email */
$cit = $conn->prepare("
    SELECT c_fname, c_lname, email FROM citizens WHERE cnic = ?
");
/*END*/
$cit->bind_param("s", $cnic);
$cit->execute();
$citizen = $cit->get_result()->fetch_assoc();

// ── Fetch station name for the email
/*SQL — SELECT station name to include in confirmation email */
$st = $conn->prepare("
    SELECT station_name FROM stations WHERE station_id = ?
");
/*END*/
$st->bind_param("i", $station_id);
$st->execute();
$station = $st->get_result()->fetch_assoc();

// ── Send confirmation email via PHPMailer
$fname        = $citizen['c_fname'] ?? 'Citizen';
$lname        = $citizen['c_lname'] ?? '';
$email        = $citizen['email']   ?? '';
$station_name = $station['station_name'] ?? 'Karachi Police Station';

if ($email) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'noreply.picmskarachi@gmail.com';
        $mail->Password   = 'mmbrgoxxlwlvezcv';
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('noreply.picmskarachi@gmail.com', 'PICMS Karachi Police');
        $mail->addAddress($email);
        $mail->Subject = "Complaint Received — {$reference_number}";
        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family:Arial,sans-serif;max-width:480px;padding:28px;'>
              <h2 style='color:#08121f;font-family:Georgia,serif;margin-bottom:4px;'>PICMS — Complaint Received</h2>
              <p style='color:#888;font-size:12px;margin-bottom:20px;'>Karachi Police — Citizen Portal</p>
              <p>Dear {$fname} {$lname},</p>
              <p>Your complaint has been successfully submitted and is now under review by the Station House Officer.</p>
              <div style='background:#faf8f5;border:1px solid #e4dfd8;border-radius:8px;padding:16px 20px;margin:20px 0;'>
                <p style='font-size:11px;color:#c9a84c;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;'>Reference Number</p>
                <p style='font-size:22px;font-family:Georgia,serif;font-weight:600;color:#08121f;letter-spacing:2px;margin:0;'>{$reference_number}</p>
              </div>
              <table style='width:100%;font-size:13px;border-collapse:collapse;'>
                <tr><td style='color:#888;padding:5px 0;'>Category</td><td style='color:#1a2232;text-align:right;'>{$category}</td></tr>
                <tr><td style='color:#888;padding:5px 0;'>Assigned Station</td><td style='color:#1a2232;text-align:right;'>{$station_name}</td></tr>
                <tr><td style='color:#888;padding:5px 0;'>Date Filed</td><td style='color:#1a2232;text-align:right;'>".date('d M Y')."</td></tr>
                <tr><td style='color:#888;padding:5px 0;'>Priority</td><td style='color:#1a2232;text-align:right;'>{$priority}</td></tr>
              </table>
              <p style='margin-top:20px;'>A representative will contact you within <strong>48–72 hours</strong> to discuss your case further.</p>
              <p style='color:#999;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;'>Please keep your reference number safe. You can track your case status at any time through the PICMS Citizen Portal.</p>
              <p style='color:#bbb;font-size:11px;'>For emergencies, always call <strong>15</strong> directly.</p>
            </div>
        ";
        $mail->send();
    } catch (Exception $e) {
        // Email failure should not block complaint submission — continue
    }
}

echo json_encode([
    'success'          => true,
    'message'          => 'Complaint submitted successfully',
    'reference_number' => $reference_number,
    'complaint_id'     => $complaint_id,
]);
?>