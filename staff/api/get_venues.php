<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$branchId   = $_GET["branch_id"] ?? null;
$categories = $_GET["categories"] ?? "";
$minPrice   = $_GET["min_price"] ?? null;
$maxPrice   = $_GET["max_price"] ?? null;
$q          = $_GET["q"] ?? null;

$where = [];

// ================= BRANCH =================
if ($branchId) {
    $branchId = $conn->real_escape_string($branchId);
    $where[] = "v.branch_id = '$branchId'";
}

// ================= CATEGORY =================
if ($categories) {
    $ids = array_map("intval", explode(",", $categories));
    $in = implode(",", $ids);
    $where[] = "v.category_id IN ($in)";
}

// ================= PRICE =================
if ($minPrice !== null) {
    $where[] = "v.price_per_hour >= " . floatval($minPrice);
}

if ($maxPrice !== null) {
    $where[] = "v.price_per_hour <= " . floatval($maxPrice);
}

// ================= SEARCH =================
if ($q) {
    $safe = $conn->real_escape_string($q);
    $where[] = "v.name LIKE '%$safe%'";
}

// ================= SQL =================

$sql = "
SELECT
    v.venue_id,
    v.name,
    v.image_url,
    v.price_per_hour,
    v.type,
    v.category_id
FROM venues v
WHERE v.is_active = 1
";

if ($where) {
    $sql .= " AND " . implode(" AND ", $where);
}

$sql .= " ORDER BY v.name";

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
