<?php

session_start();
require_once "../../database.php";

header("Content-Type: application/json");

$customerId = $_SESSION["customer_id"] ?? null;
$branchId   = $_SESSION["branch_id"] ?? null;

if (!$customerId || !$branchId) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบสาขาที่เลือก"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT
        b.booking_id,
        b.pickup_time,
        b.due_return_time,
        b.net_amount,
        bs.code AS status_code
    FROM bookings b
    JOIN booking_status bs
        ON b.booking_status_id = bs.id
    WHERE b.customer_id = ?
      AND b.branch_id = ?
");

$stmt->bind_param(
    "ss",
    $customerId,
    $branchId
);

$stmt->execute();

$res = $stmt->get_result();

$rows = [];

while ($r = $res->fetch_assoc()) {
    $rows[] = $r;
}

echo json_encode([
    "success" => true,
    "bookings" => $rows
]);
