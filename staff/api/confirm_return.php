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

$bookingCode = $data["booking_code"] ?? null;
$damageFee   = (int)($data["damage_fee"] ?? 0);

if (!$bookingCode) {
    echo json_encode([
        "success" => false,
        "message" => "Missing booking code"
    ]);
    exit;
}

$conn->begin_transaction();

try {

    /* =========================================
       1️⃣ ดึงข้อมูล booking
    ========================================== */

    $stmt = $conn->prepare("
        SELECT due_return_time
        FROM bookings
        WHERE booking_id = ?
        FOR UPDATE
    ");

    $stmt->bind_param("s", $bookingCode);
    $stmt->execute();

    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        throw new Exception("ไม่พบ booking");
    }

    $dueTime = strtotime($row["due_return_time"]);
    $now     = time();

    /* =========================================
       2️⃣ คำนวณค่าปรับคืนช้า (วันละ 50)
    ========================================== */

    $lateDays = 0;

    if ($now > $dueTime) {
        $lateDays = floor(($now - $dueTime) / 86400);
    }

    $lateFee = $lateDays * 50;

    $totalPenalty = $lateFee + $damageFee;

    /* =========================================
       3️⃣ อัปเดต actual_return_time + penalty_fee
    ========================================== */

    $stmt2 = $conn->prepare("
        UPDATE bookings
        SET
            actual_return_time = NOW(),
            penalty_fee = ?
        WHERE booking_id = ?
    ");

    $stmt2->bind_param("is", $totalPenalty, $bookingCode);

    if (!$stmt2->execute()) {
        throw new Exception("อัปเดต booking ไม่สำเร็จ");
    }

    /* =========================================
       4️⃣ อัปเดตสถานะอุปกรณ์กลับเป็น Ready
    ========================================== */

    $updateInstances = $conn->prepare("
        UPDATE equipment_instances ei
        JOIN booking_details bd
            ON bd.equipment_instance_id = ei.instance_code
        SET
            ei.status = 'Ready',
            ei.current_location = 'Main Storage'
        WHERE bd.booking_id = ?
    ");

    $updateInstances->bind_param("s", $bookingCode);

    if (!$updateInstances->execute()) {
        throw new Exception("อัปเดตอุปกรณ์ไม่สำเร็จ");
    }

    /* =========================================
       5️⃣ ถ้าไม่มีค่าปรับ → ปิดงานเลย
    ========================================== */

    if ($totalPenalty == 0) {

        $statusRow = $conn->query("
            SELECT id FROM booking_status
            WHERE code = 'COMPLETED'
            LIMIT 1
        ")->fetch_assoc();

        if (!$statusRow) {
            throw new Exception("ไม่พบสถานะ COMPLETED");
        }

        $statusId = $statusRow["id"];

        $stmt3 = $conn->prepare("
            UPDATE bookings
            SET booking_status_id = ?
            WHERE booking_id = ?
        ");

        $stmt3->bind_param("is", $statusId, $bookingCode);

        if (!$stmt3->execute()) {
            throw new Exception("อัปเดตสถานะไม่สำเร็จ");
        }
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "late_days" => $lateDays,
        "late_fee" => $lateFee,
        "damage_fee" => $damageFee,
        "total_penalty" => $totalPenalty,
        "need_payment" => $totalPenalty > 0
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
