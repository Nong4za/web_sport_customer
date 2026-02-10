console.log("🔥 STAFF CONFIRM TS READY 🔥");

/* ===============================
GLOBAL
================================ */

let equipmentTotal = 0;
let fieldTotal = 0;
let extraHourFee = 0;

let selectedBranchId: string | null = null;

const BASE_HOURS = 3;

/* ===============================
INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {

	loadBranch();
	loadBookingInfo();
	loadCustomerInfo();

	renderItems();
	calcTotals();

	bindSubmit();
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
LOAD CUSTOMER
================================ */

function loadCustomerInfo(): void {

	setText(
		"cId",
		localStorage.getItem("customer_id") || "-"
	);

	setText(
		"cName",
		localStorage.getItem("customer_name") || "-"
	);
	setText(
		"cPhone",
		localStorage.getItem("customer_phone") || "-"
	);
	setText(
		"cFaculty",
		localStorage.getItem("customer_faculty") || "-"
	);
	setText(
		"cYear",
		localStorage.getItem("customer_year") || "-"
	);
}

/* ===============================
BOOKING INFO
================================ */

function loadBookingInfo(): void {

	const date = localStorage.getItem("rentDate");
	const time = localStorage.getItem("timeSlot");
	const hours = Number(localStorage.getItem("rentHours") || 1);

	setText("confirmDate", date || "-");

	if (time && hours) {

		const s = Number(time);
		const e = s + hours;

		setText(
			"confirmTime",
			`${pad(s)}:00 - ${pad(e)}:00`
		);
	}

	setText("confirmHours", hours.toString());
}

/* ===============================
ITEMS
================================ */

function renderItems(): void {

	const box =
		document.getElementById("confirmItems");

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
				<small>
					${isField(item.type)
				? "สนาม"
				: "รหัสอุปกรณ์: " + (item.instance_code || "-")}
				</small>
			</div>

			<div class="confirm-item-qty">
				x<strong>${qty}</strong>
			</div>

			<div class="confirm-item-price">
				<div class="per-hour">
					${perHourTotal} บาท / ชม.
				</div>
				<strong>
					${perHourTotal} × ${hours}
					= ${total} บาท
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

	setText("equipmentTotal", equipmentTotal + " บาท");
	setText("fieldTotal", fieldTotal + " บาท");
	setText("extraHourFee", extraHourFee + " บาท");
	setText("netTotal", gross + " บาท");

	setText(
		"earnPoints",
		Math.floor(gross / 100).toString()
	);
}

/* ===============================
SUBMIT
================================ */

function bindSubmit(): void {

	document
		.getElementById("payBtn")
		?.addEventListener("click", () => {

			const ok = confirm(
				"ยืนยันการสร้างรายการจอง และไปหน้าชำระเงินหรือไม่?"
			);

			if (!ok) return;

			const branchId =
				localStorage.getItem("branchId");

			const customerId =
				localStorage.getItem("customer_id");

			if (!branchId || !customerId) {

				alert("❌ ข้อมูลไม่ครบ");
				return;
			}

			let rawDate =
				localStorage.getItem("rentDate");

			if (rawDate && rawDate.indexOf("/") !== -1) {

				const p = rawDate.split("/");

				rawDate =
					p[2] + "-" +
					p[1] + "-" +
					p[0];
			}

			const timeSlotRaw =
				localStorage.getItem("timeSlot");

			if (!rawDate || !timeSlotRaw) {
				alert("❌ วันหรือเวลาไม่ครบ");
				return;
			}

			const payload = {
				branchId,
				customerId,
				rentDate: rawDate,
				timeSlot: Number(timeSlotRaw),
				rentHours: Number(
					localStorage.getItem("rentHours") || 1
				),
				cart: getCart()
			};

			console.log(
				"🚀 STAFF CREATE BOOKING =>",
				payload
			);

			fetch(
				"/sports_rental_system/staff/api/create_booking.php",
				{
					method: "POST",
					headers: {
						"Content-Type":
							"application/json"
					},
					credentials: "include",
					body: JSON.stringify(payload)
				}
			)
				.then(r => r.json())
				.then((data: any) => {

					if (!data.success) {

						alert(
							"❌ สร้างการจองไม่ได้: " +
							data.message
						);
						return;
					}

					window.location.href =
						`payment.html?code=${data.booking_code}`;
				})
				.catch(err => {

					console.error(err);

					alert(
						"❌ เกิดข้อผิดพลาดกับเซิร์ฟเวอร์"
					);
				});
		});
}

/* ===============================
UTILS
================================ */

function getCart(): any[] {

	const raw =
		localStorage.getItem("cart");

	return raw ? JSON.parse(raw) : [];
}

function pad(n: number): string {

	return n < 10 ? "0" + n : n.toString();
}

function setText(
	id: string,
	value: string
): void {

	const el =
		document.getElementById(id);

	if (el) el.textContent = value;
}

function isField(type: string): boolean {

	return (
		type === "field" ||
		type === "สนาม"
	);
}
