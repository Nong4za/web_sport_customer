<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$data = json_decode(file_get_contents("php://input"), true);

$bookingId = $data["booking_id"] ?? null;
$items     = $data["items"] ?? [];

if (!$bookingId || empty($items)) {
    echo json_encode([
        "success" => false,
        "message" => "missing data"
    ]);
    exit;
}

$conn->begin_transaction();

try {

    /* ======================================================
       1. เช็คก่อนว่า booking ยังไม่ได้ IN_USE
    ====================================================== */

    $check = $conn->prepare("
        SELECT bs.code
        FROM bookings b
        JOIN booking_status bs ON b.booking_status_id = bs.id
        WHERE b.booking_id = ?
        LIMIT 1
    ");
    $check->bind_param("s", $bookingId);
    $check->execute();
    $res = $check->get_result()->fetch_assoc();

    if (!$res) {
        throw new Exception("ไม่พบ booking");
    }

    if ($res["code"] === "IN_USE") {
        throw new Exception("รายการนี้ถูกเริ่มใช้งานแล้ว");
    }

    /* ======================================================
       2. UPDATE booking_details (instance)
    ====================================================== */

    $updateDetail = $conn->prepare("
        UPDATE booking_details
        SET equipment_instance_id = ?
        WHERE detail_id = ?
          AND item_type = 'Equipment'
    ");

    $updateInstanceStatus = $conn->prepare("
        UPDATE equipment_instances
        SET status = 'Rented',
            current_location = 'Customer'
        WHERE instance_code = ?
    ");

    foreach ($items as $i) {

        if (empty($i["instance_code"])) continue;

        $updateDetail->bind_param(
            "si",
            $i["instance_code"],
            $i["detail_id"]
        );

        if (!$updateDetail->execute()) {
            throw new Exception("update booking_details failed");
        }

        // update instance status
        $updateInstanceStatus->bind_param(
            "s",
            $i["instance_code"]
        );

        if (!$updateInstanceStatus->execute()) {
            throw new Exception("update equipment_instances failed");
        }
    }

    /* ======================================================
       3. UPDATE booking
    ====================================================== */

    $statusRow = $conn->query("
        SELECT id
        FROM booking_status
        WHERE code = 'IN_USE'
        LIMIT 1
    ")->fetch_assoc();

    if (!$statusRow) {
        throw new Exception("missing IN_USE status");
    }

    $statusId = $statusRow["id"];

    $updateBooking = $conn->prepare("
        UPDATE bookings
        SET actual_pickup_time = NOW(),
            booking_status_id  = ?
        WHERE booking_id = ?
    ");

    $updateBooking->bind_param("is", $statusId, $bookingId);

    if (!$updateBooking->execute()) {
        throw new Exception("update booking failed");
    }

    if ($updateBooking->affected_rows === 0) {
        throw new Exception("ไม่พบรายการที่ต้องอัปเดต");
    }

    $conn->commit();

    echo json_encode([
        "success" => true
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

/* ======================================================
   4. GIVE POINTS WHEN START USING
====================================================== */

$getBooking = $conn->prepare("
    SELECT customer_id, points_earned
    FROM bookings
    WHERE booking_id = ?
    LIMIT 1
");

$getBooking->bind_param("s", $bookingId);
$getBooking->execute();
$bookingData = $getBooking->get_result()->fetch_assoc();

if ($bookingData && (int)$bookingData["points_earned"] > 0) {

    $customerId = $bookingData["customer_id"];
    $pointsEarned = (int)$bookingData["points_earned"];

    $checkLog = $conn->prepare("
        SELECT 1
        FROM point_history
        WHERE booking_id = ?
          AND type = 'earn'
        LIMIT 1
    ");

    $checkLog->bind_param("s", $bookingId);
    $checkLog->execute();
    $checkLog->store_result();

    if ($checkLog->num_rows === 0) {

        // เพิ่มคะแนนให้ลูกค้า
        $updatePoint = $conn->prepare("
            UPDATE customers
            SET current_points = current_points + ?
            WHERE customer_id = ?
        ");

        $updatePoint->bind_param("is", $pointsEarned, $customerId);
        $updatePoint->execute();

        // บันทึกประวัติแต้ม
        $note = "ได้รับแต้มจากการเริ่มใช้งาน Booking {$bookingId}";

        $insertLog = $conn->prepare("
            INSERT INTO point_history
            (customer_id, booking_id, type, amount, description)
            VALUES (?, ?, 'earn', ?, ?)
        ");

        $insertLog->bind_param(
            "ssis",
            $customerId,
            $bookingId,
            $pointsEarned,
            $note
        );

        $insertLog->execute();
    }
}