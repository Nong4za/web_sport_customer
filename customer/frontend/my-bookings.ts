console.log("🔥 MY BOOKINGS TS READY 🔥");

interface Booking {
    booking_id: string;
    pickup_time: string;
    due_return_time: string;
    net_amount: number;
    status_code: string;
}

/* ===============================
   DOM
================================ */

const bookingList =
    document.getElementById("bookingList") as HTMLElement;

const tabs =
    document.querySelectorAll(".status-tab") as NodeListOf<HTMLButtonElement>;

const confirmModal =
    document.getElementById("confirmCancelModal") as HTMLElement;

const refundModal =
    document.getElementById("refundModal") as HTMLElement;

const finalModal =
    document.getElementById("finalCancelModal") as HTMLElement;

/* ===============================
   DATA
================================ */

let allBookings: Booking[] = [];
let currentStatus = "WAITING_STAFF";

let selectedCancelCode: string | null = null;

/* ===============================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {

    fetchBookings();
    bindTabs();
    loadProfilePoints();

    document.getElementById("closeConfirmCancel")
        ?.addEventListener("click", closeAllModals);

    document.getElementById("closeRefund")
        ?.addEventListener("click", closeAllModals);

    document.getElementById("closeFinalCancel")
        ?.addEventListener("click", closeAllModals);

    document.getElementById("continueCancel")
        ?.addEventListener("click", checkRefundInfo);

    document.getElementById("saveRefund")
        ?.addEventListener("click", saveRefundInfo);

    document.getElementById("submitCancel")
        ?.addEventListener("click", submitCancel);

    document.getElementById("editRefundBtn")
        ?.addEventListener("click", () => {

            hideModal(finalModal);
            showModal(refundModal);
        });
});

/* ===============================
   FETCH BOOKINGS
================================ */

function fetchBookings(): void {

    fetch("/sports_rental_system/customer/api/get_my_bookings.php", {
        credentials: "include"
    })
        .then(res => res.json())
        .then(data => {

            if (!data.success) {

                bookingList.innerHTML =
                    `<p class="empty">${data.message || "ไม่พบรายการ"}</p>`;
                return;
            }

            allBookings = data.bookings || [];

            updateCounts();
            renderList(currentStatus);
        })
        .catch(() => {

            bookingList.innerHTML =
                `<p class="empty">โหลดข้อมูลไม่สำเร็จ</p>`;
        });
}

/* ===============================
   COUNT STATUS
================================ */

function updateCounts(): void {

    const counts: any = {};

    allBookings.forEach(b => {
        counts[b.status_code] =
            (counts[b.status_code] || 0) + 1;
    });

    document.querySelectorAll("span[id^='count-']")
        .forEach(el => {

            const code =
                el.id.replace("count-", "");

            el.textContent =
                (counts[code] || 0).toString();
        });
}

/* ===============================
   RENDER LIST
================================ */

function renderList(status: string): void {

    currentStatus = status;

    const list =
        allBookings.filter(b => b.status_code === status);

    if (list.length === 0) {

        bookingList.innerHTML =
            `<p class="empty">ไม่มีรายการ</p>`;
        return;
    }

    let html = "";

    list.forEach(b => {

        let badge = "waiting";
        let text = "รออนุมัติ";

        if (status === "CONFIRMED_WAITING_PICKUP") {
            badge = "ready";
            text = "รอรับอุปกรณ์";
        }

        if (status === "IN_USE") {
            badge = "active";
            text = "กำลังใช้งาน";
        }

        html += `
            <div class="booking-card">

                <div class="booking-info">

                    <span class="status ${badge}">
                        ${text}
                    </span>

                    <h4>รหัสการจอง: ${b.booking_id}</h4>

                    <p>
                        รับ: ${b.pickup_time}<br>
                        คืน: ${b.due_return_time}
                    </p>

                    <p>
                        <strong>${b.net_amount} บาท</strong>
                    </p>

                </div>

                <div class="booking-actions">

                    <a class="btn-outline"
                       href="booking-detail.html?code=${b.booking_id}">
                        ดูรายละเอียด
                    </a>

                    ${status === "WAITING_STAFF"
                ? `<button class="btn-cancel"
                            data-code="${b.booking_id}">
                        ยกเลิก
                   </button>`
                : ""}

                </div>

            </div>
        `;
    });

    bookingList.innerHTML = html;

    bindCancelButtons();
}

/* ===============================
   TAB CLICK
================================ */

function bindTabs(): void {

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const status =
                tab.dataset.status;

            if (status) {
                renderList(status);
            }
        });
    });
}

/* ===============================
   CANCEL FLOW
================================ */

function bindCancelButtons(): void {

    document.querySelectorAll(".btn-cancel")
        .forEach(btn => {

            btn.addEventListener("click", () => {

                selectedCancelCode =
                    btn.getAttribute("data-code");

                if (!selectedCancelCode) return;

                showModal(confirmModal);
            });
        });
}

/* ===============================
   STEP 1: CHECK REFUND
================================ */

function checkRefundInfo(): void {

    fetch("/sports_rental_system/customer/api/get_refund_info.php", {
        credentials: "include"
    })
        .then(res => res.json())
        .then(res => {

            hideModal(confirmModal);

            if (!res.hasRefund) {

                showModal(refundModal);

            } else {

                renderRefundPreview(
                    res.bank,
                    res.account,
                    res.name
                );

                showModal(finalModal);
            }
        });
}

/* ===============================
   SAVE REFUND INFO
================================ */

function saveRefundInfo(): void {

    const bank =
        (document.getElementById("refundBank") as HTMLSelectElement).value;

    const account =
        (document.getElementById("refundAccount") as HTMLInputElement).value;

    const name =
        (document.getElementById("refundName") as HTMLInputElement).value;

    if (!bank || !account || !name) {

        alert("กรุณากรอกข้อมูลบัญชีให้ครบ");
        return;
    }

    fetch("/sports_rental_system/customer/api/save_refund_info.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            bank,
            account,
            name
        })
    })
        .then(r => r.json())
        .then(res => {

            if (!res.success) {

                alert(res.message || "บันทึกไม่สำเร็จ");
                return;
            }

            hideModal(refundModal);

            renderRefundPreview(bank, account, name);

            showModal(finalModal);
        });
}

/* ===============================
   FINAL CANCEL
================================ */

function submitCancel(): void {

    if (!selectedCancelCode) return;

    const reason =
        (document.getElementById("cancelReason") as HTMLTextAreaElement).value;

    if (!reason.trim()) {

        alert("กรุณากรอกเหตุผล");
        return;
    }

    fetch("/sports_rental_system/customer/api/cancel_bookings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            booking_id: selectedCancelCode,
            reason
        })
    })
        .then(r => r.json())
        .then(res => {

            alert(res.message || "ยกเลิกเรียบร้อย");

            closeAllModals();
            fetchBookings();
        })
        .catch(() => {

            alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        });
}

/* ===============================
   PREVIEW
================================ */

function renderRefundPreview(
    bank: string,
    account: string,
    name: string
): void {

    (document.getElementById("previewBank") as HTMLElement)
        .textContent = bank;

    (document.getElementById("previewAccount") as HTMLElement)
        .textContent = "****" + account.slice(-4);

    (document.getElementById("previewName") as HTMLElement)
        .textContent = name;
}

/* ===============================
   MODAL UTILS
================================ */

function showModal(el: HTMLElement) {
    el.classList.remove("hidden");
}

function hideModal(el: HTMLElement) {
    el.classList.add("hidden");
}

function closeAllModals() {

    [confirmModal, refundModal, finalModal]
        .forEach(m => m.classList.add("hidden"));
}

/* ===============================
   PROFILE POINTS
================================ */

function loadProfilePoints(): void {

    fetch("/sports_rental_system/customer/api/get_profile.php", {
        credentials: "include"
    })
        .then(res => res.json())
        .then(data => {

            const pointEl =
                document.getElementById("topPoints");

            if (pointEl && data.points !== undefined) {

                pointEl.textContent =
                    `⭐ ${data.points} คะแนน`;
            }
        });
}
