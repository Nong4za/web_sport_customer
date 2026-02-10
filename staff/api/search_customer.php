<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$input = json_decode(file_get_contents("php://input"), true);

$q = $input["q"] ?? null;

if (!$q) {
    echo json_encode([
        "success" => false,
        "message" => "missing query"
    ]);
    exit;
}

$like = "%" . $q . "%";

$sql = "
    SELECT 
        c.customer_id,
        c.name,
        c.phone,
        c.customer_type,
        c.current_points,
        c.study_year,
        f.name AS faculty_name
    FROM customers c
    LEFT JOIN faculty f
        ON c.faculty_id = f.id
    WHERE c.customer_id LIKE ?
    OR c.name LIKE ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

$stmt->bind_param("ss", $like, $like);

$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {

    echo json_encode([
        "success" => true,
        "customer" => $row
    ]);
    exit;
}

echo json_encode([
    "success" => false,
    "message" => "not found"
]);
