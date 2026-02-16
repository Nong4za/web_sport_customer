<?php
session_start();
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$staffId = $_SESSION["staff_id"];

$res = $conn->query("
    SELECT instance_code,
           description,
           status,
           report_date
    FROM maintenance_logs
    WHERE reported_by_staff_id = '$staffId'
    ORDER BY report_date DESC
");

$data = [];

while ($r = $res->fetch_assoc())
    $data[] = $r;

echo json_encode([
    "success"=>true,
    "data"=>$data
]);
