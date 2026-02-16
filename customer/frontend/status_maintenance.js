document.addEventListener("DOMContentLoaded", function () {
    console.log("customer maintenance loaded");
    /* ================= STATE ================= */
    var searchKeyword = "";
    var selectedStatus = "";
    var selectedDamage = "";
    /* ================= ELEMENTS ================= */
    var listContainer = document.getElementById("maintenanceList");
    var searchInput = document.getElementById("searchInput");
    var statusFilter = document.getElementById("statusFilter");
    var damageFilter = document.getElementById("damageFilter");
    var resetBtn = document.getElementById("resetFilters");
    /* ================= LOAD STATUS ================= */
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
    });
    /* ================= LOAD DAMAGE ================= */
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
    /* ================= FILTER EVENTS ================= */
    searchInput === null || searchInput === void 0 ? void 0 : searchInput.addEventListener("input", function () {
        searchKeyword = searchInput.value.trim();
        loadMaintenance();
    });
    statusFilter === null || statusFilter === void 0 ? void 0 : statusFilter.addEventListener("change", function () {
        selectedStatus = statusFilter.value;
        loadMaintenance();
    });
    damageFilter === null || damageFilter === void 0 ? void 0 : damageFilter.addEventListener("change", function () {
        selectedDamage = damageFilter.value;
        loadMaintenance();
    });
    resetBtn === null || resetBtn === void 0 ? void 0 : resetBtn.addEventListener("click", function () {
        searchKeyword = "";
        selectedStatus = "";
        selectedDamage = "";
        if (searchInput)
            searchInput.value = "";
        if (statusFilter)
            statusFilter.value = "";
        if (damageFilter)
            damageFilter.value = "";
        loadMaintenance();
    });
    /* ================= LOAD MAINTENANCE ================= */
    function loadMaintenance() {
        if (!listContainer)
            return;
        var params = new URLSearchParams();
        if (searchKeyword)
            params.set("q", searchKeyword);
        if (selectedStatus)
            params.set("status_id", selectedStatus);
        if (selectedDamage)
            params.set("damage_id", selectedDamage);
        listContainer.innerHTML =
            "<tr><td colspan=\"5\">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...</td></tr>";
        fetch("/sports_rental_system/customer/api/get_customer_maintenance_list.php?" + params.toString())
            .then(function (res) { return res.json(); })
            .then(function (res) {
            listContainer.innerHTML = "";
            if (!res.success || !res.data || res.data.length === 0) {
                listContainer.innerHTML =
                    "<tr><td colspan=\"5\">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</td></tr>";
                return;
            }
            res.data.forEach(function (item) {
                var _a;
                var row = document.createElement("tr");
                row.innerHTML = "\n            <td>".concat(item.instance_code, "</td>\n            <td>").concat((_a = item.description) !== null && _a !== void 0 ? _a : "-", "</td>\n            <td>").concat(item.report_date, "</td>\n            <td>").concat(renderDamage(item.damage_name_th), "</td>\n            <td>").concat(renderStatus(item.status_name_th), "</td>\n          ");
                listContainer.appendChild(row);
            });
        })
            .catch(function (err) {
            console.error(err);
            listContainer.innerHTML =
                "<tr><td colspan=\"5\">\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14</td></tr>";
        });
    }
    fetch("/sports_rental_system/customer/api/get_profile.php")
        .then(function (res) { return res.json(); })
        .then(function (data) {
        var pointEl = document.getElementById("topPoints");
        if (pointEl && data.points !== undefined) {
            pointEl.textContent =
                "\u2B50 ".concat(data.points, " \u0E04\u0E30\u0E41\u0E19\u0E19");
        }
    });
    /* ================= BADGE RENDER ================= */
    function renderStatus(status) {
        switch (status) {
            case "รอดำเนินการ":
                return "<span class=\"badge waiting\">".concat(status, "</span>");
            case "กำลังดำเนินการ":
                return "<span class=\"badge progress\">".concat(status, "</span>");
            case "ดำเนินการเสร็จสิ้น":
                return "<span class=\"badge done\">".concat(status, "</span>");
            default:
                return "<span class=\"badge\">".concat(status !== null && status !== void 0 ? status : "-", "</span>");
        }
    }
    function renderDamage(damage) {
        switch (damage) {
            case "เล็กน้อย":
                return "<span class=\"badge low\">".concat(damage, "</span>");
            case "ปานกลาง":
                return "<span class=\"badge medium\">".concat(damage, "</span>");
            case "รุนแรง":
                return "<span class=\"badge high\">".concat(damage, "</span>");
            default:
                return "<span class=\"badge\">".concat(damage !== null && damage !== void 0 ? damage : "-", "</span>");
        }
    }
    /* ================= INIT ================= */
    loadMaintenance();
});
