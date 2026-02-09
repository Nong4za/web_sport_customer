<?php
session_start();
require "../../database.php";

$data = json_decode(file_get_contents("php://input"), true);

$cid = $_SESSION["customer_id"];

$stmt = $conn->prepare("
    UPDATE customers
    SET refund_bank=?,
        refund_account_number=?,
        refund_account_name=?
    WHERE customer_id=?
");

$stmt->bind_param(
    "ssss",
    $data["bank"],
    $data["account"],
    $data["name"],
    $cid
);

$stmt->execute();

echo json_encode(["success" => true]);
