var params = new URLSearchParams(window.location.search);
var code = params.get("code");
var loading = document.getElementById("loading");
var box = document.getElementById("detailBox");
var slipBox = document.getElementById("slipBox");
var slipImg = document.getElementById("slipImg");
var slipLink = document.getElementById("slipLink");
fetch("/sports_rental_system/staff/api/get_booking_detail.php?code=".concat(code), {
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
    var start = new Date(b.pickup_time).getTime();
    var end = new Date(b.due_return_time).getTime();
    var hours = Math.ceil((end - start) / (1000 * 60 * 60));
    renderItems(res.items, hours);
    // ==============================
    // 🔥 แสดงสลิปเฉพาะตอนชำระแล้ว
    // ==============================
    if (b.paid_at && b.slip_url) {
        var slipPath = b.slip_url;
        if (!b.slip_url.startsWith("http")) {
            slipPath = "/sports_rental_system/" + b.slip_url;
        }
        slipImg.src = slipPath;
        slipLink.href = slipPath;
        slipBox.classList.remove("hidden");
    }
});
function renderItems(items, hours) {
    var list = document.getElementById("itemList");
    list.innerHTML = "";
    items.forEach(function (i) {
        var div = document.createElement("div");
        div.className = "item";
        var totalPrice = i.price * hours;
        div.innerHTML = "\n            <img src=\"".concat(i.image, "\" class=\"item-img\" alt=\"").concat(i.name, "\">\n            <div class=\"item-info\">\n            <strong>").concat(i.name, "</strong> (").concat(i.type, ")<br>\n            \u0E08\u0E33\u0E19\u0E27\u0E19: ").concat(i.qty, " |\n            \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E48\u0E32: ").concat(hours, " \u0E0A\u0E21. |\n            \u0E23\u0E32\u0E04\u0E32: ").concat(i.price, " x ").concat(hours, " = <b>").concat(totalPrice, "</b> \u0E1A\u0E32\u0E17\n        ");
        list.appendChild(div);
    });
}
function setText(id, txt) {
    var el = document.getElementById(id);
    if (el)
        el.textContent = txt;
}
