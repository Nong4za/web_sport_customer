var params = new URLSearchParams(window.location.search);
var code = params.get("code");
var loading = document.getElementById("loading");
var box = document.getElementById("detailBox");
fetch("/sports_rental_system/customer/api/custget_booking_detail.php?code=".concat(code), {
    credentials: "include"
})
    .then(function (r) { return r.json(); })
    .then(function (res) {
    loading.style.display = "none";
    if (!res.success) {
        alert("ไม่พบข้อมูล");
        return;
    }
    box.classList.remove("hidden");
    var b = res.booking;
    setText("bkCode", b.booking_id);
    setText("pickup", b.pickup_time);
    setText("return", b.due_return_time);
    setText("bookingStatus", b.booking_status);
    setText("paymentStatus", b.payment_status);
    setText("total", b.total_amount + " บาท");
    setText("discount", b.discount_amount + " บาท");
    setText("pointsUsed", b.points_used + " บาท");
    setText("net", b.net_amount + " บาท");
    renderItems(res.items);
});
function renderItems(items) {
    var list = document.getElementById("itemList");
    list.innerHTML = "";
    items.forEach(function (i) {
        var div = document.createElement("div");
        div.className = "item";
        div.innerHTML = "\n            <strong>".concat(i.name, "</strong>\n            (").concat(i.item_type, ")<br>\n            \u0E08\u0E33\u0E19\u0E27\u0E19: ").concat(i.quantity, " | \u0E23\u0E32\u0E04\u0E32: ").concat(i.price_at_booking, "\n        ");
        list.appendChild(div);
    });
}
function setText(id, txt) {
    var el = document.getElementById(id);
    if (el)
        el.textContent = txt;
}
