console.log("🔥 STAFF BOOKINGS TS READY 🔥");
/* ================= DOM ================= */
var bookingList = document.getElementById("bookingList");
var tabs = document.querySelectorAll(".status-tab");
/* ================= STATE ================= */
var allBookings = [];
var currentStatus = "WAITING_STAFF";
/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", function () {
    fetchBookings();
    bindTabs();
});
/* ================= FETCH ================= */
function fetchBookings() {
    bookingList.innerHTML =
        "<p class=\"loading\">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</p>";
    fetch("/sports_rental_system/staff/api/get_bookings.php", {
        credentials: "include"
    })
        .then(function (r) { return r.json(); })
        .then(function (res) {
        if (!res.success) {
            bookingList.innerHTML =
                "<p class=\"empty\">".concat(res.message || "ไม่พบข้อมูล", "</p>");
            return;
        }
        allBookings = res.bookings || [];
        updateCounts();
        renderList(currentStatus);
    })
        .catch(function (err) {
        console.error(err);
        bookingList.innerHTML =
            "<p class=\"empty\">\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</p>";
    });
}
/* ================= COUNT ================= */
function updateCounts() {
    var counts = {};
    allBookings.forEach(function (b) {
        counts[b.status_code] =
            (counts[b.status_code] || 0) + 1;
    });
    document
        .querySelectorAll("span[id^='count-']")
        .forEach(function (el) {
        var code = el.id.replace("count-", "");
        el.textContent =
            (counts[code] || 0).toString();
    });
}
/* ================= RENDER ================= */
function renderList(status) {
    currentStatus = status;
    var list = allBookings.filter(function (b) { return b.status_code === status; });
    if (list.length === 0) {
        bookingList.innerHTML =
            "<p class=\"empty\">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</p>";
        return;
    }
    var html = "";
    list.forEach(function (b) {
        var badge = "waiting";
        var text = "รออนุมัติ";
        if (status === "CONFIRMED_WAITING_PICKUP") {
            badge = "ready";
            text = "รอรับอุปกรณ์";
        }
        if (status === "IN_USE") {
            badge = "active";
            text = "กำลังใช้งาน";
        }
        html += "\n            <div class=\"booking-card\">\n\n                <div class=\"booking-info\">\n\n                    <span class=\"status ".concat(badge, "\">\n                        ").concat(text, "\n                    </span>\n\n                    <h4>\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E32\u0E23\u0E08\u0E2D\u0E07: ").concat(b.booking_id, "</h4>\n\n                    <p>\n                        \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32: ").concat(b.customer_name, "<br>\n                        \u0E23\u0E31\u0E1A: ").concat(b.pickup_time, "<br>\n                        \u0E04\u0E37\u0E19: ").concat(b.due_return_time, "\n                    </p>\n\n                    <p>\n                        <strong>").concat(b.net_amount, " \u0E1A\u0E32\u0E17</strong>\n                    </p>\n\n                </div>\n\n                <div class=\"booking-actions\">\n\n                    <a class=\"btn-outline\"\n                    href=\"booking-detail.html?code=").concat(b.booking_id, "\">\n                        \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\n                    </a>\n\n                </div>\n\n            </div>\n        ");
    });
    bookingList.innerHTML = html;
}
/* ================= TABS ================= */
function bindTabs() {
    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            tabs.forEach(function (t) {
                return t.classList.remove("active");
            });
            tab.classList.add("active");
            var status = tab.dataset.status;
            if (status) {
                renderList(status);
            }
        });
    });
}
