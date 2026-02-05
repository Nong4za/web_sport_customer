<?php
require "database.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false]);
    exit;
}

$sql = "INSERT INTO equipment_master
(
    equipment_id,
    category_id,
    name,
    image_url,
    price_per_unit,
    total_stock,
    description
)
VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "sissdis",
    $data['equipment_id'],
    $data['category_id'],
    $data['name'],
    $data['image_url'],
    $data['price_per_unit'],
    $data['total_stock'],
    $data['description']
);

$ok = $stmt->execute();

echo json_encode(["success" => $ok]);

$stmt->close();
$conn->close();
