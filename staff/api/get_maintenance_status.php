<?php
require_once "../../database.php";
header("Content-Type: application/json; charset=utf-8");

$sql = "SELECT status_id, name_th FROM maintenance_status ORDER BY status_id ASC";

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
