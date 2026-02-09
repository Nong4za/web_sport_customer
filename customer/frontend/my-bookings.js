console.log("🔥 MY BOOKINGS TS READY 🔥");
/* ===============================
   DOM
================================ */
var bookingList = document.getElementById("bookingList");
var tabs = document.querySelectorAll(".status-tab");
var confirmModal = document.getElementById("confirmCancelModal");
var refundModal = document.getElementById("refundModal");
var finalModal = document.getElementById("finalCancelModal");
/* ===============================
   DATA
================================ */
var allBookings = [];
var currentStatus = "WAITING_STAFF";
var selectedCancelCode = null;
/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", function () {
    var _a, _b, _c, _d, _e, _f, _g;
    fetchBookings();
    bindTabs();
    loadProfilePoints();
    (_a = document.getElementById("closeConfirmCancel")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", closeAllModals);
    (_b = document.getElementById("closeRefund")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", closeAllModals);
    (_c = document.getElementById("closeFinalCancel")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", closeAllModals);
    (_d = document.getElementById("continueCancel")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", checkRefundInfo);
    (_e = document.getElementById("saveRefund")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", saveRefundInfo);
    (_f = document.getElementById("submitCancel")) === null || _f === void 0 ? void 0 : _f.addEventListener("click", submitCancel);
    (_g = document.getElementById("editRefundBtn")) === null || _g === void 0 ? void 0 : _g.addEventListener("click", function () {
        hideModal(finalModal);
        showModal(refundModal);
    });
});
/* ===============================
   FETCH BOOKINGS
================================ */
function fetchBookings() {
    fetch("/sports_rental_system/customer/api/get_my_bookings.php", {
        credentials: "include"
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
        if (!data.success) {
            bookingList.innerHTML =
                "<p class=\"empty\">".concat(data.message || "ไม่พบรายการ", "</p>");
            return;
        }
        allBookings = data.bookings || [];
        updateCounts();
        renderList(currentStatus);
    })
        .catch(function () {
        bookingList.innerHTML =
            "<p class=\"empty\">\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</p>";
    });
}
/* ===============================
   COUNT STATUS
================================ */
function updateCounts() {
    var counts = {};
    allBookings.forEach(function (b) {
        counts[b.status_code] =
            (counts[b.status_code] || 0) + 1;
    });
    document.querySelectorAll("span[id^='count-']")
        .forEach(function (el) {
        var code = el.id.replace("count-", "");
        el.textContent =
            (counts[code] || 0).toString();
    });
}
/* ===============================
   RENDER LIST
================================ */
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
        html += "\n            <div class=\"booking-card\">\n\n                <div class=\"booking-info\">\n\n                    <span class=\"status ".concat(badge, "\">\n                        ").concat(text, "\n                    </span>\n\n                    <h4>\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E32\u0E23\u0E08\u0E2D\u0E07: ").concat(b.booking_id, "</h4>\n\n                    <p>\n                        \u0E23\u0E31\u0E1A: ").concat(b.pickup_time, "<br>\n                        \u0E04\u0E37\u0E19: ").concat(b.due_return_time, "\n                    </p>\n\n                    <p>\n                        <strong>").concat(b.net_amount, " \u0E1A\u0E32\u0E17</strong>\n                    </p>\n\n                </div>\n\n                <div class=\"booking-actions\">\n\n                    <a class=\"btn-outline\"\n                       href=\"booking-detail.html?code=").concat(b.booking_id, "\">\n                        \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\n                    </a>\n\n                    ").concat(status === "WAITING_STAFF"
            ? "<button class=\"btn-cancel\"\n                            data-code=\"".concat(b.booking_id, "\">\n                        \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\n                   </button>")
            : "", "\n\n                </div>\n\n            </div>\n        ");
    });
    bookingList.innerHTML = html;
    bindCancelButtons();
}
/* ===============================
   TAB CLICK
================================ */
function bindTabs() {
    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            tabs.forEach(function (t) { return t.classList.remove("active"); });
            tab.classList.add("active");
            var status = tab.dataset.status;
            if (status) {
                renderList(status);
            }
        });
    });
}
/* ===============================
   CANCEL FLOW
================================ */
function bindCancelButtons() {
    document.querySelectorAll(".btn-cancel")
        .forEach(function (btn) {
        btn.addEventListener("click", function () {
            selectedCancelCode =
                btn.getAttribute("data-code");
            if (!selectedCancelCode)
                return;
            showModal(confirmModal);
        });
    });
}
/* ===============================
   STEP 1: CHECK REFUND
================================ */
function checkRefundInfo() {
    fetch("/sports_rental_system/customer/api/get_refund_info.php", {
        credentials: "include"
    })
        .then(function (res) { return res.json(); })
        .then(function (res) {
        hideModal(confirmModal);
        if (!res.hasRefund) {
            showModal(refundModal);
        }
        else {
            renderRefundPreview(res.bank, res.account, res.name);
            showModal(finalModal);
        }
    });
}
/* ===============================
   SAVE REFUND INFO
================================ */
function saveRefundInfo() {
    var bank = document.getElementById("refundBank").value;
    var account = document.getElementById("refundAccount").value;
    var name = document.getElementById("refundName").value;
    if (!bank || !account || !name) {
        alert("กรุณากรอกข้อมูลบัญชีให้ครบ");
        return;
    }
    fetch("/sports_rental_system/customer/api/save_refund_info.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            bank: bank,
            account: account,
            name: name
        })
    })
        .then(function (r) { return r.json(); })
        .then(function (res) {
        if (!res.success) {
            alert(res.message || "บันทึกไม่สำเร็จ");
            return;
        }
        hideModal(refundModal);
        renderRefundPreview(bank, account, name);
        showModal(finalModal);
    });
}
/* ===============================
   FINAL CANCEL
================================ */
function submitCancel() {
    if (!selectedCancelCode)
        return;
    var reason = document.getElementById("cancelReason").value;
    if (!reason.trim()) {
        alert("กรุณากรอกเหตุผล");
        return;
    }
    fetch("/sports_rental_system/customer/api/cancel_bookings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            booking_id: selectedCancelCode,
            reason: reason
        })
    })
        .then(function (r) { return r.json(); })
        .then(function (res) {
        alert(res.message || "ยกเลิกเรียบร้อย");
        closeAllModals();
        fetchBookings();
    })
        .catch(function () {
        alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    });
}
/* ===============================
   PREVIEW
================================ */
function renderRefundPreview(bank, account, name) {
    document.getElementById("previewBank")
        .textContent = bank;
    document.getElementById("previewAccount")
        .textContent = "****" + account.slice(-4);
    document.getElementById("previewName")
        .textContent = name;
}
/* ===============================
   MODAL UTILS
================================ */
function showModal(el) {
    el.classList.remove("hidden");
}
function hideModal(el) {
    el.classList.add("hidden");
}
function closeAllModals() {
    [confirmModal, refundModal, finalModal]
        .forEach(function (m) { return m.classList.add("hidden"); });
}
/* ===============================
   PROFILE POINTS
================================ */
function loadProfilePoints() {
    fetch("/sports_rental_system/customer/api/get_profile.php", {
        credentials: "include"
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
        var pointEl = document.getElementById("topPoints");
        if (pointEl && data.points !== undefined) {
            pointEl.textContent =
                "\u2B50 ".concat(data.points, " \u0E04\u0E30\u0E41\u0E19\u0E19");
        }
    });
}
