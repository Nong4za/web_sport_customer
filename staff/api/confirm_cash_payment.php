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
        "message" => "เฉพาะเจ้าหน้าที่"
    ]);
    exit;
}

$staffId = $_SESSION["staff_id"];

/* ===============================
   READ JSON
================================ */

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "JSON ไม่ถูกต้อง"
    ]);
    exit;
}

$bookingCode = $data["booking_code"] ?? null;

if (!$bookingCode) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่พบ booking_code"
    ]);
    exit;
}

/* ===============================
   TRANSACTION
================================ */

$conn->begin_transaction();

try {

    /* ===============================
       MASTER LOOKUP
    ================================ */

    function getIdByCode($conn, $table, $code) {

        $pkMap = [
            "payment_status"  => "id",
            "booking_status"  => "id",
            "payment_methods" => "method_id"
        ];

        if (!isset($pkMap[$table])) {
            throw new Exception("PK map not defined for $table");
        }

        $pk = $pkMap[$table];

        $sql = "SELECT {$pk} FROM {$table} WHERE code = ? LIMIT 1";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $code);
        $stmt->execute();

        $res = $stmt->get_result()->fetch_assoc();

        return $res ? (int)$res[$pk] : null;
    }

    $paidStatusId  = getIdByCode($conn, "payment_status", "PAID");
    $usingStatusId = getIdByCode($conn, "booking_status", "IN_USE");
    $cashMethodId  = getIdByCode($conn, "payment_methods", "CASH");

    if (!$paidStatusId || !$usingStatusId || !$cashMethodId) {
        throw new Exception("ไม่พบ master status");
    }

    /* ===============================
       LOAD BOOKING
    ================================ */

    $stmt = $conn->prepare("
        SELECT branch_id, net_amount
        FROM bookings
        WHERE booking_id = ?
    ");

    $stmt->bind_param("s", $bookingCode);
    $stmt->execute();

    $booking = $stmt->get_result()->fetch_assoc();

    if (!$booking) {
        throw new Exception("ไม่พบ booking");
    }

    $branchId = $booking["branch_id"];
    $amount   = $booking["net_amount"];

    /* ===============================
       INSERT PAYMENT
    ================================ */

    $pStmt = $conn->prepare("
        INSERT INTO payments (
            booking_id,
            method_id,
            branch_id,
            amount,
            payment_status_id,
            paid_at,
            processed_by_staff_id,
            note
        )
        VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
    ");

    $note = "ชำระเงินสด";

    $pStmt->bind_param(
        "sisdiss",
        $bookingCode,
        $cashMethodId,
        $branchId,
        $amount,
        $paidStatusId,
        $staffId,
        $note
    );

    if (!$pStmt->execute()) {
        throw new Exception("insert payments: " . $pStmt->error);
    }

    /* ===============================
       UPDATE BOOKING STATUS
    ================================ */

    $uStmt = $conn->prepare("
        UPDATE bookings
        SET
            payment_status_id = ?,
            booking_status_id = ?
        WHERE booking_id = ?
    ");

    $uStmt->bind_param(
        "iis",
        $paidStatusId,
        $usingStatusId,
        $bookingCode
    );

    if (!$uStmt->execute()) {
        throw new Exception("update bookings: " . $uStmt->error);
    }

    /* ===============================
       COMMIT
    ================================ */

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "รับเงินสดเรียบร้อย",
        "redirect" =>
            "/sports_rental_system/staff/frontend/bookings.html"
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
