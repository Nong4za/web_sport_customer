<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

/* ===============================
   READ JSON INPUT
================================ */
$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "JSON ไม่ถูกต้อง"
    ]);
    exit;
}

/* ===============================
   INPUT
================================ */
$cart       = $data["cart"] ?? [];
$rentDate   = $data["rentDate"] ?? null;
$timeSlot   = isset($data["timeSlot"]) ? (int)$data["timeSlot"] : null;
$rentHours  = (int)($data["rentHours"] ?? 1);

$usedPoints     = (int)($data["usedPoints"] ?? 0);
$couponDiscount = (float)($data["couponDiscount"] ?? 0);
$couponCode     = !empty($data["couponCode"]) ? trim($data["couponCode"]) : null;

$branchId   = $data["branchId"] ?? null;
$customerId = $_SESSION["customer_id"] ?? null;

/* ===============================
   VALIDATE
================================ */
if (!$customerId || !$branchId || !$rentDate || $timeSlot === null || empty($cart)) {
    echo json_encode([
        "success" => false,
        "message" => "ข้อมูลไม่ครบ"
    ]);
    exit;
}

$conn->begin_transaction();

try {

    /* ===============================
       HELPER
    ================================ */
    function getIdByCode($conn, $table, $code) {
        $stmt = $conn->prepare("SELECT id FROM {$table} WHERE code = ? LIMIT 1");
        $stmt->bind_param("s", $code);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        return $res ? (int)$res["id"] : null;
    }

    function generateBookingCode($conn) {
        do {
            $code = "BK" . str_pad(random_int(0, 999999), 6, "0", STR_PAD_LEFT);
            $stmt = $conn->prepare("SELECT 1 FROM bookings WHERE booking_id = ?");
            $stmt->bind_param("s", $code);
            $stmt->execute();
            $stmt->store_result();
        } while ($stmt->num_rows > 0);

        return $code;
    }

    /* ===============================
       MASTER LOOKUP
    ================================ */
    $bookingStatusId = getIdByCode($conn, "booking_status", "WAITING_STAFF");
    $paymentStatusId = getIdByCode($conn, "payment_status", "UNPAID");
    $bookingTypeId   = getIdByCode($conn, "booking_types", "ONLINE");

    if (!$bookingStatusId || !$paymentStatusId || !$bookingTypeId) {
        throw new Exception("ไม่พบ master status/type");
    }

    /* ===============================
       DATETIME
    ================================ */
    $pickup = date("Y-m-d H:i:s", strtotime("$rentDate $timeSlot:00"));
    $return = date("Y-m-d H:i:s", strtotime("+$rentHours hours", strtotime($pickup)));

    /* ===============================
       CALCULATE MONEY (รองรับ qty)
    ================================ */
    $totalAmount = 0;

    foreach ($cart as $item) {
        $price = (float)$item["price"];
        $qty   = (int)($item["qty"] ?? 1);

        $totalAmount += $price * $qty * $rentHours;
    }

    $extraHourFee = 0;
    if ($rentHours === 4) $extraHourFee = 100;
    elseif ($rentHours === 5) $extraHourFee = 200;
    elseif ($rentHours >= 6) $extraHourFee = 300;

    $netAmount = max(
        ($totalAmount + $extraHourFee)
        - $couponDiscount
        - $usedPoints,
        0
    );

    $pointsEarned = floor($netAmount / 100);

    /* ===============================
       INSERT BOOKING
    ================================ */
    $bookingCode = generateBookingCode($conn);

    $stmt = $conn->prepare("
        INSERT INTO bookings (
            booking_id,
            customer_id,
            branch_id,
            booking_type_id,
            booking_status_id,
            payment_status_id,
            pickup_time,
            due_return_time,
            total_amount,
            discount_amount,
            extra_hour_fee,
            net_amount,
            coupon_code,
            points_used,
            points_used_value,
            points_earned
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");

    $stmt->bind_param(
        "sssiiissddddsidi",
        $bookingCode,
        $customerId,
        $branchId,
        $bookingTypeId,
        $bookingStatusId,
        $paymentStatusId,
        $pickup,
        $return,
        $totalAmount,
        $couponDiscount,
        $extraHourFee,
        $netAmount,
        $couponCode,
        $usedPoints,
        $usedPoints,
        $pointsEarned
    );

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    /* ===============================
       INSERT DETAILS (วนตาม qty)
    ================================ */
    $dStmt = $conn->prepare("
        INSERT INTO booking_details (
            booking_id,
            item_type,
            equipment_id,
            venue_id,
            quantity,
            price_at_booking
        )
        VALUES (?,?,?,?,?,?)
    ");

    foreach ($cart as $item) {

        $type = strtolower($item["type"] ?? "");
        $equipmentId = null;
        $venueId = null;

        if ($type === "venue" || $type === "field") {
            $itemType = "Venue";
            $venueId = trim($item["id"]);
        } else {
            $itemType = "Equipment";
            $equipmentId = trim($item["id"]);
        }

        $qty   = (int)($item["qty"] ?? 1);
        $price = (float)$item["price"];

        // 🔥 สร้าง 1 row ต่อ 1 ชิ้น
        for ($i = 0; $i < $qty; $i++) {

            $oneQty = 1;

            $dStmt->bind_param(
                "sssssd",
                $bookingCode,
                $itemType,
                $equipmentId,
                $venueId,
                $oneQty,
                $price
            );

            if (!$dStmt->execute()) {
                throw new Exception($dStmt->error);
            }
        }
    }

    /* ===============================
       COUPON
    ================================ */
    if (!empty($couponCode)) {

        $insertCoupon = $conn->prepare("
            INSERT INTO coupon_usages (coupon_code, customer_id)
            VALUES (?, ?)
        ");
        $insertCoupon->bind_param("ss", $couponCode, $customerId);
        $insertCoupon->execute();

        $updateCoupon = $conn->prepare("
            UPDATE coupons
            SET used_count = used_count + 1
            WHERE code = ?
        ");
        $updateCoupon->bind_param("s", $couponCode);
        $updateCoupon->execute();
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "booking_code" => $bookingCode
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
