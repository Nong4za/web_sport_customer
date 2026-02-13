interface BookingDetail {
    booking: any;
    items: any[];
}

const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const loading = document.getElementById("loading")!;
const box = document.getElementById("detailBox")!;
const slipBox = document.getElementById("slipBox")!;
const slipImg = document.getElementById("slipImg") as HTMLImageElement;
const slipLink = document.getElementById("slipLink") as HTMLAnchorElement;


fetch(`/sports_rental_system/staff/api/get_booking_detail.php?code=${code}`, {
    credentials: "include"
})
    .then(r => r.json())
    .then((res: BookingDetail & { success: boolean }) => {

        loading.style.display = "none";

        if (!res.success) {
            alert("ไม่พบข้อมูล");
            return;
        }

        box.classList.remove("hidden");

        const b = res.booking;

        setText("bkCode", b.booking_id);
        setText("pickup", b.pickup_time);
        setText("return", b.due_return_time);
        setText("bookingStatus", b.booking_status);
        setText("paymentStatus", b.payment_status);

        setText("total", b.total_amount + " บาท");
        setText("discount", b.discount_amount + " บาท");
        setText("pointsUsed", b.points_used + " บาท");
        setText("net", b.net_amount + " บาท");

        const start = new Date(b.pickup_time).getTime();
        const end = new Date(b.due_return_time).getTime();
        const hours = Math.ceil((end - start) / (1000 * 60 * 60));

        renderItems(res.items, hours);

        // ==============================
        // 🔥 แสดงสลิปเฉพาะตอนชำระแล้ว
        // ==============================
        if (b.paid_at && b.slip_url) {

            let slipPath = b.slip_url;
            if (!b.slip_url.startsWith("http")) {
                slipPath = "/sports_rental_system/" + b.slip_url;
            }

            slipImg.src = slipPath;
            slipLink.href = slipPath;

            slipBox.classList.remove("hidden");
        }
    });



function renderItems(items: any[], hours: number) {

    const list = document.getElementById("itemList")!;
    list.innerHTML = "";

    items.forEach(i => {

        const div = document.createElement("div");
        div.className = "item";

        const totalPrice = i.price * hours;

        div.innerHTML = `
            <img src="${i.image}" class="item-img" alt="${i.name}">
            <div class="item-info">
            <strong>${i.name}</strong> (${i.type})<br>
            จำนวน: ${i.qty} |
            ชั่วโมงที่เช่า: ${hours} ชม. |
            ราคา: ${i.price} x ${hours} = <b>${totalPrice}</b> บาท
        `;

        list.appendChild(div);
    });
}

function setText(id: string, txt: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}