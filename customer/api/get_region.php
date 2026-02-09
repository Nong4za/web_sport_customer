<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$result = $conn->query("
SELECT region_id, region_name
FROM region
ORDER BY region_id
");

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
