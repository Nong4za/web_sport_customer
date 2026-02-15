<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

if (!isset($_SESSION["staff_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized"
    ]);
    exit;
}

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

    /* =========================================
       1. CHECK BOOKING STATUS
    ========================================= */

    $check = $conn->prepare("
        SELECT b.booking_status_id, bs.code
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

    /* =========================================
       2. PREPARE STATEMENTS
    ========================================= */

    $updateDetail = $conn->prepare("
        UPDATE booking_details
        SET equipment_instance_id = ?
        WHERE detail_id = ?
          AND item_type = 'Equipment'
    ");

    $checkInstance = $conn->prepare("
        SELECT status
        FROM equipment_instances
        WHERE instance_code = ?
        LIMIT 1
    ");

    $updateInstance = $conn->prepare("
        UPDATE equipment_instances
        SET status = 'Rented',
            current_location = 'Customer'
        WHERE instance_code = ?
    ");

    /* =========================================
       3. LOOP ITEMS
    ========================================= */

    foreach ($items as $i) {

        $instanceCode = $i["instance_code"] ?? null;
        $detailId     = $i["detail_id"] ?? null;

        if (!$instanceCode || !$detailId) {
            throw new Exception("ข้อมูลอุปกรณ์ไม่ครบ");
        }

        // เช็ค instance ยัง Ready อยู่ไหม
        $checkInstance->bind_param("s", $instanceCode);
        $checkInstance->execute();
        $inst = $checkInstance->get_result()->fetch_assoc();

        if (!$inst) {
            throw new Exception("ไม่พบ instance $instanceCode");
        }

        if ($inst["status"] !== "Ready") {
            throw new Exception("อุปกรณ์ $instanceCode ไม่พร้อมใช้งาน");
        }

        // อัปเดต booking_details
        $updateDetail->bind_param("si", $instanceCode, $detailId);

        if (!$updateDetail->execute()) {
            throw new Exception("update booking_details failed");
        }

        if ($updateDetail->affected_rows === 0) {
            throw new Exception("detail_id $detailId ไม่ถูกต้อง");
        }

        // อัปเดตสถานะ instance
        $updateInstance->bind_param("s", $instanceCode);

        if (!$updateInstance->execute()) {
            throw new Exception("update equipment_instances failed");
        }
    }

    /* =========================================
       4. UPDATE BOOKING STATUS → IN_USE
    ========================================= */

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

    /* =========================================
       5. GIVE POINTS (SAFE VERSION)
    ========================================= */

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

        $customerId   = $bookingData["customer_id"];
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

            $updatePoint = $conn->prepare("
                UPDATE customers
                SET current_points = current_points + ?
                WHERE customer_id = ?
            ");

            $updatePoint->bind_param("is", $pointsEarned, $customerId);

            if (!$updatePoint->execute()) {
                throw new Exception("update customer point failed");
            }

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

            if (!$insertLog->execute()) {
                throw new Exception("insert point history failed");
            }
        }
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

$conn->close();
