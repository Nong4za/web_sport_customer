console.log("🔥 CONFIRM TS VERSION OK 🔥");

let equipmentTotal = 0;
let fieldTotal = 0;
let extraHourFee = 0;

let selectedBranchId: string | null = null;

const BASE_HOURS = 3;

document.addEventListener("DOMContentLoaded", () => {
	loadBookingInfo();
	renderItems();
	calcTotals();
	bindSubmit();
	loadBranch();
});

/* ===============================
   LOAD BRANCH
================================ */

function loadBranch(): void {

	fetch("/sports_rental_system/staff/api/get_selected_branch.php")
		.then(res => res.json())
		.then(res => {

			if (!res || res.success === false) {
				window.location.href = "branches.html";
				return;
			}

			const data = res.data ?? res;

			selectedBranchId = data.branch_id;

			localStorage.setItem("branchId", data.branch_id);
		});
}


/* ===============================
   BOOKING INFO
================================ */

function loadBookingInfo(): void {

	const date = localStorage.getItem("rentDate");
	const time = localStorage.getItem("timeSlot");
	const hours = Number(localStorage.getItem("rentHours") || 1);

	const dateEl = document.getElementById("confirmDate");
	if (dateEl) dateEl.textContent = date || "-";

	const timeEl = document.getElementById("confirmTime");

	if (timeEl && time && hours) {

		const s = Number(time);
		const e = s + hours;

		timeEl.textContent = `${pad(s)}:00 - ${pad(e)}:00`;
	}

	const hoursEl = document.getElementById("confirmHours");
	if (hoursEl) hoursEl.textContent = hours.toString();
}

/* ===============================
   ITEMS
================================ */

function renderItems(): void {

	const box = document.getElementById("confirmItems");
	if (!box) return;

	const cart = getCart();
	const hours = Number(localStorage.getItem("rentHours") || 1);

	box.innerHTML = "";

	cart.forEach((item: any) => {

		const price = Number(item.price || 0);
		const qty = Number(item.qty || 1);

		const perHourTotal = price * qty;
		const total = perHourTotal * hours;

		const row = document.createElement("div");
		row.className = "confirm-item";

		const imgHtml =
			item.image && item.image !== "null"
				? `<img src="${item.image.trim()}" alt="">`
				: "";

		row.innerHTML = `
            ${imgHtml}

            <div class="confirm-item-info">
                <h4>${item.name}</h4>
                <small>${isField(item.type) ? "สนาม" : "อุปกรณ์"}</small>
            </div>

            <div class="confirm-item-qty">
                x<strong>${qty}</strong>
            </div>

            <div class="confirm-item-price">
                <div class="per-hour">
                    ${perHourTotal} บาท / ชม.
                </div>
                <strong>
                    ${perHourTotal} × ${hours} = ${total} บาท
                </strong>
            </div>
        `;

		box.appendChild(row);
	});
}


/* ===============================
   TOTAL CALC
================================ */

function calcTotals(): void {

	equipmentTotal = 0;
	fieldTotal = 0;

	const cart = getCart();
	const hours = Number(localStorage.getItem("rentHours") || 1);

	cart.forEach((i: any) => {

		const price = Number(i.price || 0);
		const qty = Number(i.qty || 1);

		const subtotal =
			price *
			qty *
			hours;

		if (isField(i.type)) {
			fieldTotal += subtotal;
		} else {
			equipmentTotal += subtotal;
		}
	});

	extraHourFee = calcExtraHourFee(hours);

	updateTotals();
}

function calcExtraHourFee(hours: number): number {

	if (hours <= 3) return 0;
	if (hours === 4) return 100;
	if (hours === 5) return 200;
	if (hours >= 6) return 300;

	return 0;
}

/* ===============================
   UPDATE TOTAL UI
================================ */

function updateTotals(): void {

	const gross =
		equipmentTotal +
		fieldTotal +
		extraHourFee;

	const net = gross;

	setText("equipmentTotal", equipmentTotal + " บาท");
	setText("fieldTotal", fieldTotal + " บาท");
	setText("extraHourFee", extraHourFee + " บาท");
	setText("netTotal", net + " บาท");
	setText("earnPoints", Math.floor(net / 100).toString());

}

/* ===============================
   SUBMIT
================================ */

function bindSubmit(): void {

	document.getElementById("payBtn")
		?.addEventListener("click", () => {

			const ok = confirm(
				"เมื่อกดยืนยัน ระบบจะทำการจองรายการ และให้ดำเนินการชำระเงินทันที\n\nต้องการดำเนินการต่อหรือไม่?"
			);

			if (!ok) return;

			const branchId = localStorage.getItem("branchId");

			if (!branchId) {
				alert("❌ กรุณาเลือกสาขาก่อนทำการจอง");
				window.location.href = "branches.html";
				return;
			}

			let rawDate = localStorage.getItem("rentDate");

			if (rawDate && rawDate.indexOf("/") !== -1) {
				const parts = rawDate.split("/");
				rawDate =
					parts[2] + "-" +
					parts[1] + "-" +
					parts[0];
			}

			const timeSlotRaw = localStorage.getItem("timeSlot");

			if (!rawDate || !timeSlotRaw) {
				alert("❌ ข้อมูลวันหรือเวลาไม่ครบ");
				return;
			}

			const payload = {
				branchId,
				rentDate: rawDate,
				timeSlot: Number(timeSlotRaw),
				rentHours: Number(localStorage.getItem("rentHours") || 1),
				cart: getCart()
			};

			console.log("🚀 CREATE BOOKING PAYLOAD =>", payload);

			fetch("/sports_rental_system/staff/api/create_booking.php", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include",
				body: JSON.stringify(payload)
			})
				.then(r => r.json())
				.then((data: any) => {

					if (!data.success) {
						alert("❌ ไม่สามารถสร้างการจองได้: " + data.message);
						return;
					}

					window.location.href =
						`payment.html?code=${data.booking_code}`;
				})
				.catch(err => {

					console.error(err);
					alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
				});
		});
}

/* ===============================
   UTILS
================================ */

function getCart(): any[] {

	const raw = localStorage.getItem("cart");

	return raw ? JSON.parse(raw) : [];
}

function pad(n: number): string {

	return n < 10 ? "0" + n : n.toString();
}

function setText(id: string, value: string): void {

	const el = document.getElementById(id);
	if (el) el.textContent = value;
}

function isField(type: string): boolean {

	return (
		type === "field" ||
		type === "สนาม"
	);
}