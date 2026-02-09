<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$now = date("Y-m-d H:i:s");

$sql = "
SELECT
    code,
    name,
    discount_value,
    discount_type,
    min_purchase,
    start_date,
    expiry_date,
    start_time,
    end_time,
    usage_limit,
    per_user_limit,
    used_count,
    is_active
FROM coupons
WHERE is_active = 1
AND (start_date IS NULL OR start_date <= '$now')
AND (expiry_date IS NULL OR expiry_date >= '$now')
ORDER BY expiry_date ASC
";

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
