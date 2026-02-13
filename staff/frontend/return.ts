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

let currentCode: string | null = null;
let currentStatus = "IN_USE";

/* ================= INIT ================= */

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(t =>
            t.classList.remove("active"));

        tab.classList.add("active");

        currentStatus =
            tab.getAttribute("data-status") || "IN_USE";

        loadReturns();
    });

});

closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
});

confirmBtn.addEventListener("click", () => {

    if (!currentCode) return;

    confirmBtn.disabled = true;

    fetch(
        "/sports_rental_system/staff/api/confirm_return.php",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                booking_code: currentCode
            })
        }
    )
        .then(r => r.json())
        .then(res => {

            if (!res.success) {
                alert(res.message || "บันทึกไม่สำเร็จ");
                confirmBtn.disabled = false;
                return;
            }

            alert("✅ รับคืนเรียบร้อย");

            modal.classList.add("hidden");

            loadReturns();
        });
});

/* ================= LOAD ================= */

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

/* ================= RENDER ================= */

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

                <span class="status ${
                    r.status === "OVERDUE"
                        ? "overdue"
                        : r.status === "RETURNED"
                            ? "returned"
                            : "active"
                }">
                    ${r.status}
                </span>

                <h4>${r.booking_id}</h4>

                <p>ลูกค้า: ${r.customer_name}</p>
                <p>ครบกำหนด: ${r.due_return_time}</p>

            </div>

            <div class="booking-actions">

                ${
                    r.status !== "RETURNED"
                        ? `
                            <button
                                class="btn-return"
                                data-code="${r.booking_id}">
                                รับคืน
                            </button>
                          `
                        : ""
                }

            </div>
        `;

        card
            .querySelector(".btn-return")
            ?.addEventListener("click", e => {

                const btn =
                    e.currentTarget as HTMLElement;

                currentCode =
                    btn.getAttribute("data-code");

                modal.classList.remove("hidden");
            });

        listBox.appendChild(card);

    });
}
