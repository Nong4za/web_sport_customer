<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$region   = $_GET["region"] ?? null;
$province = $_GET["province"] ?? null;

$sql = "
SELECT 
    b.branch_id,
    b.name,
    b.phone,
    b.open_time,
    b.close_time,
    b.latitude,
    b.longitude,
    p.name AS province_name,
    r.region_name
FROM branches b
JOIN provinces p ON b.province_id = p.province_id
JOIN region r ON p.region_id = r.region_id
WHERE b.is_active = 1
";

$params = [];
$types = "";

if ($region && $region !== "all") {
    $sql .= " AND r.region_id = ?";
    $types .= "i";
    $params[] = $region;
}

if ($province && $province !== "all") {
    $sql .= " AND p.province_id = ?";
    $types .= "i";
    $params[] = $province;
}

$stmt = $conn->prepare($sql);

if ($params) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
