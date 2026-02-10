console.log("🔥 STAFF BOOKINGS TS READY 🔥");

interface Booking {
    booking_id: string;
    pickup_time: string;
    due_return_time: string;
    net_amount: number;
    status_code: string;
    customer_name: string;
}

/* ================= DOM ================= */

const bookingList =
    document.getElementById("bookingList") as HTMLElement;

const tabs =
    document.querySelectorAll(".status-tab") as NodeListOf<HTMLButtonElement>;

/* ================= STATE ================= */

let allBookings: Booking[] = [];
let currentStatus = "WAITING_STAFF";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    fetchBookings();
    bindTabs();
});

/* ================= FETCH ================= */

function fetchBookings(): void {

    bookingList.innerHTML =
        `<p class="loading">กำลังโหลด...</p>`;

    fetch("/sports_rental_system/staff/api/get_bookings.php", {
        credentials: "include"
    })
        .then(r => r.json())
        .then(res => {

            if (!res.success) {

                bookingList.innerHTML =
                    `<p class="empty">${res.message || "ไม่พบข้อมูล"}</p>`;
                return;
            }

            allBookings = res.bookings || [];

            updateCounts();
            renderList(currentStatus);
        })
        .catch(err => {

            console.error(err);

            bookingList.innerHTML =
                `<p class="empty">โหลดข้อมูลไม่สำเร็จ</p>`;
        });
}

/* ================= COUNT ================= */

function updateCounts(): void {

    const counts: any = {};

    allBookings.forEach(b => {
        counts[b.status_code] =
            (counts[b.status_code] || 0) + 1;
    });

    document
        .querySelectorAll("span[id^='count-']")
        .forEach(el => {

            const code =
                el.id.replace("count-", "");

            el.textContent =
                (counts[code] || 0).toString();
        });
}

/* ================= RENDER ================= */

function renderList(status: string): void {

    currentStatus = status;

    const list =
        allBookings.filter(
            b => b.status_code === status
        );

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
                        ลูกค้า: ${b.customer_name}<br>
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

                </div>

            </div>
        `;
    });

    bookingList.innerHTML = html;
}

/* ================= TABS ================= */

function bindTabs(): void {

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            tabs.forEach(t =>
                t.classList.remove("active")
            );

            tab.classList.add("active");

            const status =
                tab.dataset.status;

            if (status) {
                renderList(status);
            }
        });
    });
}
