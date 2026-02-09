interface Equipment {
  equipment_id: string;
  category_id: number;
  name: string;
  image_url: string;
  price_per_unit: string;
  total_stock: number;
  description: string;
}

fetch("/sports_rental_system/customer/api/equipment.php")
  .then(res => res.json())
  .then((data: Equipment[]) => {

    const tbody =
      document.querySelector<HTMLTableSectionElement>(
        "#equipment-table tbody"
      )!;

    tbody.innerHTML = "";

    data.forEach(item => {

      const tr = document.createElement("tr");

      tr.innerHTML = `
                <td>${item.equipment_id}</td>
                <td>${item.category_id}</td>
                <td>${item.name}</td>
                <td><img src="${item.image_url}" width="80"></td>
                <td>${Number(item.price_per_unit).toFixed(2)}</td>
                <td>${item.total_stock}</td>
                <td>${item.description}</td>
            `;

      tbody.appendChild(tr);
    });

  })
  .catch(err => console.error("Fetch error:", err));
