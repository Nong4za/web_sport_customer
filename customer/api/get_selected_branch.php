<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$branchId = $_SESSION["branch_id"] ?? null;

if (!$branchId) {
    echo json_encode([
        "success" => false
    ]);
    exit;
}

$sql = "
SELECT branch_id, name, open_time, close_time
FROM branches
WHERE branch_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $branchId);
$stmt->execute();

$result = $stmt->get_result()->fetch_assoc();

echo json_encode($result, JSON_UNESCAPED_UNICODE);
