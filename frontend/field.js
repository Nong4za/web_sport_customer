document.addEventListener("DOMContentLoaded", function () {
    var _a;
    console.log("field.ts loaded");
    // ============================
    // STATE
    // ============================
    var selectedBranchId = null;
    var selectedCategories = [];
    var searchKeyword = "";
    // ============================
    // ELEMENTS
    // ============================
    var branchLabel = document.getElementById("selectedBranch");
    var timeSlot = document.getElementById("timeSlot");
    var hourInput = document.getElementById("rentHours");
    var dateInput = document.getElementById("rentDate");
    var categoryBox = document.getElementById("categoryList");
    var venueGrid = document.getElementById("venueGrid");
    var searchInput = document.getElementById("searchInput");
    // ===== PRICE (เหมือนหน้า index) =====
    var minPriceInput = document.getElementById("minPriceInput");
    var maxPriceInput = document.getElementById("maxPriceInput");
    var priceMinRange = document.getElementById("priceMin");
    var priceMaxRange = document.getElementById("priceMax");
    // ===== POINT =====
    var pointEl = document.getElementById("topPoints");
    // ============================
    // LOAD USER POINTS
    // ============================
    fetch("/sports_rental_system/api/get_profile.php")
        .then(function (res) { return res.json(); })
        .then(function (data) {
        var _a, _b, _c;
        console.log("user data:", data);
        var points = (_c = (_a = data.points) !== null && _a !== void 0 ? _a : (_b = data.data) === null || _b === void 0 ? void 0 : _b.points) !== null && _c !== void 0 ? _c : data.current_points;
        if (pointEl && points !== undefined) {
            pointEl.textContent = "\u2B50 ".concat(points, " \u0E04\u0E30\u0E41\u0E19\u0E19");
        }
    })
        .catch(function (err) { return console.error("user fetch error:", err); });
    // ============================
    // RESTORE SHARED STATE
    // ============================
    var savedDate = localStorage.getItem("rentDate");
    var savedTime = localStorage.getItem("timeSlot");
    var savedHours = localStorage.getItem("rentHours");
    var savedMin = localStorage.getItem("minPrice");
    var savedMax = localStorage.getItem("maxPrice");
    if (savedDate && dateInput)
        dateInput.value = savedDate;
    if (savedHours && hourInput) {
        hourInput.value = savedHours;
        document.querySelectorAll(".duration-btn")
            .forEach(function (b) { return b.classList.remove("active"); });
        (_a = document.querySelector(".duration-btn[data-hour=\"".concat(savedHours, "\"]"))) === null || _a === void 0 ? void 0 : _a.classList.add("active");
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
        .then(function (res) { return res.json(); })
        .then(function (res) {
        var _a;
        if (!res || res.success === false) {
            window.location.href = "branches.html";
            return;
        }
        var data = (_a = res.data) !== null && _a !== void 0 ? _a : res;
        selectedBranchId = data.branch_id;
        if (branchLabel)
            branchLabel.textContent = data.name;
        if (timeSlot) {
            generateTimeSlots(data.open_time, data.close_time);
            if (savedTime)
                timeSlot.value = savedTime;
        }
        loadVenues();
    });
    // ============================
    // SAVE DATE / TIME
    // ============================
    dateInput === null || dateInput === void 0 ? void 0 : dateInput.addEventListener("change", function () {
        localStorage.setItem("rentDate", dateInput.value);
    });
    timeSlot === null || timeSlot === void 0 ? void 0 : timeSlot.addEventListener("change", function () {
        localStorage.setItem("timeSlot", timeSlot.value);
    });
    // ============================
    // DURATION
    // ============================
    document.querySelectorAll(".duration-btn")
        .forEach(function (btn) {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".duration-btn")
                .forEach(function (b) { return b.classList.remove("active"); });
            btn.classList.add("active");
            var h = btn.dataset.hour || "3";
            if (hourInput)
                hourInput.value = h;
            localStorage.setItem("rentHours", h);
        });
    });
    // ============================
    // SEARCH
    // ============================
    searchInput === null || searchInput === void 0 ? void 0 : searchInput.addEventListener("input", function () {
        searchKeyword = searchInput.value.trim();
        loadVenues();
    });
    // ============================
    // PRICE SYNC (เหมือนหน้า index)
    // ============================
    function syncPrice() {
        if (!minPriceInput ||
            !maxPriceInput ||
            !priceMinRange ||
            !priceMaxRange)
            return;
        var min = Number(priceMinRange.value);
        var max = Number(priceMaxRange.value);
        if (min > max)
            min = max;
        minPriceInput.value = min.toString();
        maxPriceInput.value = max.toString();
        localStorage.setItem("minPrice", min.toString());
        localStorage.setItem("maxPrice", max.toString());
        loadVenues();
    }
    priceMinRange === null || priceMinRange === void 0 ? void 0 : priceMinRange.addEventListener("input", syncPrice);
    priceMaxRange === null || priceMaxRange === void 0 ? void 0 : priceMaxRange.addEventListener("input", syncPrice);
    minPriceInput === null || minPriceInput === void 0 ? void 0 : minPriceInput.addEventListener("change", function () {
        if (priceMinRange)
            priceMinRange.value = minPriceInput.value;
        syncPrice();
    });
    maxPriceInput === null || maxPriceInput === void 0 ? void 0 : maxPriceInput.addEventListener("change", function () {
        if (priceMaxRange)
            priceMaxRange.value = maxPriceInput.value;
        syncPrice();
    });
    // ============================
    // LOAD CATEGORIES
    // ============================
    fetch("/sports_rental_system/api/get_categories.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        if (!res.success || !categoryBox)
            return;
        categoryBox.innerHTML = "";
        res.data.forEach(function (cat) {
            var label = document.createElement("label");
            label.innerHTML = "\n        <input type=\"checkbox\" value=\"".concat(cat.category_id, "\">\n        <span>").concat(cat.name, "</span>\n      ");
            var checkbox = label.querySelector("input");
            checkbox.addEventListener("change", function () {
                var id = checkbox.value;
                if (checkbox.checked) {
                    selectedCategories.push(id);
                }
                else {
                    selectedCategories =
                        selectedCategories.filter(function (c) { return c !== id; });
                }
                loadVenues(); // 🔥 refresh list
            });
            categoryBox.appendChild(label);
        });
    })
        .catch(function (err) { return console.error("category fetch error:", err); });
    // ============================
    // LOAD VENUES
    // ============================
    function loadVenues() {
        if (!selectedBranchId || !venueGrid)
            return;
        var params = new URLSearchParams();
        params.set("branch_id", selectedBranchId);
        if (selectedCategories.length > 0) {
            params.set("categories", selectedCategories.join(","));
        }
        if (searchKeyword !== "") {
            params.set("q", searchKeyword);
        }
        if (minPriceInput === null || minPriceInput === void 0 ? void 0 : minPriceInput.value) {
            params.set("min_price", minPriceInput.value);
        }
        if (maxPriceInput === null || maxPriceInput === void 0 ? void 0 : maxPriceInput.value) {
            params.set("max_price", maxPriceInput.value);
        }
        venueGrid.innerHTML =
            "<p class=\"loading-text\">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E19\u0E32\u0E21...</p>";
        fetch("/sports_rental_system/api/get_venues.php?" +
            params.toString())
            .then(function (res) { return res.json(); })
            .then(function (res) {
            venueGrid.innerHTML = "";
            if (!res.success || res.data.length === 0) {
                venueGrid.innerHTML = "<p>ไม่พบสนาม</p>";
                return;
            }
            res.data.forEach(function (item) {
                var card = document.createElement("div");
                card.className = "equipment-card";
                var img = item.image_url && item.image_url !== ""
                    ? item.image_url
                    : "images/no-image.png";
                card.innerHTML = "\n            <img src=\"".concat(img, "\">\n            <h5>").concat(item.name, "</h5>\n            <p>").concat(item.price_per_hour, " \u0E1A\u0E32\u0E17 / \u0E0A\u0E21.</p>\n          ");
                venueGrid.appendChild(card);
            });
        });
    }
});
// ===============================
// GENERATE TIME SLOTS
// ===============================
function generateTimeSlots(openTime, closeTime) {
    var select = document.getElementById("timeSlot");
    if (!select)
        return;
    select.innerHTML =
        "<option value=\"\">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E27\u0E25\u0E32</option>";
    var openHour = parseInt(openTime.split(":")[0]);
    var closeHour = parseInt(closeTime.split(":")[0]);
    var lastStartHour = closeHour - 3;
    for (var h = openHour; h <= lastStartHour; h++) {
        var hour = h < 10 ? "0" + h : h.toString();
        var opt = document.createElement("option");
        opt.value = hour;
        opt.textContent = "".concat(hour, ":00 \u0E19.");
        select.appendChild(opt);
    }
}
