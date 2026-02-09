<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$sql = "SELECT category_id, name FROM categories ORDER BY name";

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
