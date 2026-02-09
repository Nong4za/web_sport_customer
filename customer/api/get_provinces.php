<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$region = $_GET["region"] ?? null;

$sql = "
SELECT province_id, name
FROM provinces
";

if ($region && $region !== "all") {
    $sql .= " WHERE region_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $region);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($sql);
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
