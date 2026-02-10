<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$equipmentId = $_GET["equipment_id"] ?? null;
$branchId    = $_SESSION["branch_id"] ?? null;

if (!$equipmentId) {
    echo json_encode([
        "success" => false,
        "message" => "missing equipment_id"
    ]);
    exit;
}

if (!$branchId) {
    echo json_encode([
        "success" => false,
        "message" => "missing branch in session"
    ]);
    exit;
}

$sql = "
    SELECT instance_code, branch_id
    FROM equipment_instances
    WHERE equipment_id = ?
      AND branch_id = ?
      AND status = 'Ready'
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $equipmentId, $branchId);
$stmt->execute();

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "instances" => $data
]);
