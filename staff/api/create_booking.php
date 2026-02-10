<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

/* ===============================
   STAFF AUTH
================================ */

if (!isset($_SESSION["staff_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "เฉพาะเจ้าหน้าที่เท่านั้น"
    ]);
    exit;
}

$staffId = $_SESSION["staff_id"];

/* ===============================
   READ JSON
================================ */

$raw  = file_get_contents("php://input");
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "JSON ไม่ถูกต้อง",
        "raw" => $raw
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

$couponCode = !empty($data["couponCode"])
    ? trim($data["couponCode"])
    : null;

$branchId   = $data["branchId"] ?? null;
$customerId = $data["customerId"] ?? null;

/* ===============================
   VALIDATE
================================ */

$missing = [];

if (!$customerId) $missing[] = "customerId";
if (!$branchId)   $missing[] = "branchId";
if (!$rentDate)   $missing[] = "rentDate";
if ($timeSlot === null) $missing[] = "timeSlot";
if (empty($cart)) $missing[] = "cart";

if (!empty($missing)) {
    echo json_encode([
        "success" => false,
        "message" => "ข้อมูลไม่ครบ",
        "missing" => $missing
    ]);
    exit;
}

/* ===============================
   TRANSACTION
================================ */

$conn->begin_transaction();

try {

    /* ===============================
       MASTER IDS
    ================================ */

    function getIdByCode($conn, $table, $code) {

        $stmt = $conn->prepare(
            "SELECT id FROM {$table} WHERE code = ? LIMIT 1"
        );

        $stmt->bind_param("s", $code);
        $stmt->execute();

        $res = $stmt->get_result()->fetch_assoc();

        return $res ? (int)$res["id"] : null;
    }

    $bookingStatusId = getIdByCode($conn, "booking_status", "WAITING_STAFF");
    $paymentStatusId = getIdByCode($conn, "payment_status", "UNPAID");
    $bookingTypeId   = getIdByCode($conn, "booking_types", "WALK_IN");

    if (!$bookingStatusId || !$paymentStatusId || !$bookingTypeId) {
        throw new Exception("ไม่พบ master status/type");
    }

    /* ===============================
       BOOKING CODE
    ================================ */

    function generateBookingCode($conn) {

        do {

            $num = random_int(0, 999999);
            $code = "BK" . str_pad($num, 6, "0", STR_PAD_LEFT);

            $stmt = $conn->prepare(
                "SELECT 1 FROM bookings WHERE booking_id = ?"
            );

            $stmt->bind_param("s", $code);
            $stmt->execute();
            $stmt->store_result();

        } while ($stmt->num_rows > 0);

        return $code;
    }

    $bookingCode = generateBookingCode($conn);

    /* ===============================
       DATETIME
    ================================ */

    $pickup = date(
        "Y-m-d H:i:s",
        strtotime("$rentDate $timeSlot:00")
    );

    $return = date(
        "Y-m-d H:i:s",
        strtotime("+$rentHours hours", strtotime($pickup))
    );

    /* ===============================
       MONEY
    ================================ */

    $totalAmount = 0;

    foreach ($cart as $i) {

        $price = (float)$i["price"];
        $qty   = (int)$i["qty"];

        $totalAmount += $price * $qty * $rentHours;
    }

    $extraHourFee = 0;
    if ($rentHours === 4) $extraHourFee = 100;
    elseif ($rentHours === 5) $extraHourFee = 200;
    elseif ($rentHours >= 6) $extraHourFee = 300;

    $gross = $totalAmount + $extraHourFee;

    $pointsUsedValue = $usedPoints;

    $netAmount = max(
        $gross -
        $couponDiscount -
        $pointsUsedValue,
        0
    );

    $pointsEarned = floor($netAmount / 100);

    /* ===============================
       INSERT BOOKINGS
    ================================ */

    $stmt = $conn->prepare("
        INSERT INTO bookings (
            booking_id,
            customer_id,
            staff_id,
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
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");

    $stmt->bind_param(
        "ssssiiissddddsiii",
        $bookingCode,
        $customerId,
        $staffId,
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
        $pointsUsedValue,
        $pointsEarned
    );

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    /* ===============================
       INSERT DETAILS
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

        $typeRaw = strtolower($item["type"] ?? "");

        $equipmentId = null;
        $venueId     = null;

        if ($typeRaw === "field" || $typeRaw === "venue") {
            $type = "Venue";
            $venueId = $item["id"];
        } else {
            $type = "Equipment";
            $equipmentId = $item["id"];
        }

        $qty   = (int)$item["qty"];
        $price = (float)$item["price"];

        $dStmt->bind_param(
            "ssssid",
            $bookingCode,
            $type,
            $equipmentId,
            $venueId,
            $qty,
            $price
        );

        if (!$dStmt->execute()) {
            throw new Exception("booking_details error: " . $dStmt->error);
        }

        /* ===== update equipment_instances ===== */

        if ($type === "Equipment" && !empty($item["instance_code"])) {

            $loc = "Customer";

            $u = $conn->prepare("
                UPDATE equipment_instances
                SET status = 'Rented',
                    current_location = ?
                WHERE instance_code = ?
            ");

            $u->bind_param(
                "ss",
                $loc,
                $item["instance_code"]
            );

            if (!$u->execute()) {
                throw new Exception("update equipment_instances fail");
            }
        }
    }

    /* ===============================
       COUPON
    ================================ */

    if ($couponCode) {

        $stmt = $conn->prepare("
            INSERT INTO coupon_usages
            (coupon_code, customer_id, booking_id)
            VALUES (?, ?, ?)
        ");

        $stmt->bind_param(
            "sss",
            $couponCode,
            $customerId,
            $bookingCode
        );

        $stmt->execute();

        $conn->query("
            UPDATE coupons
            SET used_count = used_count + 1
            WHERE code = '$couponCode'
        ");
    }

    /* ===============================
       POINT HISTORY
    ================================ */

    if ($usedPoints > 0) {

        $conn->prepare("
            UPDATE customers
            SET current_points = current_points - $usedPoints
            WHERE customer_id = '$customerId'
        ")->execute();

        $conn->prepare("
            INSERT INTO point_history
            (customer_id, booking_id, type, amount, description)
            VALUES ('$customerId','$bookingCode','redeem',$usedPoints,'ใช้แต้มแลกส่วนลด')
        ")->execute();
    }

    if ($pointsEarned > 0) {

        $conn->prepare("
            UPDATE customers
            SET current_points = current_points + $pointsEarned
            WHERE customer_id = '$customerId'
        ")->execute();

        $conn->prepare("
            INSERT INTO point_history
            (customer_id, booking_id, type, amount, description)
            VALUES ('$customerId','$bookingCode','earn',$pointsEarned,'ได้แต้มจากการเช่า')
        ")->execute();
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "booking_code" => $bookingCode,
        "redirect" =>
            "/sports_rental_system/staff/frontend/payment_method.html?code=" .
            $bookingCode
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
