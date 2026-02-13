console.log("🔥 STAFF RETURN READY 🔥");
var listBox = document.getElementById("returnList");
var tabs = document.querySelectorAll(".status-tab");
var modal = document.getElementById("returnModal");
var closeBtn = document.getElementById("returnModalClose");
var confirmBtn = document.getElementById("returnModalConfirm");
var currentCode = null;
var currentStatus = "IN_USE";
/* ================= INIT ================= */
tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
            return t.classList.remove("active");
        });
        tab.classList.add("active");
        currentStatus =
            tab.getAttribute("data-status") || "IN_USE";
        loadReturns();
    });
});
closeBtn.addEventListener("click", function () {
    modal.classList.add("hidden");
});
confirmBtn.addEventListener("click", function () {
    if (!currentCode)
        return;
    confirmBtn.disabled = true;
    fetch("/sports_rental_system/staff/api/confirm_return.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            booking_code: currentCode
        })
    })
        .then(function (r) { return r.json(); })
        .then(function (res) {
        if (!res.success) {
            alert(res.message || "บันทึกไม่สำเร็จ");
            confirmBtn.disabled = false;
            return;
        }
        alert("✅ รับคืนเรียบร้อย");
        modal.classList.add("hidden");
        loadReturns();
    });
});
/* ================= LOAD ================= */
loadReturns();
function loadReturns() {
    listBox.innerHTML =
        "<p class=\"loading\">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</p>";
    fetch("/sports_rental_system/staff/api/get_returns.php?status=".concat(currentStatus), { credentials: "include" })
        .then(function (r) { return r.json(); })
        .then(function (res) {
        if (!res.success) {
            listBox.innerHTML =
                "<p class=\"empty\">\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</p>";
            return;
        }
        renderList(res.data || []);
    });
}
/* ================= RENDER ================= */
function renderList(rows) {
    if (!rows.length) {
        listBox.innerHTML =
            "<p class=\"empty\">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</p>";
        return;
    }
    listBox.innerHTML = "";
    rows.forEach(function (r) {
        var _a;
        var card = document.createElement("div");
        card.className = "booking-card";
        card.innerHTML = "\n\n            <div class=\"booking-info\">\n\n                <span class=\"status ".concat(r.status === "OVERDUE"
            ? "overdue"
            : r.status === "RETURNED"
                ? "returned"
                : "active", "\">\n                    ").concat(r.status, "\n                </span>\n\n                <h4>").concat(r.booking_id, "</h4>\n\n                <p>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32: ").concat(r.customer_name, "</p>\n                <p>\u0E04\u0E23\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14: ").concat(r.due_return_time, "</p>\n\n            </div>\n\n            <div class=\"booking-actions\">\n\n                ").concat(r.status !== "RETURNED"
            ? "\n                            <button\n                                class=\"btn-return\"\n                                data-code=\"".concat(r.booking_id, "\">\n                                \u0E23\u0E31\u0E1A\u0E04\u0E37\u0E19\n                            </button>\n                          ")
            : "", "\n\n            </div>\n        ");
        (_a = card
            .querySelector(".btn-return")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function (e) {
            var btn = e.currentTarget;
            currentCode =
                btn.getAttribute("data-code");
            modal.classList.remove("hidden");
        });
        listBox.appendChild(card);
    });
}
