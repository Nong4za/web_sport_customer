document.addEventListener("DOMContentLoaded", () => {

  console.log("customer maintenance loaded");

  /* ================= STATE ================= */

  let searchKeyword = "";
  let selectedStatus = "";
  let selectedDamage = "";

  /* ================= ELEMENTS ================= */

  const listContainer =
    document.getElementById("maintenanceList") as HTMLElement | null;

  const searchInput =
    document.getElementById("searchInput") as HTMLInputElement | null;

  const statusFilter =
    document.getElementById("statusFilter") as HTMLSelectElement | null;

  const damageFilter =
    document.getElementById("damageFilter") as HTMLSelectElement | null;

  const resetBtn =
    document.getElementById("resetFilters") as HTMLButtonElement | null;


  /* ================= LOAD STATUS ================= */

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

    });


  /* ================= LOAD DAMAGE ================= */

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


  /* ================= FILTER EVENTS ================= */

  searchInput?.addEventListener("input", () => {
    searchKeyword = searchInput.value.trim();
    loadMaintenance();
  });

  statusFilter?.addEventListener("change", () => {
    selectedStatus = statusFilter.value;
    loadMaintenance();
  });

  damageFilter?.addEventListener("change", () => {
    selectedDamage = damageFilter.value;
    loadMaintenance();
  });

  resetBtn?.addEventListener("click", () => {

    searchKeyword = "";
    selectedStatus = "";
    selectedDamage = "";

    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "";
    if (damageFilter) damageFilter.value = "";

    loadMaintenance();
  });


  /* ================= LOAD MAINTENANCE ================= */

  function loadMaintenance() {

    if (!listContainer)
      return;

    const params = new URLSearchParams();

    if (searchKeyword)
      params.set("q", searchKeyword);

    if (selectedStatus)
      params.set("status_id", selectedStatus);

    if (selectedDamage)
      params.set("damage_id", selectedDamage);

    listContainer.innerHTML =
      `<tr><td colspan="5">กำลังโหลด...</td></tr>`;

    fetch("/sports_rental_system/customer/api/get_customer_maintenance_list.php?" + params.toString())
      .then(res => res.json())
      .then(res => {

        listContainer.innerHTML = "";

        if (!res.success || !res.data || res.data.length === 0) {

          listContainer.innerHTML =
            `<tr><td colspan="5">ไม่พบข้อมูล</td></tr>`;

          return;
        }

        res.data.forEach((item: any) => {

          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${item.instance_code}</td>
            <td>${item.description ?? "-"}</td>
            <td>${item.report_date}</td>
            <td>${renderDamage(item.damage_name_th)}</td>
            <td>${renderStatus(item.status_name_th)}</td>
          `;

          listContainer.appendChild(row);
        });

      })
      .catch(err => {
        console.error(err);
        listContainer.innerHTML =
          `<tr><td colspan="5">เกิดข้อผิดพลาด</td></tr>`;
      });
  }

    fetch("/sports_rental_system/customer/api/get_profile.php")
    .then(res => res.json())
    .then(data => {

      const pointEl =
        document.getElementById("topPoints");

      if (pointEl && data.points !== undefined) {
        pointEl.textContent =
          `⭐ ${data.points} คะแนน`;
      }

    });



  /* ================= BADGE RENDER ================= */

  function renderStatus(status: string): string {

    switch (status) {

      case "รอดำเนินการ":
        return `<span class="badge waiting">${status}</span>`;

      case "กำลังดำเนินการ":
        return `<span class="badge progress">${status}</span>`;

      case "ดำเนินการเสร็จสิ้น":
        return `<span class="badge done">${status}</span>`;

      default:
        return `<span class="badge">${status ?? "-"}</span>`;
    }
  }

  function renderDamage(damage: string): string {

    switch (damage) {

      case "เล็กน้อย":
        return `<span class="badge low">${damage}</span>`;

      case "ปานกลาง":
        return `<span class="badge medium">${damage}</span>`;

      case "รุนแรง":
        return `<span class="badge high">${damage}</span>`;

      default:
        return `<span class="badge">${damage ?? "-"}</span>`;
    }
  }


  /* ================= INIT ================= */

  loadMaintenance();

});
