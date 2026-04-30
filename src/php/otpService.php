<?php
require_once __DIR__ . '/../config/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Generates, stores and emails an OTP code.
 */
function ensureMailerAutoloaded(): array
{
    $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        error_log('otpService.php: Missing Composer autoload file at ' . $autoloadPath);
        return [
            'success' => false,
            'message' => 'Mail service is not configured on server. Please run composer install.'
        ];
    }

    require_once $autoloadPath;
    if (!class_exists(PHPMailer::class)) {
        error_log('otpService.php: PHPMailer class not found after loading Composer autoload.');
        return [
            'success' => false,
            'message' => 'Mail service dependencies are incomplete. Please contact support.'
        ];
    }

    return ['success' => true];
}

function configureSmtpMailer(PHPMailer $mail): void
{
    if (
        !defined('SMTP_HOST') ||
        !defined('SMTP_USERNAME') ||
        !defined('SMTP_PASSWORD') ||
        !defined('SMTP_PORT') ||
        !defined('SMTP_SECURE')
    ) {
        throw new RuntimeException('SMTP settings are missing in config.php');
    }

    $mail->isSMTP();
    $mail->Host = (string)SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = (string)SMTP_USERNAME;
    $mail->Password = (string)SMTP_PASSWORD;
    $mail->SMTPSecure = (string)SMTP_SECURE;
    $mail->Port = (int)SMTP_PORT;
    $mail->Timeout = 15;

    // XAMPP on Windows often misses a CA bundle, which breaks TLS verification.
    $isLocal = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', '::1'], true);
    if ($isLocal) {
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ],
        ];
    }
}

function sendOtpForCitizen(mysqli $conn, string $cnic, string $email, string $firstname, string $purpose = 'register'): array
{
    if (!$cnic || !$email) {
        return ['success' => false, 'message' => 'Missing required fields'];
    }

    $autoloadState = ensureMailerAutoloaded();
    if (!$autoloadState['success']) {
        return $autoloadState;
    }

    // Max 5 OTP requests per hour per CNIC.
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS count FROM otp_verifications
        WHERE cnic = ? AND created_at > NOW() - INTERVAL 1 HOUR
    ");
    $stmt->bind_param("s", $cnic);
    $stmt->execute();
    $rate = $stmt->get_result()->fetch_assoc();

    if (($rate['count'] ?? 0) >= 5) {
        return ['success' => false, 'message' => 'Too many attempts. Please wait an hour.'];
    }

    $stmt = $conn->prepare("DELETE FROM otp_verifications WHERE cnic = ? AND verified = 0");
    $stmt->bind_param("s", $cnic);
    $stmt->execute();

    $otp = rand(100000, 999999);
    $hashed_otp = password_hash((string)$otp, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("
        INSERT INTO otp_verifications (cnic, otp, expires_at)
        VALUES (?, ?, NOW() + INTERVAL 10 MINUTE)
    ");
    $stmt->bind_param("ss", $cnic, $hashed_otp);
    $stmt->execute();

    $_SESSION['otp_cnic'] = $cnic;
    $_SESSION['otp_email'] = $email;
    $_SESSION['otp_purpose'] = $purpose;

    $mail = new PHPMailer(true);

    try {
        configureSmtpMailer($mail);

        $mail->setFrom('noreply.picmskarachi@gmail.com', 'PICMS Karachi Police');
        $mail->addAddress($email);

        $subject = $purpose === 'forgot_password'
            ? 'PICMS Password Reset Code'
            : 'PICMS Email Verification Code';
        $heading = $purpose === 'forgot_password'
            ? 'Password Reset Request'
            : 'Email Verification';

        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 420px; padding: 24px;'>
                <h2 style='color: #0d1b2e;'>PICMS - $heading</h2>
                <p>Dear $firstname,</p>
                <p>Your one-time verification code is:</p>
                <h1 style='letter-spacing: 10px; color: #b8933f; font-size: 36px;'>$otp</h1>
                <p>This code expires in <strong>10 minutes</strong>.</p>
                <p style='color: #999;'>Do not share this code with anyone.</p>
                <hr style='border:none; border-top:1px solid #eee; margin:16px 0;'/>
                <p style='color:#aaa; font-size:12px;'>Karachi Police - PICMS Citizen Portal</p>
            </div>
        ";

        $mail->send();
        return ['success' => true, 'message' => 'OTP sent to your email'];
    } catch (RuntimeException $e) {
        error_log('otpService.php config error: ' . $e->getMessage());
        return ['success' => false, 'message' => 'Mail service is not configured on server.'];
    } catch (Exception $e) {
        error_log('otpService.php mail error: ' . $mail->ErrorInfo . ' | exception: ' . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to send email. Please try again.'];
    }
}

/**
 * Compatibility wrapper for admin/officer OTP flows.
 */
function sendOTPEmail(string $email, string $fullName, string $otp): bool
{
    $autoloadState = ensureMailerAutoloaded();
    if (!$autoloadState['success']) {
        return false;
    }

    $mail = new PHPMailer(true);

    try {
        configureSmtpMailer($mail);

        $mail->setFrom('noreply.picmskarachi@gmail.com', 'PICMS Karachi Police');
        $mail->addAddress($email);
        $mail->Subject = 'PICMS Password Reset Code';
        $mail->isHTML(true);
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 420px; padding: 24px;'>
                <h2 style='color: #0d1b2e;'>PICMS - Password Reset Request</h2>
                <p>Dear {$fullName},</p>
                <p>Your one-time verification code is:</p>
                <h1 style='letter-spacing: 10px; color: #b8933f; font-size: 36px;'>{$otp}</h1>
                <p>This code expires in <strong>10 minutes</strong>.</p>
                <p style='color: #999;'>Do not share this code with anyone.</p>
                <hr style='border:none; border-top:1px solid #eee; margin:16px 0;'/>
                <p style='color:#aaa; font-size:12px;'>Karachi Police - PICMS Portal</p>
            </div>
        ";

        $mail->send();
        return true;
    } catch (RuntimeException $e) {
        error_log('otpService.php config error: ' . $e->getMessage());
        return false;
    } catch (Exception $e) {
        error_log('otpService.php sendOTPEmail error: ' . $mail->ErrorInfo . ' | exception: ' . $e->getMessage());
        return false;
    }
}
?>
