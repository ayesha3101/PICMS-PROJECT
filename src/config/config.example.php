<?php
$host = 'localhost';
$db   = 'your_database_name';
$user = 'root';
$pass = '';

// SMTP settings for OTP emails (recommended: Gmail App Password or SMTP relay)
// Make sure to create `src/config/config.php` (not committed) with real values.
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls'); // 'tls' (STARTTLS) or 'ssl'
define('SMTP_USERNAME', 'noreply@example.com');
define('SMTP_PASSWORD', 'your_smtp_password_here');

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]));
}
?>