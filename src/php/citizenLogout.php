<?php
// logout.php
// Job: destroy session and redirect to login
session_start();
session_destroy();
header('Location: ../html/citizenLogin.html');
exit;
?>

