fetch("/sports_rental_system/api/equipment.php")
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    var tbody = document.querySelector("#equipment-table tbody");
    tbody.innerHTML = "";
    data.forEach(function (item) {
      var tr = document.createElement("tr");
      tr.innerHTML = "\n                <td>"
        .concat(item.equipment_id, "</td>\n<td>")
        .concat(item.category_id, "</td>\n<td>")
        .concat(item.name, '</td>\n<td><img src="')
        .concat(item.image_url, '" width="80"></td>\n<td>')
        .concat(
          Number(item.price_per_unit).toFixed(2),
          "</td>\n                <td>",
        )
        .concat(item.total_stock, "</td>\n                <td>")
        .concat(item.description, "</td>\n            ");
      tbody.appendChild(tr);
    });
  })
  .catch(function (err) {
    return console.error("Fetch error:", err);
  });
