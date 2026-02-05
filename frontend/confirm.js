var USER_POINTS = 0;
var usedPoints = 0;
var couponDiscount = 0;
// 🔵 baseTotal = ของใน cart อย่างเดียว
var baseTotal = 0;
// 🔵 ค่าชั่วโมงเพิ่ม
var extraHourFee = 0;
document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
    loadBookingInfo();
    renderItems();
    calcBaseTotal();
    bindPointControls();
    bindCoupon();
    bindSubmit();
});
/* ===============================
   LOAD USER
================================ */
function loadProfile() {
    fetch("/sports_rental_system/api/get_profile.php")
        .then(function (r) { return r.json(); })
        .then(function (d) {
        USER_POINTS = Number(d.points || 0);
        var top = document.getElementById("topPoints");
        if (top)
            top.textContent = "\u2B50 ".concat(USER_POINTS, " \u0E04\u0E30\u0E41\u0E19\u0E19");
        var user = document.getElementById("userPoints");
        if (user)
            user.textContent = USER_POINTS.toString();
    });
}
/* ===============================
   BOOKING INFO
================================ */
function loadBookingInfo() {
    var date = localStorage.getItem("rentDate");
    var time = localStorage.getItem("timeSlot");
    var hours = Number(localStorage.getItem("rentHours") || 0);
    var dateEl = document.getElementById("confirmDate");
    if (dateEl)
        dateEl.textContent = date || "-";
    var timeEl = document.getElementById("confirmTime");
    if (timeEl) {
        if (time && hours) {
            var s = Number(time);
            var e = s + hours;
            timeEl.textContent =
                "".concat(pad(s), ":00 - ").concat(pad(e), ":00");
        }
        else if (time) {
            timeEl.textContent = "".concat(time, ":00");
        }
        else {
            timeEl.textContent = "-";
        }
    }
    var hoursEl = document.getElementById("confirmHours");
    if (hoursEl) {
        hoursEl.textContent =
            hours ? hours.toString() : "-";
    }
}
/* ===============================
   ITEMS
================================ */
function renderItems() {
    var box = document.getElementById("confirmItems");
    if (!box)
        return;
    var cart = getCart();
    box.innerHTML = "";
    var totalQty = 0;
    cart.forEach(function (item) {
        totalQty += Number(item.qty) || 0;
        var row = document.createElement("div");
        row.className = "confirm-item";
        var img = item.image || "images/no-image.png";
        row.innerHTML = "\n            <img src=\"".concat(img, "\" alt=\"").concat(item.name, "\">\n            <div class=\"confirm-item-info\">\n                <h4>").concat(item.name, "</h4>\n                <small>").concat(item.type === "field" ? "สนาม" : "อุปกรณ์", "</small>\n            </div>\n            <div class=\"confirm-item-qty\">\n                x<strong>").concat(item.qty, "</strong>\n            </div>\n            <div class=\"confirm-item-price\">\n                <strong>").concat(item.price * item.qty, " \u0E1A\u0E32\u0E17</strong>\n            </div>\n        ");
        box.appendChild(row);
    });
    var countEl = document.getElementById("itemCount");
    if (countEl)
        countEl.textContent = totalQty.toString();
}
/* ===============================
   TOTAL
================================ */
function calcExtraHourFee(hours) {
    if (hours === 4)
        return 100;
    if (hours === 5)
        return 200;
    if (hours === 6)
        return 300;
    return 0; // 1–3 ชม.
}
function calcBaseTotal() {
    baseTotal = 0;
    var cart = getCart();
    cart.forEach(function (i) {
        baseTotal += i.price * i.qty;
    });
    var hours = Number(localStorage.getItem("rentHours") || 0);
    extraHourFee =
        calcExtraHourFee(hours);
    updateTotals();
}
/* ===============================
   UPDATE TOTAL DISPLAY
================================ */
function updateTotals() {
    var gross = baseTotal + extraHourFee;
    var net = Math.max(gross -
        usedPoints -
        couponDiscount, 0);
    document.getElementById("baseTotal").textContent =
        gross + " บาท";
    document.getElementById("pointDiscount").textContent =
        usedPoints.toString();
    document.getElementById("couponDiscount").textContent =
        couponDiscount.toString();
    document.getElementById("netTotal").textContent =
        net + " บาท";
    document.getElementById("earnPoints").textContent =
        Math.floor(gross / 100).toString();
}
/* ===============================
    POINT CONTROL
================================ */
function bindPointControls() {
    var _a, _b, _c;
    var input = document.getElementById("usePointInput");
    if (!input)
        return;
    var getGross = function () { return baseTotal + extraHourFee; };
    (_a = document.getElementById("plusPoint")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
        if (usedPoints < USER_POINTS &&
            usedPoints < getGross()) {
            usedPoints++;
            input.value = usedPoints.toString();
            updateTotals();
        }
    });
    (_b = document.getElementById("minusPoint")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", function () {
        if (usedPoints > 0) {
            usedPoints--;
            input.value = usedPoints.toString();
            updateTotals();
        }
    });
    (_c = document.getElementById("useMaxPoint")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", function () {
        usedPoints =
            Math.min(USER_POINTS, getGross());
        input.value =
            usedPoints.toString();
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
        var gross = baseTotal + extraHourFee;
        var cart = getCart(); // 🔥 สำคัญมาก
        fetch("/sports_rental_system/api/check_coupon.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: code,
                total: gross,
                cart: cart
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
            var msg = document.getElementById("couponMsg");
            if (!msg)
                return;
            if (!res.success) {
                msg.textContent = res.message;
                msg.className = "msg error";
                couponDiscount = 0;
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
            msg.textContent =
                "\u0E43\u0E0A\u0E49\u0E04\u0E39\u0E1B\u0E2D\u0E07\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E25\u0E14 ".concat(couponDiscount, " \u0E1A\u0E32\u0E17");
            msg.className =
                "msg success";
            updateTotals();
        });
    });
}
/* ===============================
   SUBMIT
================================ */
function bindSubmit() {
    var _a;
    (_a = document.getElementById("payBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
        alert("🚀 ส่งข้อมูล booking ไป backend ต่อได้แล้ว");
    });
}
/* ===============================
   UTILS
================================ */
function getCart() {
    var raw = localStorage.getItem("cart");
    return raw
        ? JSON.parse(raw)
        : [];
}
function pad(n) {
    return n < 10
        ? "0" + n
        : n.toString();
}
