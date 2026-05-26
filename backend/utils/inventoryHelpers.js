export function getStockStatus(qty, minLimit, maxLimit) {
  if (qty === 0) return 'Out of Stock';
  if (qty < minLimit) return 'Under Stock';
  if (qty > maxLimit) return 'Over Stock';
  return 'Normal';
}

export function getExpiryInfo(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry - today;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const expIn6Months = expiry <= sixMonthsFromNow;

  let alertText = '';
  let alertType = 'safe';
  if (daysLeft < 0) {
    alertText = `Expired ${Math.abs(daysLeft)} days ago`;
    alertType = 'expired';
  } else if (expIn6Months) {
    alertText = daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} days`;
    alertType = 'expiring';
  } else {
    alertText = `Expires in ${daysLeft} days`;
    alertType = 'safe';
  }

  return {
    daysLeft,
    expIn6Months: expIn6Months && daysLeft >= 0,
    expIn6MonthsLabel: expIn6Months && daysLeft >= 0 ? 'Yes' : 'No',
    alertText,
    alertType,
  };
}

export function formatMedicineRow(row, index) {
  const profit = Number(row.sell_price) - Number(row.buy_price);
  const profitPct =
    Number(row.buy_price) > 0
      ? ((profit / Number(row.buy_price)) * 100).toFixed(1)
      : '0.0';
  const stockStatus = getStockStatus(row.qty, row.min_limit, row.max_limit);
  const expiry = getExpiryInfo(row.expiry_date);

  return {
    id: row.id,
    index,
    name: row.name,
    strengthForm: row.strength_form,
    displayName: `${row.name} - ${row.strength_form}`,
    categoryId: row.category_id ?? null,
    categoryName: row.category_name || '—',
    supplierId: row.supplier_id ?? null,
    supplierName: row.supplier_name || '—',
    qty: row.qty,
    expiryDate: row.expiry_date,
    expIn6Months: expiry.expIn6MonthsLabel,
    alert: expiry.alertText,
    alertType: expiry.alertType,
    minLimit: row.min_limit,
    maxLimit: row.max_limit,
    stockStatus,
    buyPrice: Number(row.buy_price),
    sellPrice: Number(row.sell_price),
    profit: Number(profit.toFixed(2)),
    profitPct: `${profitPct}%`,
    shelfNo: row.shelf_no || '—',
    notes: row.notes || '—',
  };
}
