console.log("🔥 STAFF RETURN READY 🔥");
var listBox = document.getElementById("returnList");
var tabs = document.querySelectorAll(".status-tab");
var modal = document.getElementById("returnModal");
var closeBtn = document.getElementById("returnModalClose");
var confirmBtn = document.getElementById("returnModalConfirm");
var returnItemsBox = document.getElementById("returnItems");
var penaltySummary = document.getElementById("penaltySummary");
var currentCode = null;
var currentStatus = "IN_USE";
var returnItems = [];
var LATE_FEE_PER_DAY = 50;
/* ================= INIT ================= */
tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        tabs.forEach(function (t) { return t.classList.remove("active"); });
        tab.classList.add("active");
        currentStatus =
            tab.getAttribute("data-status") || "IN_USE";
        loadReturns();
    });
});
closeBtn === null || closeBtn === void 0 ? void 0 : closeBtn.addEventListener("click", function () {
    modal.classList.add("hidden");
});
/* ================= LOAD BOOKINGS ================= */
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
/* ================= RENDER LIST ================= */
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
        card.innerHTML = "\n            <div class=\"booking-info\">\n                <h4>".concat(r.booking_id, "</h4>\n                <p>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32: ").concat(r.customer_name, "</p>\n                <p>\u0E04\u0E23\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14: ").concat(r.due_return_time, "</p>\n            </div>\n\n            <div class=\"booking-actions\">\n                <button\n                    class=\"btn-return\"\n                    data-code=\"").concat(r.booking_id, "\">\n                    \u0E23\u0E31\u0E1A\u0E04\u0E37\u0E19\n                </button>\n            </div>\n        ");
        (_a = card.querySelector(".btn-return")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function (e) {
            var btn = e.currentTarget;
            currentCode =
                btn.getAttribute("data-code");
            loadReturnDetails(currentCode);
        });
        listBox.appendChild(card);
    });
}
/* ================= LOAD DETAILS ================= */
function loadReturnDetails(code) {
    fetch("/sports_rental_system/staff/api/get_return_details.php?booking_id=".concat(code), { credentials: "include" })
        .then(function (r) { return r.json(); })
        .then(function (res) {
        if (!res.success) {
            alert("โหลดรายละเอียดไม่ได้");
            return;
        }
        returnItems = res.items || [];
        renderReturnModal();
        modal.classList.remove("hidden");
    });
}
/* ================= RENDER MODAL ================= */
function renderReturnModal() {
    returnItemsBox.innerHTML = "";
    returnItems.forEach(function (item, index) {
        var row = document.createElement("div");
        row.className = "return-row";
        row.innerHTML = "\n            <div>\n                <strong>".concat(item.name, "</strong>\n                <br>\n                \u0E23\u0E2B\u0E31\u0E2A: ").concat(item.instance_code, "\n            </div>\n\n            <div>\n                <select data-index=\"").concat(index, "\">\n                    <option value=\"NORMAL\">\u0E1B\u0E01\u0E15\u0E34</option>\n                    <option value=\"DAMAGED\">\u0E40\u0E2A\u0E35\u0E22\u0E2B\u0E32\u0E22 (100)</option>\n                    <option value=\"BROKEN\">\u0E1E\u0E31\u0E07\u0E2B\u0E19\u0E31\u0E01 (300)</option>\n                </select>\n            </div>\n        ");
        returnItemsBox.appendChild(row);
    });
    calculatePenalty();
}
/* ================= CALCULATE ================= */
function calculatePenalty() {
    var _a, _b, _c;
    if (!currentCode)
        return 0;
    var damageFee = 0;
    var selects = returnItemsBox.querySelectorAll("select");
    selects.forEach(function (sel) {
        if (sel.value === "DAMAGED")
            damageFee += 100;
        if (sel.value === "BROKEN")
            damageFee += 300;
    });
    var dueText = (_c = (_b = (_a = document.querySelector("[data-code=\"".concat(currentCode, "\"]"))) === null || _a === void 0 ? void 0 : _a.closest(".booking-card")) === null || _b === void 0 ? void 0 : _b.querySelector("p:nth-child(3)")) === null || _c === void 0 ? void 0 : _c.textContent;
    var lateFee = 0;
    if (dueText) {
        var dueDate = new Date(dueText.replace("ครบกำหนด: ", ""));
        var now = new Date();
        if (now > dueDate) {
            var diff = now.getTime() - dueDate.getTime();
            var days = Math.floor(diff /
                (1000 * 60 * 60 * 24));
            lateFee = days * LATE_FEE_PER_DAY;
        }
    }
    var total = damageFee + lateFee;
    penaltySummary.innerHTML = "\n        <p>\u0E04\u0E48\u0E32\u0E04\u0E37\u0E19\u0E0A\u0E49\u0E32: ".concat(lateFee, " \u0E1A\u0E32\u0E17</p>\n        <p>\u0E04\u0E48\u0E32\u0E40\u0E2A\u0E35\u0E22\u0E2B\u0E32\u0E22: ").concat(damageFee, " \u0E1A\u0E32\u0E17</p>\n        <hr>\n        <strong>\u0E23\u0E27\u0E21: ").concat(total, " \u0E1A\u0E32\u0E17</strong>\n    ");
    return total;
}
/* ================= CONFIRM ================= */
confirmBtn === null || confirmBtn === void 0 ? void 0 : confirmBtn.addEventListener("click", function () {
    if (!currentCode)
        return;
    var total = calculatePenalty();
    if (total === 0) {
        completeBooking(currentCode);
    }
    else {
        window.location.href =
            "return-payment.html?code=".concat(currentCode, "&penalty=").concat(total);
    }
});
/* ================= COMPLETE ================= */
function completeBooking(code) {
    fetch("/sports_rental_system/staff/api/confirm_return.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            booking_code: code
        })
    })
        .then(function (r) { return r.json(); })
        .then(function (res) {
        if (!res.success) {
            alert(res.message);
            return;
        }
        alert("คืนสำเร็จ");
        modal.classList.add("hidden");
        loadReturns();
    });
}
