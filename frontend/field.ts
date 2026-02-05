document.addEventListener("DOMContentLoaded", () => {

  console.log("field.ts loaded");

  updateCartCount();

  // ============================
  // STATE
  // ============================

  let selectedBranchId: string | null = null;
  let selectedCategories: string[] = [];
  let searchKeyword = "";

  // ============================
  // ELEMENTS
  // ============================

  const branchLabel =
    document.getElementById("selectedBranch") as HTMLElement | null;

  const timeSlot =
    document.getElementById("timeSlot") as HTMLSelectElement | null;

  const hourInput =
    document.getElementById("rentHours") as HTMLInputElement | null;

  const dateInput =
    document.getElementById("rentDate") as HTMLInputElement | null;

  const categoryBox =
    document.getElementById("categoryList") as HTMLElement | null;

  const venueGrid =
    document.getElementById("venueGrid") as HTMLElement | null;

  const searchInput =
    document.getElementById("searchInput") as HTMLInputElement | null;

  // ===== PRICE RANGE ======

  const minPriceInput =
    document.getElementById("minPriceInput") as HTMLInputElement | null;

  const maxPriceInput =
    document.getElementById("maxPriceInput") as HTMLInputElement | null;

  const priceMinRange =
    document.getElementById("priceMin") as HTMLInputElement | null;

  const priceMaxRange =
    document.getElementById("priceMax") as HTMLInputElement | null;

// ============================
// RESET FILTERS
// ============================
  const resetBtn =
  document.getElementById("resetFilters") as HTMLButtonElement | null;

  // RESET BUTTON CLICK
  resetBtn?.addEventListener("click", () => {

  console.log("RESET FILTERS");

  // ===== STATE =====
  selectedCategories = [];
  searchKeyword = "";

  // ===== DATE / TIME / HOURS =====
  if (dateInput) dateInput.value = "";
  if (timeSlot) timeSlot.value = "";
  if (hourInput) hourInput.value = "";

  document
    .querySelectorAll(".duration-btn")
    .forEach(b => b.classList.remove("active"));

  // ===== CATEGORY =====
  categoryBox
    ?.querySelectorAll<HTMLInputElement>(
      "input[type=checkbox]"
    )
    .forEach(cb => (cb.checked = false));

  // ===== PRICE =====
  const defaultMin =
    priceMinRange?.min || "0";

  const defaultMax =
    priceMaxRange?.max || "5000";

  if (minPriceInput) minPriceInput.value = defaultMin;
  if (maxPriceInput) maxPriceInput.value = defaultMax;

  if (priceMinRange) priceMinRange.value = defaultMin;
  if (priceMaxRange) priceMaxRange.value = defaultMax;

  // ===== SEARCH =====
  if (searchInput) searchInput.value = "";

  // ===== STORAGE =====
  localStorage.removeItem("rentDate");
  localStorage.removeItem("timeSlot");
  localStorage.removeItem("rentHours");
  localStorage.removeItem("minPrice");
  localStorage.removeItem("maxPrice");

  // // ถ้าอยาก clear field ใน cart ด้วย
  // clearFieldInCart();
  // ===== reload =====
  loadVenues();

});


  // ============================
  // RESTORE
  // ============================

  const savedDate =
    localStorage.getItem("rentDate");

  const savedTime =
    localStorage.getItem("timeSlot");

  const savedHours =
    localStorage.getItem("rentHours");

  const savedMin = localStorage.getItem("minPrice");
  const savedMax = localStorage.getItem("maxPrice");;

  if (savedDate && dateInput)
    dateInput.value = savedDate;

  if (savedHours && hourInput) {

    hourInput.value = savedHours;

    document
      .querySelectorAll(".duration-btn")
      .forEach(b => b.classList.remove("active"));

    document
      .querySelector(
        `.duration-btn[data-hour="${savedHours}"]`
      )
      ?.classList.add("active");
  }


  if (savedMin && minPriceInput && priceMinRange) {
    minPriceInput.value = savedMin;
    priceMinRange.value = savedMin;
  }

  if (savedMax && maxPriceInput && priceMaxRange) {
    maxPriceInput.value = savedMax;
    priceMaxRange.value = savedMax;
  }


  // ============================
  // SAVE DATE / TIME
  // ============================

  dateInput?.addEventListener("change", () => {

    localStorage.setItem(
      "rentDate",
      dateInput.value
    );

    loadVenues();
  });

  timeSlot?.addEventListener("change", () => {

    localStorage.setItem(
      "timeSlot",
      timeSlot.value
    );

    loadVenues();
  });

  // ============================
  // DURATION BUTTONS
  // ============================

  document
    .querySelectorAll<HTMLButtonElement>(".duration-btn")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        document
          .querySelectorAll(".duration-btn")
          .forEach(b =>
            b.classList.remove("active")
          );

        btn.classList.add("active");

        const h =
          btn.dataset.hour || "3";

        if (hourInput)
          hourInput.value = h;

        localStorage.setItem(
          "rentHours",
          h
        );

        loadVenues();
      });

    });

  // ============================
  // PRICE SYNC
  // ============================


  function syncPrice() {

    if (
      !minPriceInput ||
      !maxPriceInput ||
      !priceMinRange ||
      !priceMaxRange
    ) return;

    let min = Number(priceMinRange.value);
    let max = Number(priceMaxRange.value);

    if (min > max) min = max;

    minPriceInput.value = min.toString();
    maxPriceInput.value = max.toString();

    localStorage.setItem("minPrice", min.toString());
    localStorage.setItem("maxPrice", max.toString());

    loadVenues();
  }

  priceMinRange?.addEventListener("input", syncPrice);
  priceMaxRange?.addEventListener("input", syncPrice);

  minPriceInput?.addEventListener("change", () => {
    if (priceMinRange)
      priceMinRange.value = minPriceInput.value;

    syncPrice();
  });

  maxPriceInput?.addEventListener("change", () => {
    if (priceMaxRange)
      priceMaxRange.value = maxPriceInput.value;

    syncPrice();
  });



  // ============================
  // LOAD BRANCH
  // ============================

  fetch("/sports_rental_system/api/get_selected_branch.php")
    .then(res => res.json())
    .then(res => {

      if (!res || res.success === false) {
        window.location.href = "branches.html";
        return;
      }

      const data = res.data ?? res;

      selectedBranchId = data.branch_id;

      if (branchLabel)
        branchLabel.textContent = data.name;

      if (timeSlot) {

        (timeSlot as any).dataset.open = data.open_time;
        (timeSlot as any).dataset.close = data.close_time;

        generateTimeSlots(
          data.open_time,
          data.close_time
        );

        if (savedTime)
          timeSlot.value = savedTime;

      }

      loadVenues();

    });

  // ============================
  // SEARCH
  // ============================

  searchInput?.addEventListener("input", () => {

    searchKeyword =
      searchInput.value.trim();

    loadVenues();

  });
  // ============================
  // LOAD CATEGORIES
  // ============================

  fetch("/sports_rental_system/api/get_categories.php")
    .then(res => res.json())
    .then(res => {

      if (!res.success || !categoryBox)
        return;

      categoryBox.innerHTML = "";

      res.data.forEach((cat: any) => {

        const label =
          document.createElement("label");

        label.innerHTML = `
          <input type="checkbox" value="${cat.category_id}">
          <span>${cat.name}</span>
        `;

        const checkbox =
          label.querySelector("input")!;

        checkbox.addEventListener("change", () => {

          const id =
            checkbox.value;

          if (checkbox.checked) {
            selectedCategories.push(id);
          } else {
            selectedCategories =
              selectedCategories.filter(
                c => c !== id
              );
          }

          loadVenues();
        });

        categoryBox.appendChild(label);

      });

    });


  // ============================
  // PROFILE
  // ============================

  fetch("/sports_rental_system/api/get_profile.php")
    .then(res => res.json())
    .then(data => {

      const pointEl =
        document.getElementById("topPoints");

      if (pointEl && data.points !== undefined) {
        pointEl.textContent =
          `⭐ ${data.points} คะแนน`;
      }

    });


  // ============================
  // LOAD VENUES (ROBUST)
  // ============================

  function loadVenues() {

    if (!selectedBranchId || !venueGrid) return;

    const date = dateInput?.value || "";
    const time = timeSlot?.value || "";
    const hours = hourInput?.value || "3";

    venueGrid.innerHTML =
      `<p class="loading-text">กำลังโหลดสนาม...</p>`;

    const venueParams = new URLSearchParams();

    venueParams.set("branch_id", selectedBranchId);

    if (selectedCategories.length > 0)
      venueParams.set(
        "categories",
        selectedCategories.join(",")
      );
    
    if (minPriceInput?.value)
      venueParams.set("min_price", minPriceInput.value);

    if (maxPriceInput?.value)
      venueParams.set("max_price", maxPriceInput.value);

    if (searchKeyword !== "")
      venueParams.set("q", searchKeyword);

    fetch(
      "/sports_rental_system/api/get_venues.php?" +
      venueParams.toString()
    )
      .then(r => r.json())
      .then(venueRes => {

        const availParams = new URLSearchParams();
        availParams.set("branch_id", selectedBranchId!);
        availParams.set("date", date);
        availParams.set("time", time);
        availParams.set("hours", hours);

        fetch(
          "/sports_rental_system/api/get_available_venues.php?" +
          availParams.toString()
        )
          .then(r => r.json())
          .catch(() => ({}))
          .then(availRes => {

            console.log("AVAILABLE API:", availRes);

            venueGrid.innerHTML = "";

            let unavailable: any[] = [];

            if (availRes) {

              if (availRes.unavailable_ids)
                unavailable = availRes.unavailable_ids;

              else if (availRes.data)
                unavailable = availRes.data;

              else if (Array.isArray(availRes))
                unavailable = availRes;

            }

            if (!venueRes || !venueRes.data) {
              venueGrid.innerHTML = "<p>โหลดสนามไม่สำเร็จ</p>";
              return;
            }

            for (let i = 0; i < venueRes.data.length; i++) {

              const item = venueRes.data[i];

              let disabled = false;

              for (let j = 0; j < unavailable.length; j++) {
                if (
                  String(unavailable[j]) ===
                  String(item.venue_id)
                ) {
                  disabled = true;
                  break;
                }
              }

              const qty =
                getFieldQty(item.venue_id);

              const card =
                document.createElement("div");

              card.className = "equipment-card";

              const img =
                item.image_url && item.image_url !== ""
                  ? item.image_url
                  : "images/no-image.png";

              card.innerHTML = `
                <img src="${img}">
                <h5 class="name">${item.name}</h5>
                <p class="price">${item.price_per_hour} บาท / ชม.</p>

                <div class="card-qty-controls">
                  <button class="qty-minus" ${disabled ? "disabled" : ""}>−</button>
                  <span class="qty-num">${qty}</span>
                  <button class="qty-plus" ${disabled ? "disabled" : ""}>+</button>
                </div>

                ${disabled
                  ? `<div class="overlay-disabled">ไม่ว่างในช่วงเวลานี้</div>`
                  : ""
                }
              `;

              if (disabled) card.classList.add("disabled");
              if (qty > 0) card.classList.add("selected");

              if (!disabled) {

                const plusBtn =
                  card.querySelector(".qty-plus")!;

                const minusBtn =
                  card.querySelector(".qty-minus")!;

                plusBtn.addEventListener("click", () => {

                  if (!date || !time || !hours) {
                    alert("กรุณาเลือกวันที่ เวลา และจำนวนชั่วโมงก่อน");
                    return;
                  }

                  increaseField(item, date, time, hours);
                  updateFieldCard(card, item.venue_id);

                });

                minusBtn.addEventListener("click", () => {

                  decreaseField(item);
                  updateFieldCard(card, item.venue_id);

                });

              }

              venueGrid.appendChild(card);

            }

          });

      });

  }


/* ===================================================
  CART HELPERS
=================================================== */

function getCart(): any[] {

  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }

}

function clearFieldInCart() {

  const cart = getCart()
    .filter(i => i.type !== "field");

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();

}

function getFieldQty(id: string | number): number {

  const cart = getCart();

  for (let i = 0; i < cart.length; i++) {

    if (
      cart[i].type === "field" &&
      String(cart[i].id) === String(id)
    ) {
      return cart[i].qty;
    }

  }

  return 0;

}

function increaseField(
  field: any,
  date: string,
  time: string,
  hours: string
) {

  const cart = getCart();

  for (let i = 0; i < cart.length; i++) {

    if (
      cart[i].type === "field" &&
      String(cart[i].id) ===
      String(field.venue_id)
    ) {
      alert("สนามนี้เลือกได้เพียง 1 สนามเท่านั้น");
      return;
    }

  }

  cart.push({
    id: String(field.venue_id),
    type: "field",
    name: field.name,
    price: field.price_per_hour,
    qty: 1,
    image: field.image_url,
    date,
    time,
    hours
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();

}

function decreaseField(field: any) {

  const cart = getCart();

  for (let i = 0; i < cart.length; i++) {

    if (
      cart[i].type === "field" &&
      String(cart[i].id) ===
      String(field.venue_id)
    ) {

      cart.splice(i, 1);
      break;
    }

  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();

}

function updateFieldCard(
  card: HTMLElement,
  id: string | number
) {

  const qty = getFieldQty(id);

  const qtyText =
    card.querySelector(".qty-num")!;

  qtyText.textContent = qty.toString();

  if (qty > 0)
    card.classList.add("selected");
  else
    card.classList.remove("selected");

}

function updateCartCount() {

  const badge =
    document.getElementById("cartCount");

  if (!badge) return;

  const cart = getCart();

  let total = 0;

  for (let i = 0; i < cart.length; i++) {
    total += Number(cart[i].qty) || 0;
  }

  badge.textContent = total.toString();

}

// ===============================
// GENERATE TIME SLOTS
// ===============================


function generateTimeSlots(
  openTime: string,
  closeTime: string
) {

  const select =
    document.getElementById(
      "timeSlot"
    ) as HTMLSelectElement | null;

  if (!select)
    return;

  select.innerHTML =
    `<option value="">
      เลือกเวลา
    </option>`;

  const openHour =
    parseInt(
      openTime.split(":")[0]
    );

  const closeHour =
    parseInt(
      closeTime.split(":")[0]
    );

  const lastStartHour =
    closeHour - 3;

  for (
    let h = openHour;
    h <= lastStartHour;
    h++
  ) {

    const hour =
      h < 10
        ? "0" + h
        : h.toString();

    const opt =
      document.createElement(
        "option"
      );

    opt.value = hour;

    opt.textContent =
      `${hour}:00 น.`;

    select.appendChild(opt);

  }

}
});