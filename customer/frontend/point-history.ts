interface PointHistoryItem {
    history_id: number;
    booking_id: string;
    type: string; // earn | redeem
    amount: number;
    description: string;
}

interface PointHistoryResponse {
    success: boolean;
    points?: PointHistoryItem[];
    items?: PointHistoryItem[];
}

const loading = document.getElementById("loading");
const box = document.getElementById("historyBox");
const list = document.getElementById("pointList");

// ============================
// POINT HISTORY
// ============================

fetch("/sports_rental_system/customer/api/get_point_history.php", {
    credentials: "include"
})
    .then(res => res.json())
    .then((res: PointHistoryResponse) => {

        console.log("POINT HISTORY RESPONSE:", res);

        if (loading) loading.style.display = "none";

        if (!res || res.success !== true) {
            showEmpty("ไม่พบข้อมูลประวัติแต้ม");
            return;
        }

        // รองรับทั้ง points และ items
        const data =
            Array.isArray(res.points) ? res.points :
            Array.isArray(res.items) ? res.items :
            [];

        if (data.length === 0) {
            showEmpty("ยังไม่มีประวัติแต้ม");
            return;
        }

        if (box) box.classList.remove("hidden");

        renderPoints(data);
    })
    .catch(err => {
        console.error("Error loading point history:", err);
        if (loading) loading.style.display = "none";
        showEmpty("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    });


// ============================
// PROFILE
// ============================

fetch("/sports_rental_system/customer/api/get_profile.php", {
    credentials: "include"
})
    .then(res => res.json())
    .then(data => {
        const pointEl = document.getElementById("topPoints");

        if (pointEl && data && data.points !== undefined) {
            pointEl.textContent = `⭐ ${data.points} คะแนน`;
        }
    })
    .catch(err => {
        console.error("Error loading profile:", err);
    });


// ============================
// RENDER FUNCTION
// ============================

function renderPoints(items: PointHistoryItem[]) {

    if (!list) return;

    list.innerHTML = "";

    items.forEach(p => {

        const div = document.createElement("div");
        div.className = "item";

        const isPlus = Number(p.amount) > 0;
        const sign = isPlus ? "+" : "";

        div.innerHTML = `
            <div class="left ${isPlus ? 'text-plus' : 'text-minus'}">
                <div class="title">${p.description || "-"}</div>
                <div class="ref">รหัสการเช่า: ${p.booking_id || "-"}</div>
            </div>

            <div class="right ${isPlus ? 'point-plus' : 'point-minus'}">
                ${sign}${p.amount}
            </div>
        `;

        list.appendChild(div);
    });
}


// ============================
// EMPTY STATE
// ============================

function showEmpty(message: string) {

    if (!box || !list) return;

    box.classList.remove("hidden");
    list.innerHTML = `
        <div class="empty">
            ${message}
        </div>
    `;
}
