<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

// ---------------------------------
// รับ JSON
// ---------------------------------
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "ไม่มีข้อมูลส่งมา"
    ]);
    exit;
}

// ---------------------------------
// FUNCTION: generate random Cxxxxx
// ---------------------------------
function generateCustomerId($conn) {

    do {
        $num = random_int(0, 99999);
        $id = "C" . str_pad($num, 5, "0", STR_PAD_LEFT);

        $stmt = $conn->prepare(
            "SELECT customer_id FROM customers WHERE customer_id = ?"
        );
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $stmt->store_result();

    } while ($stmt->num_rows > 0);

    $stmt->close();

    return $id;
}

// ---------------------------------
// รับค่า
// ---------------------------------
$email = trim($data["email"] ?? "");
$name  = trim($data["fullname"] ?? "");
$phone = trim($data["phone"] ?? "");

$birth_date = $data["birthday"] ?? null;
$gender_id  = $data["gender_id"] ?? null;

$customer_type = $data["customerType"] ?? "";

$faculty_id = $data["faculty_id"] ?? null;
$study_year = $data["year"] ?? null;

$password = $data["password"] ?? "";
$confirm  = $data["confirmPassword"] ?? "";

// ---------------------------------
// VALIDATION
// ---------------------------------
if (
    $email === "" ||
    $name === "" ||
    $phone === "" ||
    !$birth_date ||
    !$gender_id ||
    $password === ""
) {
    echo json_encode([
        "success" => false,
        "message" => "กรุณากรอกข้อมูลให้ครบ"
    ]);
    exit;
}

if (!preg_match("/^[0-9]{9,10}$/", $phone)) {
    echo json_encode([
        "success" => false,
        "message" => "รูปแบบเบอร์โทรไม่ถูกต้อง"
    ]);
    exit;
}

if ($password !== $confirm) {
    echo json_encode([
        "success" => false,
        "message" => "รหัสผ่านไม่ตรงกัน"
    ]);
    exit;
}

if ($customer_type === "student") {
    if (!$faculty_id || !$study_year) {
        echo json_encode([
            "success" => false,
            "message" => "กรุณากรอกข้อมูลนิสิตให้ครบ"
        ]);
        exit;
    }
}

// ---------------------------------
// CHECK email ซ้ำ
// ---------------------------------
$check = $conn->prepare(
    "SELECT customer_id FROM customers WHERE email = ? LIMIT 1"
);
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "อีเมลนี้ถูกใช้แล้ว"
    ]);
    exit;
}
$check->close();

// ---------------------------------
// GENERATE CUSTOMER ID
// ---------------------------------
$customer_id = generateCustomerId($conn);

// ---------------------------------
// HASH PASSWORD
// ---------------------------------
$hash = password_hash($password, PASSWORD_DEFAULT);

// ---------------------------------
// INSERT DB
// ---------------------------------
$sql = "
INSERT INTO customers
(customer_id, email, name, phone, birth_date, gender_id,
customer_type, faculty_id, study_year, password_hash)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "sssssisiis",
    $customer_id,
    $email,
    $name,
    $phone,
    $birth_date,
    $gender_id,
    $customer_type,
    $faculty_id,
    $study_year,
    $hash
);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "สมัครสมาชิกสำเร็จ 🎉",
        "customer_id" => $customer_id
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "บันทึกข้อมูลไม่สำเร็จ",
        "error" => $stmt->error
    ]);
}

$stmt->close();
$conn->close();
