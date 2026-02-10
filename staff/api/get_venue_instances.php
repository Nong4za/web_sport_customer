<?php
require_once "../../database.php";

header("Content-Type: application/json; charset=utf-8");

$venueId = $_GET["venue_id"] ?? null;
$date    = $_GET["date"] ?? null;
$time    = $_GET["time"] ?? null;
$hours   = intval($_GET["hours"] ?? 1);
$branchId = $_GET["branch_id"] ?? null;

if (!$venueId || !$date || !$time || !$branchId) {
    echo json_encode([
        "success" => false,
        "message" => "missing params"
    ]);
    exit;
}

/* ===========================
   TIME RANGE
=========================== */

$dt =
    DateTime::createFromFormat("d/m/Y H:i", "$date $time")
    ?: DateTime::createFromFormat("Y-m-d H:i", "$date $time");

if (!$dt) {
    echo json_encode([
        "success" => false,
        "message" => "date parse failed"
    ]);
    exit;
}

$start = $dt->format("Y-m-d H:i:s");
$end   = date("Y-m-d H:i:s", strtotime("$start +$hours hour"));

/* ===========================
   FIND BUSY VENUES
=========================== */

$sqlBusy = "
SELECT DISTINCT bd.item_id
FROM bookings b
JOIN booking_details bd
  ON b.booking_id = bd.booking_id
WHERE
  bd.item_type = 'venue'
  AND bd.item_id IN (
      SELECT venue_instance_id
      FROM venue_instances
      WHERE venue_id = ?
  )
  AND b.status_id IN (3,4)
  AND (
    b.pickup_time < ?
    AND b.due_return_time > ?
  )
";

$stmtBusy = $conn->prepare($sqlBusy);
$stmtBusy->bind_param("sss", $venueId, $end, $start);
$stmtBusy->execute();

$resBusy = $stmtBusy->get_result();

$busyIds = [];

while ($r = $resBusy->fetch_assoc()) {
    $busyIds[] = $r["item_id"];
}

$stmtBusy->close();

/* ===========================
   LOAD AVAILABLE INSTANCES
=========================== */

$sql = "
SELECT 
    vi.venue_instance_id,
    vi.venue_code
FROM venue_instances vi
WHERE vi.venue_id = ?
  AND vi.branch_id = ?
  AND vi.status = 'Ready'
";

if ($busyIds) {
    $placeholders = implode(",", array_fill(0, count($busyIds), "?"));
    $sql .= " AND vi.venue_instance_id NOT IN ($placeholders)";
}

$types = str_repeat("s", 2 + count($busyIds));
$params = array_merge([$venueId, $branchId], $busyIds);

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

$stmt->close();

/* ===========================
   RESPONSE
=========================== */

echo json_encode([
    "success" => true,
    "venues" => $data
]);

$conn->close();
