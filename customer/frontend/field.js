document.addEventListener("DOMContentLoaded", function () {
    var _a;
    console.log("field.ts loaded");
    updateCartCount();
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
    // ===== PRICE RANGE ======
    var minPriceInput = document.getElementById("minPriceInput");
    var maxPriceInput = document.getElementById("maxPriceInput");
    var priceMinRange = document.getElementById("priceMin");
    var priceMaxRange = document.getElementById("priceMax");
    // ============================
    // RESET FILTERS
    // ============================
    var resetBtn = document.getElementById("resetFilters");
    // RESET BUTTON CLICK
    resetBtn === null || resetBtn === void 0 ? void 0 : resetBtn.addEventListener("click", function () {
        console.log("RESET FILTERS");
        // ===== STATE =====
        selectedCategories = [];
        searchKeyword = "";
        // ===== DATE / TIME / HOURS =====
        if (dateInput)
            dateInput.value = "";
        if (timeSlot)
            timeSlot.value = "";
        if (hourInput)
            hourInput.value = "";
        document
            .querySelectorAll(".duration-btn")
            .forEach(function (b) { return b.classList.remove("active"); });
        // ===== CATEGORY =====
        categoryBox === null || categoryBox === void 0 ? void 0 : categoryBox.querySelectorAll("input[type=checkbox]").forEach(function (cb) { return (cb.checked = false); });
        // ===== PRICE =====
        var defaultMin = (priceMinRange === null || priceMinRange === void 0 ? void 0 : priceMinRange.min) || "0";
        var defaultMax = (priceMaxRange === null || priceMaxRange === void 0 ? void 0 : priceMaxRange.max) || "5000";
        if (minPriceInput)
            minPriceInput.value = defaultMin;
        if (maxPriceInput)
            maxPriceInput.value = defaultMax;
        if (priceMinRange)
            priceMinRange.value = defaultMin;
        if (priceMaxRange)
            priceMaxRange.value = defaultMax;
        // ===== SEARCH =====
        if (searchInput)
            searchInput.value = "";
        // ===== STORAGE =====
        localStorage.removeItem("rentDate");
        localStorage.removeItem("timeSlot");
        localStorage.removeItem("rentHours");
        localStorage.removeItem("minPrice");
        localStorage.removeItem("maxPrice");
        localStorage.removeItem("cart");
        updateCartCount();
        loadVenues();
    });
    // ============================
    // RESTORE
    // ============================
    var savedDate = localStorage.getItem("rentDate");
    var savedTime = localStorage.getItem("timeSlot");
    var savedHours = localStorage.getItem("rentHours");
    var savedMin = localStorage.getItem("minPrice");
    var savedMax = localStorage.getItem("maxPrice");
    ;
    if (savedDate && dateInput)
        dateInput.value = savedDate;
    if (savedHours && hourInput) {
        hourInput.value = savedHours;
        document
            .querySelectorAll(".duration-btn")
            .forEach(function (b) { return b.classList.remove("active"); });
        (_a = document
            .querySelector(".duration-btn[data-hour=\"".concat(savedHours, "\"]"))) === null || _a === void 0 ? void 0 : _a.classList.add("active");
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
    dateInput === null || dateInput === void 0 ? void 0 : dateInput.addEventListener("change", function () {
        localStorage.setItem("rentDate", dateInput.value);
        loadVenues();
    });
    timeSlot === null || timeSlot === void 0 ? void 0 : timeSlot.addEventListener("change", function () {
        localStorage.setItem("timeSlot", timeSlot.value);
        loadVenues();
    });
    // ============================
    // DURATION BUTTONS
    // ============================
    document
        .querySelectorAll(".duration-btn")
        .forEach(function (btn) {
        btn.addEventListener("click", function () {
            document
                .querySelectorAll(".duration-btn")
                .forEach(function (b) {
                return b.classList.remove("active");
            });
            btn.classList.add("active");
            var h = btn.dataset.hour || "3";
            if (hourInput)
                hourInput.value = h;
            localStorage.setItem("rentHours", h);
            loadVenues();
        });
    });
    // ============================
    // PRICE SYNC
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
    // LOAD BRANCH
    // ============================
    fetch("/sports_rental_system/customer/api/get_selected_branch.php")
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
            timeSlot.dataset.open = data.open_time;
            timeSlot.dataset.close = data.close_time;
            generateTimeSlots(data.open_time, data.close_time);
            if (savedTime)
                timeSlot.value = savedTime;
        }
        loadVenues();
    });
    // ============================
    // SEARCH
    // ============================
    searchInput === null || searchInput === void 0 ? void 0 : searchInput.addEventListener("input", function () {
        searchKeyword =
            searchInput.value.trim();
        loadVenues();
    });
    // ============================
    // LOAD CATEGORIES
    // ============================
    fetch("/sports_rental_system/customer/api/get_categories.php")
        .then(function (res) { return res.json(); })
        .then(function (res) {
        if (!res.success || !categoryBox)
            return;
        categoryBox.innerHTML = "";
        res.data.forEach(function (cat) {
            var label = document.createElement("label");
            label.innerHTML = "\n          <input type=\"checkbox\" value=\"".concat(cat.category_id, "\">\n          <span>").concat(cat.name, "</span>\n        ");
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
                loadVenues();
            });
            categoryBox.appendChild(label);
        });
    });
    // ============================
    // PROFILE
    // ============================
    fetch("/sports_rental_system/customer/api/get_profile.php")
        .then(function (res) { return res.json(); })
        .then(function (data) {
        var pointEl = document.getElementById("topPoints");
        if (pointEl && data.points !== undefined) {
            pointEl.textContent =
                "\u2B50 ".concat(data.points, " \u0E04\u0E30\u0E41\u0E19\u0E19");
        }
    });
    // ============================
    // LOAD VENUES (ROBUST)
    // ============================
    function loadVenues() {
        if (!selectedBranchId || !venueGrid)
            return;
        var date = (dateInput === null || dateInput === void 0 ? void 0 : dateInput.value) || "";
        var time = (timeSlot === null || timeSlot === void 0 ? void 0 : timeSlot.value) || "";
        var hours = (hourInput === null || hourInput === void 0 ? void 0 : hourInput.value) || "3";
        venueGrid.innerHTML =
            "<p class=\"loading-text\">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E19\u0E32\u0E21...</p>";
        var venueParams = new URLSearchParams();
        venueParams.set("branch_id", selectedBranchId);
        if (selectedCategories.length > 0)
            venueParams.set("categories", selectedCategories.join(","));
        if (minPriceInput === null || minPriceInput === void 0 ? void 0 : minPriceInput.value)
            venueParams.set("min_price", minPriceInput.value);
        if (maxPriceInput === null || maxPriceInput === void 0 ? void 0 : maxPriceInput.value)
            venueParams.set("max_price", maxPriceInput.value);
        if (searchKeyword !== "")
            venueParams.set("q", searchKeyword);
        fetch("/sports_rental_system/customer/api/get_venues.php?" +
            venueParams.toString())
            .then(function (r) { return r.json(); })
            .then(function (venueRes) {
            var availParams = new URLSearchParams();
            availParams.set("branch_id", selectedBranchId);
            availParams.set("date", date);
            availParams.set("time", time);
            availParams.set("hours", hours);
            fetch("/sports_rental_system/customer/api/get_available_venues.php?" +
                availParams.toString())
                .then(function (r) { return r.json(); })
                .catch(function () { return ({}); })
                .then(function (availRes) {
                console.log("AVAILABLE API:", availRes);
                venueGrid.innerHTML = "";
                var unavailable = [];
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
                var _loop_1 = function (i) {
                    var item = venueRes.data[i];
                    var disabled = false;
                    for (var j = 0; j < unavailable.length; j++) {
                        if (String(unavailable[j]) ===
                            String(item.venue_id)) {
                            disabled = true;
                            break;
                        }
                    }
                    var qty = getFieldQty(item.venue_id);
                    var card = document.createElement("div");
                    card.className = "equipment-card";
                    var img = item.image_url && item.image_url !== ""
                        ? item.image_url
                        : "images/no-image.png";
                    card.innerHTML = "\n                <img src=\"".concat(img, "\">\n                <h5 class=\"name\">").concat(item.name, "</h5>\n                <p class=\"price\">").concat(item.price_per_hour, " \u0E1A\u0E32\u0E17 / \u0E0A\u0E21.</p>\n\n                <div class=\"card-qty-controls\">\n                  <button class=\"qty-minus\" ").concat(disabled ? "disabled" : "", ">\u2212</button>\n                  <span class=\"qty-num\">").concat(qty, "</span>\n                  <button class=\"qty-plus\" ").concat(disabled ? "disabled" : "", ">+</button>\n                </div>\n\n                ").concat(disabled
                        ? "<div class=\"overlay-disabled\">\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E07\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E35\u0E49</div>"
                        : "", "\n              ");
                    if (disabled)
                        card.classList.add("disabled");
                    if (qty > 0)
                        card.classList.add("selected");
                    if (!disabled) {
                        var plusBtn = card.querySelector(".qty-plus");
                        var minusBtn = card.querySelector(".qty-minus");
                        plusBtn.addEventListener("click", function () {
                            if (!date || !time || !hours) {
                                alert("กรุณาเลือกวันที่ เวลา และจำนวนชั่วโมงก่อน");
                                return;
                            }
                            increaseField(item, date, time, hours);
                            updateFieldCard(card, item.venue_id);
                        });
                        minusBtn.addEventListener("click", function () {
                            decreaseField(item);
                            updateFieldCard(card, item.venue_id);
                        });
                    }
                    venueGrid.appendChild(card);
                };
                for (var i = 0; i < venueRes.data.length; i++) {
                    _loop_1(i);
                }
            });
        });
    }
    /* ===================================================
      CART HELPERS
    =================================================== */
    function getCart() {
        try {
            var raw = localStorage.getItem("cart");
            if (!raw)
                return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch (_a) {
            return [];
        }
    }
    function clearFieldInCart() {
        var cart = getCart()
            .filter(function (i) { return i.type !== "field"; });
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
    }
    function getFieldQty(id) {
        var cart = getCart();
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].type === "field" &&
                String(cart[i].id) === String(id)) {
                return cart[i].qty;
            }
        }
        return 0;
    }
    function increaseField(field, date, time, hours) {
        var cart = getCart();
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].type === "field" &&
                String(cart[i].id) ===
                    String(field.venue_id)) {
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
            date: date,
            time: time,
            hours: hours,
            category_id: field.category_id
        });
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
    }
    function decreaseField(field) {
        var cart = getCart();
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].type === "field" &&
                String(cart[i].id) ===
                    String(field.venue_id)) {
                cart.splice(i, 1);
                break;
            }
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
    }
    function updateFieldCard(card, id) {
        var qty = getFieldQty(id);
        var qtyText = card.querySelector(".qty-num");
        qtyText.textContent = qty.toString();
        if (qty > 0)
            card.classList.add("selected");
        else
            card.classList.remove("selected");
    }
    function updateCartCount() {
        var badge = document.getElementById("cartCount");
        if (!badge)
            return;
        var cart = getCart();
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += Number(cart[i].qty) || 0;
        }
        badge.textContent = total.toString();
    }
    // ===============================
    // GENERATE TIME SLOTS
    // ===============================
    function generateTimeSlots(openTime, closeTime) {
        var select = document.getElementById("timeSlot");
        if (!select)
            return;
        select.innerHTML =
            "<option value=\"\">\n      \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E27\u0E25\u0E32\n    </option>";
        var openHour = parseInt(openTime.split(":")[0]);
        var closeHour = parseInt(closeTime.split(":")[0]);
        var lastStartHour = closeHour - 3;
        for (var h = openHour; h <= lastStartHour; h++) {
            var hour = h < 10
                ? "0" + h
                : h.toString();
            var opt = document.createElement("option");
            opt.value = hour;
            opt.textContent =
                "".concat(hour, ":00 \u0E19.");
            select.appendChild(opt);
        }
    }
});
