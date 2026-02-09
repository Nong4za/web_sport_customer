<?php
session_start();
require "../database.php";

$cid = $_SESSION["customer_id"] ?? null;

$stmt = $conn->prepare("
    SELECT refund_bank,
           refund_account_number,
           refund_account_name
    FROM customers
    WHERE customer_id = ?
");

$stmt->bind_param("s", $cid);
$stmt->execute();

$r = $stmt->get_result()->fetch_assoc();

echo json_encode([
    "hasRefund" => !empty($r["refund_bank"]),
    "bank" => $r["refund_bank"],
    "account" => $r["refund_account_number"],
    "name" => $r["refund_account_name"]
]);
