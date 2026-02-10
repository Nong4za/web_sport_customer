console.log("🔥 STAFF CONFIRM TS READY 🔥");
/* ===============================
GLOBAL
================================ */
var equipmentTotal = 0;
var fieldTotal = 0;
var extraHourFee = 0;
var selectedBranchId = null;
var BASE_HOURS = 3;
/* ===============================
INIT
================================ */
document.addEventListener("DOMContentLoaded", function () {
    loadBranch();
    loadBookingInfo();
    loadCustomerInfo();
    renderItems();
    calcTotals();
    bindSubmit();
});
/* ===============================
LOAD BRANCH
================================ */
function loadBranch() {
    fetch("/sports_rental_system/staff/api/get_selected_branch.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        var _a;
        if (!res || res.success === false) {
            window.location.href = "branches.html";
            return;
        }
        var data = (_a = res.data) !== null && _a !== void 0 ? _a : res;
        selectedBranchId = data.branch_id;
        localStorage.setItem("branchId", data.branch_id);
    });
}
/* ===============================
LOAD CUSTOMER
================================ */
function loadCustomerInfo() {
    setText("cId", localStorage.getItem("customer_id") || "-");
    setText("cName", localStorage.getItem("customer_name") || "-");
    setText("cPhone", localStorage.getItem("customer_phone") || "-");
    setText("cFaculty", localStorage.getItem("customer_faculty") || "-");
    setText("cYear", localStorage.getItem("customer_year") || "-");
}
/* ===============================
BOOKING INFO
================================ */
function loadBookingInfo() {
    var date = localStorage.getItem("rentDate");
    var time = localStorage.getItem("timeSlot");
    var hours = Number(localStorage.getItem("rentHours") || 1);
    setText("confirmDate", date || "-");
    if (time && hours) {
        var s = Number(time);
        var e = s + hours;
        setText("confirmTime", "".concat(pad(s), ":00 - ").concat(pad(e), ":00"));
    }
    setText("confirmHours", hours.toString());
}
/* ===============================
ITEMS
================================ */
function renderItems() {
    var box = document.getElementById("confirmItems");
    if (!box)
        return;
    var cart = getCart();
    var hours = Number(localStorage.getItem("rentHours") || 1);
    box.innerHTML = "";
    cart.forEach(function (item) {
        var price = Number(item.price || 0);
        var qty = Number(item.qty || 1);
        var perHourTotal = price * qty;
        var total = perHourTotal * hours;
        var row = document.createElement("div");
        row.className = "confirm-item";
        var imgHtml = item.image && item.image !== "null"
            ? "<img src=\"".concat(item.image.trim(), "\" alt=\"\">")
            : "";
        row.innerHTML = "\n\t\t\t".concat(imgHtml, "\n\n\t\t\t<div class=\"confirm-item-info\">\n\t\t\t\t<h4>").concat(item.name, "</h4>\n\t\t\t\t<small>\n\t\t\t\t\t").concat(isField(item.type)
            ? "สนาม"
            : "รหัสอุปกรณ์: " + (item.instance_code || "-"), "\n\t\t\t\t</small>\n\t\t\t</div>\n\n\t\t\t<div class=\"confirm-item-qty\">\n\t\t\t\tx<strong>").concat(qty, "</strong>\n\t\t\t</div>\n\n\t\t\t<div class=\"confirm-item-price\">\n\t\t\t\t<div class=\"per-hour\">\n\t\t\t\t\t").concat(perHourTotal, " \u0E1A\u0E32\u0E17 / \u0E0A\u0E21.\n\t\t\t\t</div>\n\t\t\t\t<strong>\n\t\t\t\t\t").concat(perHourTotal, " \u00D7 ").concat(hours, "\n\t\t\t\t\t= ").concat(total, " \u0E1A\u0E32\u0E17\n\t\t\t\t</strong>\n\t\t\t</div>\n\t\t");
        box.appendChild(row);
    });
}
/* ===============================
TOTAL CALC
================================ */
function calcTotals() {
    equipmentTotal = 0;
    fieldTotal = 0;
    var cart = getCart();
    var hours = Number(localStorage.getItem("rentHours") || 1);
    cart.forEach(function (i) {
        var price = Number(i.price || 0);
        var qty = Number(i.qty || 1);
        var subtotal = price *
            qty *
            hours;
        if (isField(i.type)) {
            fieldTotal += subtotal;
        }
        else {
            equipmentTotal += subtotal;
        }
    });
    extraHourFee = calcExtraHourFee(hours);
    updateTotals();
}
function calcExtraHourFee(hours) {
    if (hours <= 3)
        return 0;
    if (hours === 4)
        return 100;
    if (hours === 5)
        return 200;
    if (hours >= 6)
        return 300;
    return 0;
}
/* ===============================
UPDATE TOTAL UI
================================ */
function updateTotals() {
    var gross = equipmentTotal +
        fieldTotal +
        extraHourFee;
    setText("equipmentTotal", equipmentTotal + " บาท");
    setText("fieldTotal", fieldTotal + " บาท");
    setText("extraHourFee", extraHourFee + " บาท");
    setText("netTotal", gross + " บาท");
    setText("earnPoints", Math.floor(gross / 100).toString());
}
/* ===============================
SUBMIT
================================ */
function bindSubmit() {
    var _a;
    (_a = document
        .getElementById("payBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
        var ok = confirm("ยืนยันการสร้างรายการจอง และไปหน้าชำระเงินหรือไม่?");
        if (!ok)
            return;
        var branchId = localStorage.getItem("branchId");
        var customerId = localStorage.getItem("customer_id");
        if (!branchId || !customerId) {
            alert("❌ ข้อมูลไม่ครบ");
            return;
        }
        var rawDate = localStorage.getItem("rentDate");
        if (rawDate && rawDate.indexOf("/") !== -1) {
            var p = rawDate.split("/");
            rawDate =
                p[2] + "-" +
                    p[1] + "-" +
                    p[0];
        }
        var timeSlotRaw = localStorage.getItem("timeSlot");
        if (!rawDate || !timeSlotRaw) {
            alert("❌ วันหรือเวลาไม่ครบ");
            return;
        }
        var payload = {
            branchId: branchId,
            customerId: customerId,
            rentDate: rawDate,
            timeSlot: Number(timeSlotRaw),
            rentHours: Number(localStorage.getItem("rentHours") || 1),
            cart: getCart()
        };
        console.log("🚀 STAFF CREATE BOOKING =>", payload);
        fetch("/sports_rental_system/staff/api/create_booking.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(payload)
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
            if (!data.success) {
                alert("❌ สร้างการจองไม่ได้: " +
                    data.message);
                return;
            }
            window.location.href =
                "payment.html?code=".concat(data.booking_code);
        })
            .catch(function (err) {
            console.error(err);
            alert("❌ เกิดข้อผิดพลาดกับเซิร์ฟเวอร์");
        });
    });
}
/* ===============================
UTILS
================================ */
function getCart() {
    var raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
}
function pad(n) {
    return n < 10 ? "0" + n : n.toString();
}
function setText(id, value) {
    var el = document.getElementById(id);
    if (el)
        el.textContent = value;
}
function isField(type) {
    return (type === "field" ||
        type === "สนาม");
}
