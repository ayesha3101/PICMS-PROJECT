<?php
// logout.php
// Job: destroy session and redirect to login
session_start();
session_destroy();
header('Location: ../citizen/citizenLogin.html');
exit;
?>

