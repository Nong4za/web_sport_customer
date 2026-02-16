<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$sql = "SELECT damage_id, name_th, name_en FROM damage_levels ORDER BY damage_id";

$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);

$conn->close();
