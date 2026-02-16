document.addEventListener("DOMContentLoaded", function () {
    console.log("maintenance.ts loaded");
    /* =====================================================
       TAB SYSTEM
    ===================================================== */
    function switchTab(tabId) {
        var _a, _b;
        document.querySelectorAll(".tab-btn")
            .forEach(function (b) { return b.classList.remove("active"); });
        document.querySelectorAll(".tab-content")
            .forEach(function (c) { return c.classList.remove("active"); });
        (_a = document
            .querySelector(".tab-btn[data-tab=\"".concat(tabId, "\"]"))) === null || _a === void 0 ? void 0 : _a.classList.add("active");
        (_b = document
            .getElementById(tabId)) === null || _b === void 0 ? void 0 : _b.classList.add("active");
    }
    document.querySelectorAll(".tab-btn")
        .forEach(function (btn) {
        btn.addEventListener("click", function () {
            var target = btn.dataset.tab;
            if (target)
                switchTab(target);
        });
    });
    /* =====================================================
       STATE
    ===================================================== */
    var selectedBranchId = null;
    var searchKeyword = "";
    var selectedStatus = "";
    var selectedCategory = "";
    var selectedDamage = "";
    /* =====================================================
       ELEMENTS (LIST TAB)
    ===================================================== */
    var listContainer = document.getElementById("maintenanceList");
    var searchInput = document.getElementById("searchInput");
    var statusFilter = document.getElementById("statusFilter");
    var categoryFilter = document.getElementById("categoryFilter");
    var damageFilter = document.getElementById("damageFilter");
    var resetBtn = document.getElementById("resetFilters");
    /* =====================================================
       ELEMENTS (FORM TAB)
    ===================================================== */
    var categorySelect = document.getElementById("categorySelect");
    var equipmentSelect = document.getElementById("equipmentSelect");
    var instanceSelect = document.getElementById("instanceSelect");
    var damageLevel = document.getElementById("damageLevel");
    var descriptionInput = document.getElementById("description");
    var customerIdInput = document.getElementById("customerId");
    var submitBtn = document.getElementById("submitBtn");
    /* =====================================================
       LOAD BRANCH
    ===================================================== */
    fetch("/sports_rental_system/staff/api/get_selected_branch.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        var _a;
        if (!res || res.success === false) {
            window.location.href = "branches.html";
            return;
        }
        var data = (_a = res.data) !== null && _a !== void 0 ? _a : res;
        selectedBranchId = data.branch_id;
        loadMaintenance();
    });
    /* =====================================================
       LOAD CATEGORIES (ใช้ทั้ง form + filter)
    ===================================================== */
    fetch("/sports_rental_system/staff/api/get_categories.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        if (!res.success || !res.data)
            return;
        // สำหรับ filter
        if (categoryFilter) {
            categoryFilter.innerHTML =
                "<option value=\"\">-- \u0E17\u0E38\u0E01\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 --</option>";
            res.data.forEach(function (cat) {
                var opt = document.createElement("option");
                opt.value = String(cat.category_id);
                opt.textContent = cat.name;
                categoryFilter.appendChild(opt);
            });
        }
        // สำหรับ form
        if (categorySelect) {
            categorySelect.innerHTML =
                "<option value=\"\">-- \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 --</option>";
            res.data.forEach(function (cat) {
                var opt = document.createElement("option");
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
        .then(function (res) { return res.json(); })
        .then(function (res) {
        if (!res.success || !res.data || !damageFilter)
            return;
        damageFilter.innerHTML =
            "<option value=\"\">-- \u0E17\u0E38\u0E01\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E22\u0E2B\u0E32\u0E22 --</option>";
        res.data.forEach(function (d) {
            var opt = document.createElement("option");
            opt.value = String(d.damage_id);
            opt.textContent = d.name_th;
            damageFilter.appendChild(opt);
        });
    });
    /* =====================================================
       FORM: เลือกหมวด → โหลดอุปกรณ์
    ===================================================== */
    categorySelect === null || categorySelect === void 0 ? void 0 : categorySelect.addEventListener("change", function () {
        if (!equipmentSelect || !instanceSelect)
            return;
        var categoryId = categorySelect.value;
        equipmentSelect.innerHTML =
            "<option value=\"\">-- \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C --</option>";
        instanceSelect.innerHTML =
            "<option value=\"\">-- \u0E40\u0E25\u0E37\u0E2D\u0E01 instance --</option>";
        if (!categoryId)
            return;
        fetch("/sports_rental_system/staff/api/get_equipment_by_category.php?category_id=" + categoryId)
            .then(function (res) { return res.json(); })
            .then(function (res) {
            if (!res.success || !res.data)
                return;
            res.data.forEach(function (eq) {
                var opt = document.createElement("option");
                opt.value = String(eq.equipment_id);
                opt.textContent = eq.name;
                equipmentSelect.appendChild(opt);
            });
        });
    });
    /* =====================================================
       FORM: เลือกอุปกรณ์ → โหลด instance
    ===================================================== */
    equipmentSelect === null || equipmentSelect === void 0 ? void 0 : equipmentSelect.addEventListener("change", function () {
        if (!instanceSelect)
            return;
        var equipmentId = equipmentSelect.value;
        instanceSelect.innerHTML =
            "<option value=\"\">-- \u0E40\u0E25\u0E37\u0E2D\u0E01 instance --</option>";
        if (!equipmentId)
            return;
        fetch("/sports_rental_system/staff/api/get_equipment_instances.php?equipment_id=" + equipmentId)
            .then(function (res) { return res.json(); })
            .then(function (res) {
            console.log("Instance API:", res);
            if (!res.success || !res.instances)
                return;
            res.instances.forEach(function (ins) {
                var opt = document.createElement("option");
                opt.value = ins.instance_code;
                opt.textContent = ins.instance_code;
                instanceSelect.appendChild(opt);
            });
        })
            .catch(function (err) { return console.error(err); });
    });
    /* =====================================================
       FORM: SUBMIT
    ===================================================== */
    submitBtn === null || submitBtn === void 0 ? void 0 : submitBtn.addEventListener("click", function () {
        if (!(instanceSelect === null || instanceSelect === void 0 ? void 0 : instanceSelect.value) || !(damageLevel === null || damageLevel === void 0 ? void 0 : damageLevel.value)) {
            alert("กรุณาเลือกข้อมูลให้ครบ");
            return;
        }
        var payload = {
            instance_code: instanceSelect.value, // ✅ ตรงกับ PHP
            damage_id: damageLevel.value, // ✅ ตรงกับ PHP
            description: (descriptionInput === null || descriptionInput === void 0 ? void 0 : descriptionInput.value) || "",
            customer_id: (customerIdInput === null || customerIdInput === void 0 ? void 0 : customerIdInput.value) || ""
        };
        fetch("/sports_rental_system/staff/api/create_maintenance.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json(); })
            .then(function (res) {
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
    searchInput === null || searchInput === void 0 ? void 0 : searchInput.addEventListener("input", function () {
        searchKeyword = searchInput.value.trim();
        loadMaintenance();
    });
    statusFilter === null || statusFilter === void 0 ? void 0 : statusFilter.addEventListener("change", function () {
        selectedStatus = statusFilter.value;
        loadMaintenance();
    });
    categoryFilter === null || categoryFilter === void 0 ? void 0 : categoryFilter.addEventListener("change", function () {
        selectedCategory = categoryFilter.value;
        loadMaintenance();
    });
    damageFilter === null || damageFilter === void 0 ? void 0 : damageFilter.addEventListener("change", function () {
        selectedDamage = damageFilter.value;
        loadMaintenance();
    });
    resetBtn === null || resetBtn === void 0 ? void 0 : resetBtn.addEventListener("click", function () {
        searchKeyword = "";
        selectedStatus = "";
        selectedCategory = "";
        selectedDamage = "";
        if (searchInput)
            searchInput.value = "";
        if (statusFilter)
            statusFilter.value = "";
        if (categoryFilter)
            categoryFilter.value = "";
        if (damageFilter)
            damageFilter.value = "";
        loadMaintenance();
    });
    /* =====================================================
       LOAD MAINTENANCE STATUS (FILTER)
    ===================================================== */
    fetch("/sports_rental_system/staff/api/get_maintenance_status.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        if (!res.success || !res.data || !statusFilter)
            return;
        statusFilter.innerHTML =
            "<option value=\"\">-- \u0E17\u0E38\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E30 --</option>";
        res.data.forEach(function (s) {
            var opt = document.createElement("option");
            opt.value = String(s.status_id);
            opt.textContent = s.name_th;
            statusFilter.appendChild(opt);
        });
    })
        .catch(function (err) { return console.error("Status load error:", err); });
    /* =====================================================
       LOAD MAINTENANCE
    ===================================================== */
    function loadMaintenance() {
        if (!listContainer)
            return;
        var params = new URLSearchParams();
        if (searchKeyword)
            params.set("q", searchKeyword);
        if (selectedStatus)
            params.set("status_id", selectedStatus);
        if (selectedCategory)
            params.set("category_id", selectedCategory);
        if (selectedDamage)
            params.set("damage_id", selectedDamage);
        listContainer.innerHTML = "<p>กำลังโหลด...</p>";
        fetch("/sports_rental_system/staff/api/get_maintenance_list.php?" + params.toString())
            .then(function (res) { return res.json(); })
            .then(function (res) {
            listContainer.innerHTML = "";
            if (!res.success || !res.data || res.data.length === 0) {
                listContainer.innerHTML = "<p>ไม่พบข้อมูล</p>";
                return;
            }
            res.data.forEach(function (item) {
                var _a, _b, _c;
                var row = document.createElement("tr");
                row.innerHTML = "\n    <td>".concat(item.instance_code, "</td>\n    <td>").concat((_a = item.description) !== null && _a !== void 0 ? _a : "-", "</td>\n    <td>").concat(item.report_date, "</td>\n    <td>").concat((_b = item.damage_name_th) !== null && _b !== void 0 ? _b : "-", "</td>\n    <td>\n      <span class=\"badge ").concat(item.status_name_th === "รอดำเนินการ" ? "waiting" :
                    item.status_name_th === "กำลังดำเนินการ" ? "progress" :
                        item.status_name_th === "ดำเนินการเสร็จสิ้น" ? "done" : "", "\">\n        ").concat((_c = item.status_name_th) !== null && _c !== void 0 ? _c : "-", "\n      </span>\n    </td>\n  ");
                listContainer.appendChild(row);
            });
        })
            .catch(function (err) {
            console.error(err);
            listContainer.innerHTML = "<p>เกิดข้อผิดพลาด</p>";
        });
    }
});
