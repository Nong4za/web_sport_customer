document.addEventListener("DOMContentLoaded", () => {

    console.log("cart.ts loaded");

    renderCart();
    renderBookingSummary();

    const confirmBtn =
        document.getElementById("confirmBtn") as HTMLButtonElement | null;

    confirmBtn?.addEventListener("click", () => {

        const cart = getCart();

        if (cart.length === 0) {
            alert("ไม่มีรายการในตะกร้า");
            return;
        }

        const total = calcCartTotal(cart);

        localStorage.setItem(
            "cartTotal",
            total.toString()
        );

        window.location.href = "confirm.html";

    });

});


/* ===============================
   MAIN RENDER
================================ */

function renderCart() {

    const cart = getCart();

    const emptyBox =
        document.getElementById("emptyCart");

    const itemsBox =
        document.getElementById("cartItems");

    const actionsBox =
        document.getElementById("cartActions");

    if (!emptyBox || !itemsBox || !actionsBox) return;

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

    let totalQty = 0;

    for (let i = 0; i < cart.length; i++) {

        const item = cart[i];
        totalQty += Number(item.qty) || 0;

        const row = buildCartRow(item);
        itemsBox.appendChild(row);

    }

    updateCartCount(totalQty);

}


/* ===============================
    SUMMARY BAR
================================ */

function renderBookingSummary() {

    const date =
        localStorage.getItem("rentDate") || "-";

    const time =
        localStorage.getItem("timeSlot");

    const hoursStr =
        localStorage.getItem("rentHours");

    const hours =
        Number(hoursStr || 0);

    const dateEl =
        document.getElementById("cartDate");

    const timeEl =
        document.getElementById("cartTime");

    const hourEl =
        document.getElementById("cartHours");

    if (dateEl)
        dateEl.textContent = date;

    // ===== TIME =====
    if (timeEl) {

        if (time) {

            if (hours) {

                const startHour =
                    parseInt(time);

                const endHour =
                    startHour + hours;

                const pad = (n: number) =>
                    n < 10 ? "0" + n : n.toString();

                timeEl.textContent =
                    `${pad(startHour)}:00 - ${pad(endHour)}:00`;

            } else {

                timeEl.textContent =
                    `${time}:00`;

            }

        } else {

            timeEl.textContent = "-";

        }

    }

    // ===== HOURS =====
    if (hourEl) {

        if (hours)
            hourEl.textContent =
                `${hours} ชั่วโมง`;
        else
            hourEl.textContent = "-";

    }

}


/* ===============================
    FETCH USER POINTS
================================ */

fetch("/sports_rental_system/customer/api/get_profile.php")
    .then(res => res.json())
    .then(data => {

        const pointEl =
            document.getElementById("topPoints");

        if (pointEl && data.points !== undefined) {
            pointEl.textContent =
                `⭐ ${data.points} คะแนน`;
        }

    });


/* ===============================
    BUILD ITEM ROW
================================ */

function buildCartRow(item: any): HTMLElement {

    const row =
        document.createElement("div");

    row.className = "cart-item";

    const img =
        item.image || "images/no-image.png";

    row.innerHTML = `

        <img src="${img}">

        <div class="cart-item-info">
            <h4>${item.name}</h4>
            <small>
                ${item.type === "field"
            ? "สนาม"
            : "อุปกรณ์"}
            </small>
        </div>

        <div class="cart-item-qty readonly">
            x<strong>${item.qty}</strong>
        </div>

        <button class="cart-item-remove">
            <i class="fa-solid fa-trash"></i>
        </button>

    `;

    const removeBtn =
        row.querySelector(".cart-item-remove") as HTMLButtonElement;

    removeBtn.addEventListener("click", () => {

        removeItem(item.id);
        renderCart();

    });

    return row;

}


/* ===============================
   CART HELPERS
================================ */

function getCart(): any[] {

    try {

        const raw =
            localStorage.getItem("cart");

        if (!raw) return [];

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {

        return [];

    }

}


function saveCart(cart: any[]) {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


/* ===============================
   MODIFY ITEMS
================================ */

function removeItem(id: string) {

    const cart =
        getCart().filter(
            i => String(i.id) !== String(id)
        );

    saveCart(cart);

}


/* ===============================
   UPDATE COUNT
================================ */

function updateCartCount(count: number) {

    const badge =
        document.getElementById("cartCount");

    if (badge)
        badge.textContent =
            count.toString();

}


/* ===============================
   TOTAL PRICE
================================ */

function calcCartTotal(cart: any[]): number {

    let total = 0;

    for (let i = 0; i < cart.length; i++) {

        const item = cart[i];

        const price =
            Number(item.price) || 0;

        const qty =
            Number(item.qty) || 0;

        total += price * qty;

    }

    return total;

}
