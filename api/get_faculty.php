<?php
require_once "database.php";

header("Content-Type: application/json");

$sql = "SELECT id, name FROM faculty ORDER BY name ASC";
$result = $conn->query($sql);

$faculties = [];

while ($row = $result->fetch_assoc()) {
    $faculties[] = $row;
}

echo json_encode($faculties);

$conn->close();
