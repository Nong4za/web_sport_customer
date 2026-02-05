let USER_POINTS = 0;
let usedPoints = 0;
let couponDiscount = 0;
let baseTotal = 0;
let extraHourFee = 0;

document.addEventListener("DOMContentLoaded", () => {
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

function loadProfile(): void {

    fetch("/sports_rental_system/api/get_profile.php")
        .then(r => r.json())
        .then((d: any) => {

            USER_POINTS = Number(d.points || 0);

            const top = document.getElementById("topPoints");
            if (top) top.textContent = `⭐ ${USER_POINTS} คะแนน`;

            const user = document.getElementById("userPoints");
            if (user) user.textContent = USER_POINTS.toString();

        });

}

/* ===============================
   BOOKING INFO
================================ */

function loadBookingInfo(): void {

    const date = localStorage.getItem("rentDate");
    const time = localStorage.getItem("timeSlot");
    const hours = Number(localStorage.getItem("rentHours") || 0);

    const dateEl = document.getElementById("confirmDate");
    if (dateEl) dateEl.textContent = date || "-";

    const timeEl = document.getElementById("confirmTime");

    if (timeEl) {

        if (time && hours) {

            const s = Number(time);
            const e = s + hours;

            timeEl.textContent =
                `${pad(s)}:00 - ${pad(e)}:00`;

        } else if (time) {

            timeEl.textContent = `${time}:00`;

        } else {

            timeEl.textContent = "-";

        }

    }

    const hoursEl = document.getElementById("confirmHours");
    if (hoursEl) {
        hoursEl.textContent =
            hours ? hours.toString() : "-";
    }

}

/* ===============================
   ITEMS
================================ */

function renderItems(): void {

    const box = document.getElementById("confirmItems");
    if (!box) return;

    const cart = getCart();

    box.innerHTML = "";

    let totalQty = 0;

    cart.forEach((item: any) => {

        totalQty += Number(item.qty) || 0;

        const row = document.createElement("div");
        row.className = "confirm-item";

        const img = item.image || "images/no-image.png";

        row.innerHTML = `
            <img src="${img}" alt="${item.name}">
            <div class="confirm-item-info">
                <h4>${item.name}</h4>
                <small>${item.type === "field" ? "สนาม" : "อุปกรณ์"}</small>
            </div>
            <div class="confirm-item-qty">
                x<strong>${item.qty}</strong>
            </div>
            <div class="confirm-item-price">
                <strong>${item.price * item.qty} บาท</strong>
            </div>
        `;

        box.appendChild(row);

    });

    const countEl = document.getElementById("itemCount");
    if (countEl) countEl.textContent = totalQty.toString();

}

/* ===============================
   TOTAL
================================ */

function calcExtraHourFee(hours: number): number {

    if (hours === 4) return 100;
    if (hours === 5) return 200;
    if (hours === 6) return 300;

    return 0; // 1–3 ชม.
}

function calcBaseTotal(): void {

    baseTotal = 0;

    const cart = getCart();

    cart.forEach((i: any) => {
        baseTotal += i.price * i.qty;
    });

    const hours =
        Number(localStorage.getItem("rentHours") || 0);

    extraHourFee =
        calcExtraHourFee(hours);

    baseTotal += extraHourFee;

    updateTotals();

}
// ===============================
// UPDATE TOTAL DISPLAY
//================================
function updateTotals(): void {

    const gross =
        baseTotal + extraHourFee;

    const net =
        Math.max(
            gross -
            usedPoints -
            couponDiscount,
            0
        );

    document.getElementById("baseTotal")!.textContent =
        gross + " บาท";

    document.getElementById("pointDiscount")!.textContent =
        usedPoints.toString();

    document.getElementById("couponDiscount")!.textContent =
        couponDiscount.toString();

    document.getElementById("netTotal")!.textContent =
        net + " บาท";

    document.getElementById("earnPoints")!.textContent =
        Math.floor(gross / 100).toString();

    const extraEl =
        document.getElementById("extraHourFee");

    if (extraEl) {
        extraEl.textContent =
            extraHourFee + " บาท";
    }

}

/* ===============================
    POINT CONTROL
================================ */

function bindPointControls(): void {

    const input =
        document.getElementById("usePointInput") as HTMLInputElement;

    if (!input) return;

    document.getElementById("plusPoint")
        ?.addEventListener("click", () => {

            if (usedPoints < USER_POINTS &&
                usedPoints < baseTotal) {

                usedPoints++;
                input.value = usedPoints.toString();
                updateTotals();

            }

        });

    document.getElementById("minusPoint")
        ?.addEventListener("click", () => {

            if (usedPoints > 0) {

                usedPoints--;
                input.value = usedPoints.toString();
                updateTotals();

            }

        });

    document.getElementById("useMaxPoint")
        ?.addEventListener("click", () => {

            usedPoints =
                Math.min(USER_POINTS, baseTotal);

            input.value =
                usedPoints.toString();

            updateTotals();

        });

}

/* ===============================
   COUPON
================================ */

function bindCoupon(): void {

    const btn =
        document.getElementById("applyCoupon");

    if (!btn) return;

    btn.addEventListener("click", () => {

        const input =
            document.getElementById("couponInput") as HTMLInputElement;

        if (!input) return;

        const code =
            input.value.trim();

        if (!code) return;

        fetch(
            "/sports_rental_system/api/check_coupon.php" +
            "?code=" + encodeURIComponent(code) +
            "&total=" + baseTotal
        )
            .then(r => r.json())
            .then((res: any) => {

                const msg =
                    document.getElementById("couponMsg");

                if (!msg) return;

                if (!res.success) {

                    msg.textContent =
                        res.message;

                    msg.className =
                        "msg error";

                    couponDiscount = 0;
                    updateTotals();

                    return;

                }

                if (res.type === "percent") {

                    couponDiscount =
                        Math.floor(
                            baseTotal *
                            Number(res.discount) /
                            100
                        );

                } else {

                    couponDiscount =
                        Number(res.discount || 0);

                }

                msg.textContent =
                    `ใช้คูปองสำเร็จ ลด ${couponDiscount} บาท`;

                msg.className =
                    "msg success";

                updateTotals();

            });

    });

}

/* ===============================
   SUBMIT
================================ */

function bindSubmit(): void {

    document.getElementById("payBtn")
        ?.addEventListener("click", () => {

            alert(
                "🚀 ส่งข้อมูล booking ไป backend ต่อได้แล้ว"
            );

        });

}

/* ===============================
   UTILS
================================ */

function getCart(): any[] {

    const raw =
        localStorage.getItem("cart");

    return raw
        ? JSON.parse(raw)
        : [];

}

function pad(n: number): string {

    return n < 10
        ? "0" + n
        : n.toString();

}
