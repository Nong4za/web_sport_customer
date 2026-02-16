<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

/* ===== AUTH STAFF ===== */

if (!isset($_SESSION["staff_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized"
    ]);
    exit;
}

$categoryId = $_GET["category_id"] ?? null;

if (!$categoryId) {
    echo json_encode([
        "success" => false,
        "message" => "missing category_id"
    ]);
    exit;
}

/* ===== SQL ===== */

$sql = "
    SELECT equipment_id, name
    FROM equipment_master
    WHERE category_id = ?
    ORDER BY name
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $categoryId);
$stmt->execute();

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);

$conn->close();
