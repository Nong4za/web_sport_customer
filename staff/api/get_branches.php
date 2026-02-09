<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$response = [
    "success" => false,
    "data" => null,
    "message" => ""
];

try {
    // 1. ตรวจสอบลำดับความสำคัญของ Branch ID
    // ลำดับ: 1. จาก Session (ถ้ามีการเปลี่ยนสาขา) -> 2. จาก Profile User -> 3. สาขาแรกใน DB
    $target_branch_id = $_SESSION['selected_branch_id'] ?? null;

    if (!$target_branch_id && isset($_SESSION['user_id'])) {
        $u_sql = "SELECT branch_id FROM users WHERE user_id = ? LIMIT 1";
        $u_stmt = $conn->prepare($u_sql);
        $u_stmt->bind_param("i", $_SESSION['user_id']);
        $u_stmt->execute();
        $u_res = $u_stmt->get_result()->fetch_assoc();
        $target_branch_id = $u_res['branch_id'] ?? null;
    }

    if (!$target_branch_id) {
        $fallback = $conn->query("SELECT branch_id FROM branches WHERE is_active = 1 LIMIT 1")->fetch_assoc();
        $target_branch_id = $fallback['branch_id'] ?? null;
    }

    if (!$target_branch_id) {
        throw new Exception("ไม่พบสาขาที่เปิดให้บริการ");
    }

    // 2. ดึงข้อมูลรายละเอียดสาขา
    $sql = "SELECT branch_id, name, open_time, close_time FROM branches WHERE branch_id = ? AND is_active = 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $target_branch_id);
    $stmt->execute();
    $branch = $stmt->get_result()->fetch_assoc();

    if ($branch) {
        $response["success"] = true;
        $response["data"] = [
            "branch_id"  => (int)$branch["branch_id"],
            "name"       => $branch["name"],
            "open_time"  => substr($branch["open_time"], 0, 5), // '08:00'
            "close_time" => substr($branch["close_time"], 0, 5)  // '20:00'
        ];
        
        // บันทึกใส่ Session ไว้ด้วยเพื่อให้หน้าอื่นๆ รู้ว่าตอนนี้กำลังทำงานที่สาขาไหน
        $_SESSION['selected_branch_id'] = $branch['branch_id'];
    } else {
        throw new Exception("สาขานี้อาจถูกปิดการใช้งาน");
    }

} catch (Exception $e) {
    $response["message"] = $e->getMessage();
}

// ใช้ JSON_NUMERIC_CHECK เพื่อให้ตัวเลขเป็น Number Type จริงๆ ใน JSON
echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);