<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

/* ================= AUTH ================= */

if (!isset($_SESSION["staff_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized"
    ]);
    exit;
}

$staffId = $_SESSION["staff_id"];

/* ================= GET FILTER ================= */

$search   = $_GET["q"] ?? null;
$statusId = $_GET["status_id"] ?? null;
$damageId = $_GET["damage_id"] ?? null;

/* ================= SQL ================= */

$sql = "
SELECT 
    m.log_id,
    m.instance_code,
    m.description,
    m.report_date,
    d.name_th AS damage_name_th,
    s.name_th AS status_name_th
FROM maintenance_logs m
LEFT JOIN damage_levels d 
    ON m.damage_id = d.damage_id
LEFT JOIN maintenance_status s 
    ON m.status_id = s.status_id
WHERE m.reported_by_staff_id = ?
";

$params = [$staffId];
$types  = "s";

/* ================= FILTER ================= */

if ($statusId !== null && $statusId !== "") {
    $sql .= " AND m.status_id = ?";
    $params[] = (int)$statusId;
    $types .= "i";
}

if ($damageId !== null && $damageId !== "") {
    $sql .= " AND m.damage_id = ?";
    $params[] = (int)$damageId;
    $types .= "i";
}

if ($search !== null && $search !== "") {
    $sql .= " AND (m.instance_code LIKE ? OR m.description LIKE ?)";
    $searchParam = "%$search%";
    $params[] = $searchParam;
    $params[] = $searchParam;
    $types .= "ss";
}

$sql .= " ORDER BY m.report_date DESC";

/* ================= PREPARE ================= */

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => $conn->error
    ]);
    exit;
}

$stmt->bind_param($types, ...$params);
$stmt->execute();

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);

$conn->close();
