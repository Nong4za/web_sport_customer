console.log("🔥 STAFF CONFIRM TS READY 🔥");
/* ===============================
GLOBAL
================================ */
var USER_POINTS = 0;
var usedPoints = 0;
var couponDiscount = 0;
var couponCode = "";
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
    bindPointControls();
    bindCoupon();
    bindSubmit();
});
/* ===============================
LOAD BRANCH
================================ */
function loadBranch() {
    fetch("/sports_rental_system/staff/api/get_selected_branch.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        if (!res || res.success === false) {
            window.location.href = "branches.html";
            return;
        }
        var data = res.data || res;
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
    USER_POINTS = Number(localStorage.getItem("customer_points") || 0);
    setText("availablePoints", USER_POINTS.toString());
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
        setText("confirmTime", pad(s) + ":00 - " + pad(e) + ":00");
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
            ? '<img src="' + item.image.trim() + '" alt="">'
            : "";
        row.innerHTML =
            imgHtml +
                '<div class="confirm-item-info">' +
                '<h4>' + item.name + '</h4>' +
                '<small>' +
                (isField(item.type)
                    ? "รหัสสนาม: " +
                        (item.venue_code || item.instance_code || "-")
                    : "รหัสอุปกรณ์: " +
                        (item.instance_code || "-")) +
                '</small>' +
                '</div>' +
                '<div class="confirm-item-qty">x<strong>' +
                qty +
                '</strong></div>' +
                '<div class="confirm-item-price">' +
                '<div class="per-hour">' +
                perHourTotal +
                ' บาท / ชม.</div>' +
                '<strong>' +
                perHourTotal +
                ' × ' +
                hours +
                ' = ' +
                total +
                ' บาท</strong>' +
                '</div>';
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
    var net = Math.max(gross -
        usedPoints -
        couponDiscount, 0);
    setText("equipmentTotal", equipmentTotal + " บาท");
    setText("fieldTotal", fieldTotal + " บาท");
    setText("extraHourFee", extraHourFee + " บาท");
    setText("pointDiscount", usedPoints.toString());
    setText("couponDiscount", couponDiscount.toString());
    setText("netTotal", net + " บาท");
    setText("earnPoints", Math.floor(net / 100).toString());
}
/* ===============================
POINT CONTROLS
================================ */
function bindPointControls() {
    var input = document.getElementById("usePointInput");
    if (!input)
        return;
    input.addEventListener("change", function () {
        var gross = equipmentTotal +
            fieldTotal +
            extraHourFee;
        var v = Number(input.value || 0);
        if (v > USER_POINTS)
            v = USER_POINTS;
        if (v > gross)
            v = gross;
        usedPoints = v;
        input.value = v.toString();
        updateTotals();
    });
}
/* ===============================
COUPON
================================ */
function bindCoupon() {
    var btn = document.getElementById("applyCoupon");
    if (!btn)
        return;
    btn.addEventListener("click", function () {
        var input = document.getElementById("couponInput");
        if (!input)
            return;
        var code = input.value.trim();
        if (!code)
            return;
        var gross = equipmentTotal +
            fieldTotal +
            extraHourFee;
        fetch("/sports_rental_system/staff/api/check_coupon.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                code: code,
                total: gross,
                cart: getCart(),
                customerId: localStorage.getItem("customer_id")
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
            var msg = document.getElementById("couponMsg");
            if (!res.success) {
                if (msg) {
                    msg.textContent =
                        res.message || "คูปองใช้ไม่ได้";
                    msg.className =
                        "coupon-msg error";
                }
                couponDiscount = 0;
                couponCode = null;
                updateTotals();
                return;
            }
            if (res.type === "percent") {
                couponDiscount =
                    Math.floor(gross *
                        Number(res.discount) / 100);
            }
            else {
                couponDiscount =
                    Number(res.discount || 0);
            }
            couponCode = code;
            if (msg) {
                msg.textContent =
                    "ใช้คูปองสำเร็จ ลด " +
                        couponDiscount +
                        " บาท";
                msg.className =
                    "coupon-msg success";
            }
            updateTotals();
        });
    });
}
/* ===============================
SUBMIT
================================ */
function bindSubmit() {
    var btn = document.getElementById("payBtn");
    if (!btn)
        return;
    btn.addEventListener("click", function () {
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
            usedPoints: usedPoints,
            couponDiscount: couponDiscount,
            couponCode: couponCode,
            cart: getCart()
        };
        console.log("🚀 STAFF CREATE BOOKING =>", payload);
        fetch("/sports_rental_system/staff/api/create_booking.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
                data.redirect;
        })
            .catch(function (err) {
            console.error(err);
            alert("❌ เซิร์ฟเวอร์ผิดพลาด");
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
