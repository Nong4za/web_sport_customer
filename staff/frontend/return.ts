console.log("🔥 STAFF RETURN READY 🔥");

const listBox =
    document.getElementById("returnList") as HTMLElement;

const tabs =
    document.querySelectorAll(".status-tab");

const modal =
    document.getElementById("returnModal") as HTMLElement;

const closeBtn =
    document.getElementById("returnModalClose") as HTMLButtonElement;

const confirmBtn =
    document.getElementById("returnModalConfirm") as HTMLButtonElement;

const returnItemsBox =
    document.getElementById("returnItems") as HTMLElement;

const penaltySummary =
    document.getElementById("penaltySummary") as HTMLElement;

let currentCode: string | null = null;
let currentStatus = "IN_USE";

let returnItems: any[] = [];

const LATE_FEE_PER_DAY = 50;

/* ================= INIT ================= */

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        currentStatus =
            tab.getAttribute("data-status") || "IN_USE";

        loadReturns();
    });

});

closeBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
});

/* ================= LOAD BOOKINGS ================= */

loadReturns();

function loadReturns() {

    listBox.innerHTML =
        `<p class="loading">กำลังโหลด...</p>`;

    fetch(
        `/sports_rental_system/staff/api/get_returns.php?status=${currentStatus}`,
        { credentials: "include" }
    )
        .then(r => r.json())
        .then(res => {

            if (!res.success) {
                listBox.innerHTML =
                    `<p class="empty">โหลดไม่สำเร็จ</p>`;
                return;
            }

            renderList(res.data || []);
        });
}

/* ================= RENDER LIST ================= */

function renderList(rows: any[]) {

    if (!rows.length) {
        listBox.innerHTML =
            `<p class="empty">ไม่มีรายการ</p>`;
        return;
    }

    listBox.innerHTML = "";

    rows.forEach(r => {

        const card =
            document.createElement("div");

        card.className = "booking-card";

        card.innerHTML = `
            <div class="booking-info">
                <h4>${r.booking_id}</h4>
                <p>ลูกค้า: ${r.customer_name}</p>
                <p>ครบกำหนด: ${r.due_return_time}</p>
            </div>

            <div class="booking-actions">
                <button
                    class="btn-return"
                    data-code="${r.booking_id}">
                    รับคืน
                </button>
            </div>
        `;

        card.querySelector(".btn-return")
            ?.addEventListener("click", e => {

                const btn =
                    e.currentTarget as HTMLElement;

                currentCode =
                    btn.getAttribute("data-code");

                loadReturnDetails(currentCode!);
            });

        listBox.appendChild(card);
    });
}

/* ================= LOAD DETAILS ================= */

function loadReturnDetails(code: string) {

    fetch(
        `/sports_rental_system/staff/api/get_return_details.php?booking_id=${code}`,
        { credentials: "include" }
    )
        .then(r => r.json())
        .then(res => {

            if (!res.success) {
                alert("โหลดรายละเอียดไม่ได้");
                return;
            }

            returnItems = res.items || [];

            renderReturnModal();
            modal.classList.remove("hidden");
        });
}

/* ================= RENDER MODAL ================= */

function renderReturnModal() {

    returnItemsBox.innerHTML = "";

    returnItems.forEach((item, index) => {

        const row =
            document.createElement("div");

        row.className = "return-row";

        row.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <br>
                รหัส: ${item.instance_code}
            </div>

            <div>
                <select data-index="${index}">
                    <option value="NORMAL">ปกติ</option>
                    <option value="DAMAGED">เสียหาย (100)</option>
                    <option value="BROKEN">พังหนัก (300)</option>
                </select>
            </div>
        `;

        returnItemsBox.appendChild(row);
    });

    calculatePenalty();
}

/* ================= CALCULATE ================= */

function calculatePenalty(): number {

    if (!currentCode) return 0;

    let damageFee = 0;

    const selects =
        returnItemsBox.querySelectorAll("select");

    selects.forEach((sel: any) => {

        if (sel.value === "DAMAGED")
            damageFee += 100;

        if (sel.value === "BROKEN")
            damageFee += 300;
    });

    const dueText =
        document.querySelector(
            `[data-code="${currentCode}"]`
        )?.closest(".booking-card")
         ?.querySelector("p:nth-child(3)")
         ?.textContent;

    let lateFee = 0;

    if (dueText) {

        const dueDate =
            new Date(dueText.replace("ครบกำหนด: ", ""));

        const now = new Date();

        if (now > dueDate) {

            const diff =
                now.getTime() - dueDate.getTime();

            const days =
                Math.floor(
                    diff /
                    (1000 * 60 * 60 * 24)
                );

            lateFee = days * LATE_FEE_PER_DAY;
        }
    }

    const total = damageFee + lateFee;

    penaltySummary.innerHTML = `
        <p>ค่าคืนช้า: ${lateFee} บาท</p>
        <p>ค่าเสียหาย: ${damageFee} บาท</p>
        <hr>
        <strong>รวม: ${total} บาท</strong>
    `;

    return total;
}

/* ================= CONFIRM ================= */

confirmBtn?.addEventListener("click", () => {

    if (!currentCode) return;

    const total = calculatePenalty();

    if (total === 0) {

        completeBooking(currentCode);

    } else {

        window.location.href =
            `return-payment.html?code=${currentCode}&penalty=${total}`;
    }
});

/* ================= COMPLETE ================= */

function completeBooking(code: string) {

    fetch(
        "/sports_rental_system/staff/api/confirm_return.php",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                booking_code: code
            })
        }
    )
        .then(r => r.json())
        .then(res => {

            if (!res.success) {
                alert(res.message);
                return;
            }

            alert("คืนสำเร็จ");

            modal.classList.add("hidden");
            loadReturns();
        });
}
