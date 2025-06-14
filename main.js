let stockData;

async function updateStock() {
  const salesFile = document.getElementById('salesFile').files[0];
  const purchaseFile = document.getElementById('purchaseFile').files[0];
  if (!salesFile || !purchaseFile) return alert("Please upload both files.");

  const [sales, purchases] = await Promise.all([readExcel(salesFile), readExcel(purchaseFile)]);
  const salesMap = {}, purchaseMap = {};

  sales.forEach(row => {
    const code = row['item code'];
    if (!salesMap[code]) salesMap[code] = 0;
    salesMap[code] += parseFloat(row['quantity']) || 0;
  });

  purchases.forEach(row => {
    const code = row['item code'];
    if (!purchaseMap[code]) purchaseMap[code] = 0;
    purchaseMap[code] += parseFloat(row['quantity']) || 0;
  });

  const updated = stockData.map(item => {
    const code = item['item code'];
    const salesQty = salesMap[code] || 0;
    const purchaseQty = purchaseMap[code] || 0;
    item['stock'] = (parseFloat(item['stock']) || 0) - salesQty + purchaseQty;
    return item;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(updated);
  XLSX.utils.book_append_sheet(wb, ws, "Updated Stock");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  const link = document.getElementById('downloadLink');
  link.href = URL.createObjectURL(blob);
  link.download = "Updated_Stock.xlsx";
  link.style.display = 'inline-block';
  link.textContent = "⬇️ Download Updated Stock";
}

function readExcel(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
      if (!stockData && file.name.toLowerCase().includes("stock")) stockData = json;
      resolve(json);
    };
    reader.readAsArrayBuffer(file);
  });
}