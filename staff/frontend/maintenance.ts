document.addEventListener("DOMContentLoaded", () => {

  console.log("maintenance.ts loaded");

  /* =====================================================
     TAB SYSTEM
  ===================================================== */

  function switchTab(tabId: string) {

    document.querySelectorAll(".tab-btn")
      .forEach(b => b.classList.remove("active"));

    document.querySelectorAll(".tab-content")
      .forEach(c => c.classList.remove("active"));

    document
      .querySelector(`.tab-btn[data-tab="${tabId}"]`)
      ?.classList.add("active");

    document
      .getElementById(tabId)
      ?.classList.add("active");
  }

  document.querySelectorAll<HTMLButtonElement>(".tab-btn")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        if (target) switchTab(target);
      });
    });

  /* =====================================================
     STATE
  ===================================================== */

  let selectedBranchId: string | null = null;
  let searchKeyword = "";
  let selectedStatus = "";
  let selectedCategory = "";
  let selectedDamage = "";

  /* =====================================================
     ELEMENTS (LIST TAB)
  ===================================================== */

  const listContainer =
    document.getElementById("maintenanceList") as HTMLElement | null;

  const searchInput =
    document.getElementById("searchInput") as HTMLInputElement | null;

  const statusFilter =
    document.getElementById("statusFilter") as HTMLSelectElement | null;

  const categoryFilter =
    document.getElementById("categoryFilter") as HTMLSelectElement | null;

  const damageFilter =
    document.getElementById("damageFilter") as HTMLSelectElement | null;

  const resetBtn =
    document.getElementById("resetFilters") as HTMLButtonElement | null;

  /* =====================================================
     ELEMENTS (FORM TAB)
  ===================================================== */

  const categorySelect =
    document.getElementById("categorySelect") as HTMLSelectElement | null;

  const equipmentSelect =
    document.getElementById("equipmentSelect") as HTMLSelectElement | null;

  const instanceSelect =
    document.getElementById("instanceSelect") as HTMLSelectElement | null;

  const damageLevel =
    document.getElementById("damageLevel") as HTMLSelectElement | null;

  const descriptionInput =
    document.getElementById("description") as HTMLTextAreaElement | null;

  const customerIdInput =
    document.getElementById("customerId") as HTMLInputElement | null;

  const submitBtn =
    document.getElementById("submitBtn") as HTMLButtonElement | null;

  /* =====================================================
     LOAD BRANCH
  ===================================================== */

  fetch("/sports_rental_system/staff/api/get_selected_branch.php")
    .then(res => res.json())
    .then(res => {

      if (!res || res.success === false) {
        window.location.href = "branches.html";
        return;
      }

      const data = res.data ?? res;
      selectedBranchId = data.branch_id;

      loadMaintenance();
    });

  /* =====================================================
     LOAD CATEGORIES (ใช้ทั้ง form + filter)
  ===================================================== */

  fetch("/sports_rental_system/staff/api/get_categories.php")
    .then(res => res.json())
    .then(res => {

      if (!res.success || !res.data) return;

      // สำหรับ filter
      if (categoryFilter) {
        categoryFilter.innerHTML =
          `<option value="">-- ทุกหมวดหมู่ --</option>`;

        res.data.forEach((cat: any) => {
          const opt = document.createElement("option");
          opt.value = String(cat.category_id);
          opt.textContent = cat.name;
          categoryFilter.appendChild(opt);
        });
      }

      // สำหรับ form
      if (categorySelect) {
        categorySelect.innerHTML =
          `<option value="">-- เลือกหมวดหมู่ --</option>`;

        res.data.forEach((cat: any) => {
          const opt = document.createElement("option");
          opt.value = String(cat.category_id);
          opt.textContent = cat.name;
          categorySelect.appendChild(opt);
        });
      }

    });

  /* =====================================================
     LOAD DAMAGE LEVEL (FILTER)
  ===================================================== */

  fetch("/sports_rental_system/staff/api/get_damage_levels.php")
    .then(res => res.json())
    .then(res => {

      if (!res.success || !res.data || !damageFilter)
        return;

      damageFilter.innerHTML =
        `<option value="">-- ทุกระดับความเสียหาย --</option>`;

      res.data.forEach((d: any) => {
        const opt = document.createElement("option");
        opt.value = String(d.damage_id);
        opt.textContent = d.name_th;
        damageFilter.appendChild(opt);
      });

    });

  /* =====================================================
     FORM: เลือกหมวด → โหลดอุปกรณ์
  ===================================================== */

  categorySelect?.addEventListener("change", () => {

    if (!equipmentSelect || !instanceSelect) return;

    const categoryId = categorySelect.value;

    equipmentSelect.innerHTML =
      `<option value="">-- เลือกอุปกรณ์ --</option>`;

    instanceSelect.innerHTML =
      `<option value="">-- เลือก instance --</option>`;

    if (!categoryId) return;

    fetch("/sports_rental_system/staff/api/get_equipment_by_category.php?category_id=" + categoryId)
      .then(res => res.json())
      .then(res => {

        if (!res.success || !res.data) return;

        res.data.forEach((eq: any) => {
          const opt = document.createElement("option");
          opt.value = String(eq.equipment_id);
          opt.textContent = eq.name;
          equipmentSelect.appendChild(opt);
        });

      });

  });

  /* =====================================================
     FORM: เลือกอุปกรณ์ → โหลด instance
  ===================================================== */

  equipmentSelect?.addEventListener("change", () => {

    if (!instanceSelect) return;

    const equipmentId = equipmentSelect.value;

    instanceSelect.innerHTML =
      `<option value="">-- เลือก instance --</option>`;

    if (!equipmentId) return;

    fetch("/sports_rental_system/staff/api/get_equipment_instances.php?equipment_id=" + equipmentId)
      .then(res => res.json())
      .then(res => {

        console.log("Instance API:", res);

        if (!res.success || !res.instances) return;

        res.instances.forEach((ins: any) => {

          const opt = document.createElement("option");

          opt.value = ins.instance_code;
          opt.textContent = ins.instance_code;

          instanceSelect.appendChild(opt);

        });

      })
      .catch(err => console.error(err));

  });

  /* =====================================================
     FORM: SUBMIT
  ===================================================== */

  submitBtn?.addEventListener("click", () => {

    if (!instanceSelect?.value || !damageLevel?.value) {
      alert("กรุณาเลือกข้อมูลให้ครบ");
      return;
    }

    const payload = {
      instance_code: instanceSelect.value,   // ✅ ตรงกับ PHP
      damage_id: damageLevel.value,          // ✅ ตรงกับ PHP
      description: descriptionInput?.value || "",
      customer_id: customerIdInput?.value || ""
    };

    fetch("/sports_rental_system/staff/api/create_maintenance.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {

        if (!res.success) {
          alert(res.message || "บันทึกไม่สำเร็จ");
          return;
        }

        alert("แจ้งซ่อมสำเร็จ");

        switchTab("listTab");
        loadMaintenance();
      });

  });
  /* =====================================================
     FILTER EVENTS
  ===================================================== */

  searchInput?.addEventListener("input", () => {
    searchKeyword = searchInput.value.trim();
    loadMaintenance();
  });

  statusFilter?.addEventListener("change", () => {
    selectedStatus = statusFilter.value;
    loadMaintenance();
  });

  categoryFilter?.addEventListener("change", () => {
    selectedCategory = categoryFilter.value;
    loadMaintenance();
  });

  damageFilter?.addEventListener("change", () => {
    selectedDamage = damageFilter.value;
    loadMaintenance();
  });

  resetBtn?.addEventListener("click", () => {

    searchKeyword = "";
    selectedStatus = "";
    selectedCategory = "";
    selectedDamage = "";

    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "";
    if (categoryFilter) categoryFilter.value = "";
    if (damageFilter) damageFilter.value = "";

    loadMaintenance();
  });

/* =====================================================
   LOAD MAINTENANCE STATUS (FILTER)
===================================================== */

fetch("/sports_rental_system/staff/api/get_maintenance_status.php")
  .then(res => res.json())
  .then(res => {

    if (!res.success || !res.data || !statusFilter)
      return;

    statusFilter.innerHTML =
      `<option value="">-- ทุกสถานะ --</option>`;

    res.data.forEach((s: any) => {

      const opt = document.createElement("option");
      opt.value = String(s.status_id);
      opt.textContent = s.name_th;

      statusFilter.appendChild(opt);

    });

  })
  .catch(err => console.error("Status load error:", err));


/* =====================================================
   LOAD MAINTENANCE
===================================================== */

function loadMaintenance() {

  if (!listContainer)
    return;

  const params = new URLSearchParams();

  if (searchKeyword) params.set("q", searchKeyword);
  if (selectedStatus) params.set("status_id", selectedStatus);
  if (selectedCategory) params.set("category_id", selectedCategory);
  if (selectedDamage) params.set("damage_id", selectedDamage);

  listContainer.innerHTML = "<p>กำลังโหลด...</p>";

  fetch("/sports_rental_system/staff/api/get_maintenance_list.php?" + params.toString())
    .then(res => res.json())
    .then(res => {

      listContainer.innerHTML = "";

      if (!res.success || !res.data || res.data.length === 0) {
        listContainer.innerHTML = "<p>ไม่พบข้อมูล</p>";
        return;
      }

      res.data.forEach((item: any) => {

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${item.instance_code}</td>
    <td>${item.description ?? "-"}</td>
    <td>${item.report_date}</td>
    <td>${item.damage_name_th ?? "-"}</td>
    <td>
      <span class="badge ${
        item.status_name_th === "รอดำเนินการ" ? "waiting" :
        item.status_name_th === "กำลังดำเนินการ" ? "progress" :
        item.status_name_th === "ดำเนินการเสร็จสิ้น" ? "done" : ""
      }">
        ${item.status_name_th ?? "-"}
      </span>
    </td>
  `;

  listContainer.appendChild(row);
});


    })
    .catch(err => {
      console.error(err);
      listContainer.innerHTML = "<p>เกิดข้อผิดพลาด</p>";
    });
}

});
