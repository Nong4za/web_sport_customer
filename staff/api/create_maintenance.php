<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {

    if (!isset($_SESSION["staff_id"])) {
        echo json_encode([
            "success" => false,
            "message" => "เฉพาะเจ้าหน้าที่"
        ]);
        exit;
    }

    $staffId = $_SESSION["staff_id"];

    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        echo json_encode([
            "success" => false,
            "message" => "ข้อมูลไม่ถูกต้อง"
        ]);
        exit;
    }

    $instanceCode = $input["instance_code"] ?? null;
    $damageId     = isset($input["damage_id"]) ? (int)$input["damage_id"] : null;
    $description  = trim($input["description"] ?? "");
    $customerId   = $input["customer_id"] ?? null;

    if ($customerId === "") {
        $customerId = null;
    }

    if (!$instanceCode || !$damageId || !$description) {
        echo json_encode([
            "success" => false,
            "message" => "ข้อมูลไม่ครบ"
        ]);
        exit;
    }

    /* ===== เริ่ม Transaction ===== */
    $conn->begin_transaction();

    /* ===== ดึง branch จาก staff ===== */

    $stmt = $conn->prepare("
        SELECT branch_id
        FROM staff
        WHERE staff_id = ?
    ");
    $stmt->bind_param("s", $staffId);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if (!$res) {
        throw new Exception("ไม่พบ staff");
    }

    $branchId = $res["branch_id"];
    $statusId = 1; // รอดำเนินการ

    /* ===== INSERT maintenance_logs ===== */

    $stmt = $conn->prepare("
        INSERT INTO maintenance_logs
        (
            instance_code,
            branch_id,
            reported_by_staff_id,
            reported_by_customer_id,
            damage_id,
            status_id,
            description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "ssssiis",
        $instanceCode,
        $branchId,
        $staffId,
        $customerId,
        $damageId,
        $statusId,
        $description
    );

    $stmt->execute();

    /* ===== UPDATE equipment_instances ===== */

    $stmt2 = $conn->prepare("
        UPDATE equipment_instances
        SET status = 'Maintenance',
            current_location = 'Repair Shop'
        WHERE instance_code = ?
    ");

    $stmt2->bind_param("s", $instanceCode);
    $stmt2->execute();

    /* ===== Commit ===== */
    $conn->commit();

    echo json_encode([
        "success" => true
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()
    ]);
}

$conn->close();
