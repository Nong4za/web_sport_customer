document.addEventListener("DOMContentLoaded", () => {

  console.log("index.ts loaded");

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

  const equipmentGrid =
    document.getElementById("equipmentGrid") as HTMLElement | null;

  const searchInput =
    document.getElementById("searchInput") as HTMLInputElement | null;

  const minPriceInput =
    document.getElementById("minPriceInput") as HTMLInputElement | null;

  const maxPriceInput =
    document.getElementById("maxPriceInput") as HTMLInputElement | null;

  const priceMinRange =
    document.getElementById("priceMin") as HTMLInputElement | null;

  const priceMaxRange =
    document.getElementById("priceMax") as HTMLInputElement | null;

  // ============================
  // RESTORE SHARED STATE
  // ============================

  fetch("/sports_rental_system/api/get_profile.php")
    .then(res => res.json())
    .then((data: any) => {

      console.log("user data:", data);

      const pointEl =
        document.getElementById("topPoints") as HTMLElement | null;

      if (pointEl && data.points !== undefined) {
        pointEl.textContent = `⭐ ${data.points} คะแนน`;
      }

    })
    .catch(err => {
      console.error("user fetch error:", err);
    });

  const savedDate = localStorage.getItem("rentDate");
  const savedTime = localStorage.getItem("timeSlot");
  const savedHours = localStorage.getItem("rentHours");
  const savedMin = localStorage.getItem("minPrice");
  const savedMax = localStorage.getItem("maxPrice");

  if (savedDate && dateInput) {
    dateInput.value = savedDate;
  }

  if (savedHours && hourInput) {

    hourInput.value = savedHours;

    document.querySelectorAll(".duration-btn")
      .forEach(b => b.classList.remove("active"));

    document.querySelector(
      `.duration-btn[data-hour="${savedHours}"]`
    )?.classList.add("active");
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

      if (branchLabel) {
        branchLabel.textContent = data.name;
      }

      if (timeSlot) {

        generateTimeSlots(
          data.open_time,
          data.close_time
        );

        // restore AFTER generate
        if (savedTime) {
          timeSlot.value = savedTime;
        }
      }

      loadEquipment();

    });

  // ============================
  // SAVE DATE / TIME
  // ============================

  dateInput?.addEventListener("change", () => {
    localStorage.setItem("rentDate", dateInput.value);
  });

  timeSlot?.addEventListener("change", () => {
    localStorage.setItem("timeSlot", timeSlot.value);
  });

  // ============================
  // DURATION
  // ============================

  document.querySelectorAll<HTMLButtonElement>(".duration-btn")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        document.querySelectorAll(".duration-btn")
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const h = btn.dataset.hour || "3";

        if (hourInput) hourInput.value = h;

        localStorage.setItem("rentHours", h);

      });

    });

  // ============================
  // SEARCH
  // ============================

  searchInput?.addEventListener("input", () => {

    searchKeyword = searchInput.value.trim();

    loadEquipment();

  });

  // ============================
  // PRICE SYNC + SAVE
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

    loadEquipment();
  }

  priceMinRange?.addEventListener("input", syncPrice);
  priceMaxRange?.addEventListener("input", syncPrice);

  minPriceInput?.addEventListener("change", () => {
    if (priceMinRange) priceMinRange.value = minPriceInput.value;
    syncPrice();
  });

  maxPriceInput?.addEventListener("change", () => {
    if (priceMaxRange) priceMaxRange.value = maxPriceInput.value;
    syncPrice();
  });


  // ============================
  // LOAD CATEGORIES
  // ============================

 fetch("/sports_rental_system/api/get_categories.php")
        .then(res => res.json())
        .then(res => {

            if (!res.success || !categoryBox) return;

            categoryBox.innerHTML = "";

            res.data.forEach((cat: any) => {

                const label = document.createElement("label");

                label.innerHTML = `
        <input type="checkbox" value="${cat.category_id}">
        <span>${cat.name}</span>
    `;

                const checkbox =
                    label.querySelector("input") as HTMLInputElement;

                checkbox.addEventListener("change", () => {

                    const id = checkbox.value;

                    if (checkbox.checked) {
                        selectedCategories.push(id);
                    } else {
                        selectedCategories =
                            selectedCategories.filter(c => c !== id);
                    }

                    loadEquipment(); // 🔥 refresh list
                });

                categoryBox.appendChild(label);

            });

        })
        .catch(err => console.error("category fetch error:", err));


  // ============================
  // LOAD EQUIPMENT
  // ============================

  function loadEquipment() {

    if (!selectedBranchId || !equipmentGrid) return;

    const params = new URLSearchParams();

    params.set("branch_id", selectedBranchId);

    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }

    if (searchKeyword !== "") {
      params.set("q", searchKeyword);
    }

    if (minPriceInput?.value) {
      params.set("min_price", minPriceInput.value);
    }

    if (maxPriceInput?.value) {
      params.set("max_price", maxPriceInput.value);
    }

    equipmentGrid.innerHTML =
      `<p class="loading-text">กำลังโหลดอุปกรณ์...</p>`;

    fetch(
      "/sports_rental_system/api/get_equipments.php?" +
      params.toString()
    )
      .then(res => res.json())
      .then(res => {

        equipmentGrid.innerHTML = "";

        if (!res.success || res.data.length === 0) {
          equipmentGrid.innerHTML = "<p>ไม่พบอุปกรณ์</p>";
          return;
        }

        res.data.forEach((item: any) => {

          const card = document.createElement("div");
          card.className = "equipment-card";

          card.innerHTML = `
            <img src="${item.image_url}">
            <h5>${item.name}</h5>
            <p>${item.price_per_unit} บาท / ชม.</p>
            <span class="stock">
              คงเหลือ ${item.available_stock} ชิ้น
            </span>
          `;

          equipmentGrid.appendChild(card);

        });

      });

  }

});


// ===============================
// GENERATE TIME SLOTS
// ===============================

function generateTimeSlots(
  openTime: string,
  closeTime: string
) {

  const select =
    document.getElementById("timeSlot") as HTMLSelectElement | null;

  if (!select) return;

  select.innerHTML =
    `<option value="">เลือกเวลา</option>`;

  const openHour =
    parseInt(openTime.split(":")[0]);

  const closeHour =
    parseInt(closeTime.split(":")[0]);

  const lastStartHour =
    closeHour - 3;

  for (let h = openHour; h <= lastStartHour; h++) {

    const hour =
      h < 10 ? "0" + h : h.toString();

    const opt =
      document.createElement("option");

    opt.value = hour;
    opt.textContent = `${hour}:00 น.`;

    select.appendChild(opt);
  }

}
