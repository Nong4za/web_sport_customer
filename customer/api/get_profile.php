<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

// ต้อง login มาก่อน
$customerId = $_SESSION["customer_id"] ?? null;

if (!$customerId) {
    echo json_encode([
        "success" => false,
        "message" => "ยังไม่ได้เข้าสู่ระบบ"
    ]);
    exit;
}

// ดึงข้อมูลจาก customers
$sql = "
    SELECT 
        customer_id,
        name,
        email,
        phone,
        member_level,
        current_points
    FROM customers
    WHERE customer_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $customerId);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบข้อมูลผู้ใช้"
    ]);
    exit;
}

$row = $result->fetch_assoc();

// ส่งกลับให้ frontend
echo json_encode([
    "success" => true,
    "customer_id" => $row["customer_id"],
    "name" => $row["name"],
    "email" => $row["email"],
    "phone" => $row["phone"],
    "member_level" => $row["member_level"],
    "points" => $row["current_points"]
]);
