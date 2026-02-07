interface BookingDetail {
    booking: any;
    items: any[];
}

const params = new URLSearchParams(window.location.search);
const code = params.get("code");

const loading = document.getElementById("loading")!;
const box = document.getElementById("detailBox")!;

fetch(`/sports_rental_system/api/get_booking_detail.php?code=${code}`, {
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

        renderItems(res.items);
    });

function renderItems(items: any[]) {

    const list = document.getElementById("itemList")!;
    list.innerHTML = "";

    items.forEach(i => {

        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
            <strong>${i.name}</strong>
            (${i.item_type})<br>
            จำนวน: ${i.quantity} | ราคา: ${i.price_at_booking}
        `;

        list.appendChild(div);
    });
}

function setText(id: string, txt: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}
