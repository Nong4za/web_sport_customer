<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

// ================== INPUT ==================

$branchId   = $_GET["branch_id"] ?? null;
$q          = $_GET["q"] ?? null;
$status     = $_GET["status"] ?? null;
$categoryId = $_GET["category_id"] ?? null;

$where = [];

// ================== BRANCH (สำคัญสุด) ==================
if ($branchId) {
    $branchId = $conn->real_escape_string($branchId);
    $where[] = "ei.branch_id = '$branchId'";
} else {
    echo json_encode([
        "success" => false,
        "message" => "No branch selected"
    ]);
    exit;
}

// ================== SEARCH ==================
if ($q) {
    $safe = $conn->real_escape_string($q);
    $where[] = "
        (em.name LIKE '%$safe%' 
        OR ei.instance_code LIKE '%$safe%')
    ";
}

// ================== STATUS ==================
if ($status) {
    $safe = $conn->real_escape_string($status);
    $where[] = "ei.status = '$safe'";
}

// ================== CATEGORY ==================
if ($categoryId) {
    $where[] = "em.category_id = " . intval($categoryId);
}

// ================== SQL ==================

$sql = "
SELECT 
    ei.instance_code,
    ei.status,
    em.name,
    em.price_per_unit,
    c.name AS category_name,
    b.name AS branch_name

FROM equipment_instances ei

INNER JOIN equipment_master em 
    ON ei.equipment_id = em.equipment_id

LEFT JOIN categories c
    ON em.category_id = c.category_id

LEFT JOIN branches b
    ON ei.branch_id = b.branch_id
";

// ================== WHERE ==================
if (!empty($where)) {
    $sql .= " WHERE " . implode(" AND ", $where);
}

$sql .= " ORDER BY em.name";

// ================== EXECUTE ==================

$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        "success" => false,
        "error" => $conn->error,
        "sql" => $sql
    ]);
    exit;
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);

$conn->close();
