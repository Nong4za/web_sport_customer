<?php
require_once "../../database.php";

header("Content-Type: application/json");

$result = $conn->query("SELECT gender_id, name_th FROM genders");

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
