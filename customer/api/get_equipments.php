<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$branchId   = $_GET["branch_id"] ?? null;
$categories = $_GET["categories"] ?? "";
$minPrice = $_GET["min_price"] ?? null;
$maxPrice = $_GET["max_price"] ?? null;
$q          = $_GET["q"] ?? null;

$where = [];

// ================== BRANCH ==================
if ($branchId) {
    $branchId = $conn->real_escape_string($branchId);
    $where[] = "ei.branch_id = '$branchId'";
}

// ================== CATEGORY ==================
if ($categories) {
    $ids = array_map("intval", explode(",", $categories));
    $in  = implode(",", $ids);
    $where[] = "em.category_id IN ($in)";
}

// ================== PRICE ==================
if ($minPrice !== null) {
    $where[] = "em.price_per_unit >= " . floatval($minPrice);
}

if ($maxPrice !== null) {
    $where[] = "em.price_per_unit <= " . floatval($maxPrice);
}


// ================== SEARCH ==================
if ($q) {
    $safe = $conn->real_escape_string($q);
    $where[] = "em.name LIKE '%$safe%'";
}

// ================== SQL ==================

$sql = "
SELECT 
    em.equipment_id,
    em.name,
    em.image_url,
    em.price_per_unit,
    em.category_id,
    COUNT(ei.instance_code) AS available_stock
FROM equipment_master em
LEFT JOIN equipment_instances ei 
    ON em.equipment_id = ei.equipment_id
    AND ei.status = 'Ready'
";

if ($where) {
    $sql .= " WHERE " . implode(" AND ", $where);
}

$sql .= "
GROUP BY em.equipment_id
ORDER BY em.name
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
