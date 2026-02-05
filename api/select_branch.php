<?php
session_start();
require_once "database.php";

header("Content-Type: application/json; charset=utf-8");

$branchId = $_POST["branch_id"] ?? null;

if (!$branchId) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบสาขา"
    ]);
    exit;
}

// เช็กว่าสาขามีจริง
$stmt = $conn->prepare("
    SELECT branch_id 
    FROM branches 
    WHERE branch_id = ? AND is_active = 1
");
$stmt->bind_param("s", $branchId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบสาขาในระบบ"
    ]);
    exit;
}

// save session
$_SESSION["branch_id"] = $branchId;

echo json_encode([
    "success" => true
]);
