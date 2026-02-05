document.addEventListener("DOMContentLoaded", function () {
    console.log("cart.ts loaded");
    renderCart();
    renderBookingSummary();
    var confirmBtn = document.getElementById("confirmBtn");
    confirmBtn === null || confirmBtn === void 0 ? void 0 : confirmBtn.addEventListener("click", function () {
        var cart = getCart();
        if (cart.length === 0) {
            alert("ไม่มีรายการในตะกร้า");
            return;
        }
        var total = calcCartTotal(cart);
        localStorage.setItem("cartTotal", total.toString());
        window.location.href = "confirm.html";
    });
});
/* ===============================
   MAIN RENDER
================================ */
function renderCart() {
    var cart = getCart();
    var emptyBox = document.getElementById("emptyCart");
    var itemsBox = document.getElementById("cartItems");
    var actionsBox = document.getElementById("cartActions");
    if (!emptyBox || !itemsBox || !actionsBox)
        return;
    if (cart.length === 0) {
        emptyBox.classList.remove("hidden");
        itemsBox.classList.add("hidden");
        actionsBox.classList.add("hidden");
        updateCartCount(0);
        return;
    }
    emptyBox.classList.add("hidden");
    itemsBox.classList.remove("hidden");
    actionsBox.classList.remove("hidden");
    itemsBox.innerHTML = "<h3>รายการที่เลือก</h3>";
    var totalQty = 0;
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        totalQty += Number(item.qty) || 0;
        var row = buildCartRow(item);
        itemsBox.appendChild(row);
    }
    updateCartCount(totalQty);
}
/* ===============================
    SUMMARY BAR
================================ */
function renderBookingSummary() {
    var date = localStorage.getItem("rentDate") || "-";
    var time = localStorage.getItem("timeSlot");
    var hoursStr = localStorage.getItem("rentHours");
    var hours = Number(hoursStr || 0);
    var dateEl = document.getElementById("cartDate");
    var timeEl = document.getElementById("cartTime");
    var hourEl = document.getElementById("cartHours");
    if (dateEl)
        dateEl.textContent = date;
    // ===== TIME =====
    if (timeEl) {
        if (time) {
            if (hours) {
                var startHour = parseInt(time);
                var endHour = startHour + hours;
                var pad = function (n) {
                    return n < 10 ? "0" + n : n.toString();
                };
                timeEl.textContent =
                    "".concat(pad(startHour), ":00 - ").concat(pad(endHour), ":00");
            }
            else {
                timeEl.textContent =
                    "".concat(time, ":00");
            }
        }
        else {
            timeEl.textContent = "-";
        }
    }
    // ===== HOURS =====
    if (hourEl) {
        if (hours)
            hourEl.textContent =
                "".concat(hours, " \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07");
        else
            hourEl.textContent = "-";
    }
}
/* ===============================
    FETCH USER POINTS
================================ */
fetch("/sports_rental_system/api/get_profile.php")
    .then(function (res) { return res.json(); })
    .then(function (data) {
    var pointEl = document.getElementById("topPoints");
    if (pointEl && data.points !== undefined) {
        pointEl.textContent =
            "\u2B50 ".concat(data.points, " \u0E04\u0E30\u0E41\u0E19\u0E19");
    }
});
/* ===============================
    BUILD ITEM ROW
================================ */
function buildCartRow(item) {
    var row = document.createElement("div");
    row.className = "cart-item";
    var img = item.image || "images/no-image.png";
    row.innerHTML = "\n\n        <img src=\"".concat(img, "\">\n\n        <div class=\"cart-item-info\">\n            <h4>").concat(item.name, "</h4>\n            <small>\n                ").concat(item.type === "field"
        ? "สนาม"
        : "อุปกรณ์", "\n            </small>\n        </div>\n\n        <div class=\"cart-item-qty readonly\">\n            x<strong>").concat(item.qty, "</strong>\n        </div>\n\n        <button class=\"cart-item-remove\">\n            <i class=\"fa-solid fa-trash\"></i>\n        </button>\n\n    ");
    var removeBtn = row.querySelector(".cart-item-remove");
    removeBtn.addEventListener("click", function () {
        removeItem(item.id);
        renderCart();
    });
    return row;
}
/* ===============================
   CART HELPERS
================================ */
function getCart() {
    try {
        var raw = localStorage.getItem("cart");
        if (!raw)
            return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed
            : [];
    }
    catch (_a) {
        return [];
    }
}
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}
/* ===============================
   MODIFY ITEMS
================================ */
function removeItem(id) {
    var cart = getCart().filter(function (i) { return String(i.id) !== String(id); });
    saveCart(cart);
}
/* ===============================
   UPDATE COUNT
================================ */
function updateCartCount(count) {
    var badge = document.getElementById("cartCount");
    if (badge)
        badge.textContent =
            count.toString();
}
/* ===============================
   TOTAL PRICE
================================ */
function calcCartTotal(cart) {
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var price = Number(item.price) || 0;
        var qty = Number(item.qty) || 0;
        total += price * qty;
    }
    return total;
}
