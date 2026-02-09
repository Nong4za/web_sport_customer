<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sports_rental_system";
$port = 3307;

$conn = new mysqli($servername, $username, $password, $dbname, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>