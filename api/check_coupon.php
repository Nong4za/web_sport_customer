<?php
session_start();
require_once "database.php";

header("Content-Type: application/json; charset=utf-8");

/* ===============================
   CHECK LOGIN
================================ */

$customerId = $_SESSION["customer_id"] ?? null;

if (!$customerId) {
    echo json_encode([
        "success" => false,
        "message" => "กรุณาเข้าสู่ระบบก่อนใช้คูปอง"
    ]);
    exit;
}

/* ===============================
   INPUT
================================ */

$code  = $_GET["code"] ?? "";
$total = isset($_GET["total"]) ? floatval($_GET["total"]) : 0;

$nowDate = date("Y-m-d");
$nowTime = date("H:i:s");
$today   = date("Y-m-d");

if (!$code) {
    echo json_encode([
        "success" => false,
        "message" => "กรุณาใส่รหัสคูปอง"
    ]);
    exit;
}

/* ===============================
   LOAD CUSTOMER
================================ */

$stmt = $conn->prepare("
    SELECT customer_id, customer_type, member_level
    FROM customers
    WHERE customer_id = ?
");
$stmt->bind_param("s", $customerId);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบข้อมูลผู้ใช้"
    ]);
    exit;
}

/* ===============================
   LOAD COUPON
================================ */

$stmt = $conn->prepare("
    SELECT *
    FROM coupons
    WHERE code = ?
    LIMIT 1
");
$stmt->bind_param("s", $code);
$stmt->execute();
$coupon = $stmt->get_result()->fetch_assoc();

if (!$coupon) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบคูปองนี้"
    ]);
    exit;
}

/* ===============================
   ACTIVE
================================ */

if ($coupon["is_active"] != 1) {
    echo json_encode([
        "success" => false,
        "message" => "คูปองนี้ไม่เปิดใช้งาน"
    ]);
    exit;
}

/* ===============================
   DATE RANGE
================================ */

if ($coupon["start_date"] && $coupon["start_date"] > $nowDate) {
    echo json_encode([
        "success" => false,
        "message" => "คูปองยังไม่ถึงวันใช้งาน"
    ]);
    exit;
}

if ($coupon["expiry_date"] && $coupon["expiry_date"] < $nowDate) {
    echo json_encode([
        "success" => false,
        "message" => "คูปองหมดอายุแล้ว"
    ]);
    exit;
}

/* ===============================
   TIME RANGE
================================ */

if ($coupon["start_time"] && $coupon["end_time"]) {

    if (
        $nowTime < $coupon["start_time"] ||
        $nowTime > $coupon["end_time"]
    ) {
        echo json_encode([
            "success" => false,
            "message" => "คูปองใช้ไม่ได้ในช่วงเวลานี้"
        ]);
        exit;
    }
}

/* ===============================
   MIN PURCHASE
================================ */

if (
    $coupon["min_purchase"] > 0 &&
    $total < $coupon["min_purchase"]
) {
    echo json_encode([
        "success" => false,
        "message" =>
            "ต้องมียอดขั้นต่ำ " .
            $coupon["min_purchase"] .
            " บาท"
    ]);
    exit;
}

/* ===============================
   CUSTOMER TYPE
================================ */

if (
    !empty($coupon["allowed_customer_type"]) &&
    $coupon["allowed_customer_type"] !== "all"
) {

    if ($coupon["allowed_customer_type"] !== $user["customer_type"]) {

        echo json_encode([
            "success" => false,
            "message" =>
                "คูปองนี้ใช้ได้เฉพาะลูกค้าประเภท " .
                $coupon["allowed_customer_type"]
        ]);
        exit;
    }
}

/* ===============================
   MEMBER LEVEL
================================ */

if (
    !empty($coupon["allowed_member_level"]) &&
    $coupon["allowed_member_level"] !== "all"
) {

    if ($coupon["allowed_member_level"] !== $user["member_level"]) {

        echo json_encode([
            "success" => false,
            "message" =>
                "คูปองนี้ใช้ได้เฉพาะสมาชิกระดับ " .
                $coupon["allowed_member_level"]
        ]);
        exit;
    }
}

/* ===============================
   CATEGORY CHECK (OPTIONAL)
================================
   frontend ต้องส่ง cart มาแบบ JSON POST
================================ */

$input = json_decode(file_get_contents("php://input"), true);
$cart  = $input["cart"] ?? [];

if (!empty($coupon["category_id"]) && $cart) {

    foreach ($cart as $item) {

        if (
            !isset($item["category_id"]) ||
            $item["category_id"] != $coupon["category_id"]
        ) {

            echo json_encode([
                "success" => false,
                "message" =>
                    "คูปองนี้ใช้ได้เฉพาะหมวดกีฬาที่กำหนด"
            ]);
            exit;
        }
    }
}

/* ===============================
   PER USER LIMIT
================================ */

if (!empty($coupon["per_user_limit"])) {

    $stmt = $conn->prepare("
        SELECT COUNT(*) c
        FROM coupon_usages
        WHERE coupon_code = ?
          AND customer_id = ?
    ");
    $stmt->bind_param("ss", $code, $customerId);
    $stmt->execute();

    $count =
        $stmt->get_result()->fetch_assoc()["c"] ?? 0;

    if ($count >= $coupon["per_user_limit"]) {

        echo json_encode([
            "success" => false,
            "message" =>
                "คุณใช้คูปองนี้ครบจำนวนแล้ว"
        ]);
        exit;
    }
}

/* ===============================
   PER USER DAILY LIMIT
================================ */

if (!empty($coupon["per_user_daily_limit"])) {

    $stmt = $conn->prepare("
        SELECT COUNT(*) c
        FROM coupon_usages
        WHERE coupon_code = ?
          AND customer_id = ?
          AND DATE(used_at) = ?
    ");
    $stmt->bind_param(
        "sss",
        $code,
        $customerId,
        $today
    );
    $stmt->execute();

    $count =
        $stmt->get_result()->fetch_assoc()["c"] ?? 0;

    if ($count >= $coupon["per_user_daily_limit"]) {

        echo json_encode([
            "success" => false,
            "message" =>
                "วันนี้คุณใช้คูปองนี้ครบแล้ว"
        ]);
        exit;
    }
}

/* ===============================
   GLOBAL LIMIT
================================ */

if (
    $coupon["usage_limit"] &&
    $coupon["used_count"] >= $coupon["usage_limit"]
) {

    echo json_encode([
        "success" => false,
        "message" =>
            "คูปองนี้ถูกใช้ครบแล้ว"
    ]);
    exit;
}

/* ===============================
   SUCCESS
================================ */

echo json_encode([
    "success" => true,
    "discount" => (int)$coupon["discount_value"],
    "type"     => $coupon["discount_type"],
    "name"     => $coupon["name"],
    "min_purchase" =>
        (int)$coupon["min_purchase"]
]);

$conn->close();
