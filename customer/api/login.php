<?php
require_once "../../database.php";
session_start();

header("Content-Type: application/json; charset=utf-8");

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "กรุณากรอกข้อมูลให้ครบ"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT customer_id, password_hash
    FROM customers
    WHERE email = ?
    LIMIT 1
");

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {

    if (password_verify($password, $row["password_hash"])) {

        $_SESSION["customer_id"] = $row["customer_id"];

        echo json_encode([
            "success" => true
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "รหัสผ่านไม่ถูกต้อง"
        ]);
    }

} else {

    echo json_encode([
        "success" => false,
        "message" => "ไม่พบผู้ใช้นี้"
    ]);
}

$stmt->close();
$conn->close();
