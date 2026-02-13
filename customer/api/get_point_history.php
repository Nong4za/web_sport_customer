<?php
session_start();
require_once "../../database.php";
header("Content-Type: application/json; charset=utf-8");

$cid = $_SESSION["customer_id"] ?? null;
if (!$cid) {
    echo json_encode(["success"=>false,"message"=>"no session"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT 
        history_id,
        booking_id,
        type,
        amount,
        description
    FROM point_history
    WHERE customer_id = ?
    ORDER BY history_id DESC
");
$stmt->bind_param("s", $cid);
$stmt->execute();

$res = $stmt->get_result();
$data = [];

while($row = $res->fetch_assoc()){
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "items" => $data
]);