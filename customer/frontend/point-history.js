var loading = document.getElementById("loading");
var box = document.getElementById("historyBox");
var list = document.getElementById("pointList");
// ============================
// POINT HISTORY
// ============================
fetch("/sports_rental_system/customer/api/get_point_history.php", {
    credentials: "include"
})
    .then(function (res) { return res.json(); })
    .then(function (res) {
    console.log("POINT HISTORY RESPONSE:", res);
    if (loading)
        loading.style.display = "none";
    if (!res || res.success !== true) {
        showEmpty("ไม่พบข้อมูลประวัติแต้ม");
        return;
    }
    // รองรับทั้ง points และ items
    var data = Array.isArray(res.points) ? res.points :
        Array.isArray(res.items) ? res.items :
            [];
    if (data.length === 0) {
        showEmpty("ยังไม่มีประวัติแต้ม");
        return;
    }
    if (box)
        box.classList.remove("hidden");
    renderPoints(data);
})
    .catch(function (err) {
    console.error("Error loading point history:", err);
    if (loading)
        loading.style.display = "none";
    showEmpty("เกิดข้อผิดพลาดในการโหลดข้อมูล");
});
// ============================
// PROFILE
// ============================
fetch("/sports_rental_system/customer/api/get_profile.php", {
    credentials: "include"
})
    .then(function (res) { return res.json(); })
    .then(function (data) {
    var pointEl = document.getElementById("topPoints");
    if (pointEl && data && data.points !== undefined) {
        pointEl.textContent = "\u2B50 ".concat(data.points, " \u0E04\u0E30\u0E41\u0E19\u0E19");
    }
})
    .catch(function (err) {
    console.error("Error loading profile:", err);
});
// ============================
// RENDER FUNCTION
// ============================
function renderPoints(items) {
    if (!list)
        return;
    list.innerHTML = "";
    items.forEach(function (p) {
        var div = document.createElement("div");
        div.className = "item";
        var isPlus = Number(p.amount) > 0;
        var sign = isPlus ? "+" : "";
        div.innerHTML = "\n            <div class=\"left ".concat(isPlus ? 'text-plus' : 'text-minus', "\">\n                <div class=\"title\">").concat(p.description || "-", "</div>\n                <div class=\"ref\">\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E48\u0E32: ").concat(p.booking_id || "-", "</div>\n            </div>\n\n            <div class=\"right ").concat(isPlus ? 'point-plus' : 'point-minus', "\">\n                ").concat(sign).concat(p.amount, "\n            </div>\n        ");
        list.appendChild(div);
    });
}
// ============================
// EMPTY STATE
// ============================
function showEmpty(message) {
    if (!box || !list)
        return;
    box.classList.remove("hidden");
    list.innerHTML = "\n        <div class=\"empty\">\n            ".concat(message, "\n        </div>\n    ");
}
