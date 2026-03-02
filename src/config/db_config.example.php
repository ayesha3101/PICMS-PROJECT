<?php
// Database Configuration Template

$host = "localhost";
$username = "root";
$password = "your_password_here";  // Change this!
$database = "picms_db";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>