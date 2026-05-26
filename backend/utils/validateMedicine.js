function trimStr(v, max = 500) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function parsePositiveInt(v, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return n;
}

function parseMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function isValidDate(v) {
  if (!v) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

export function validateMedicineBody(body, { partial = false } = {}) {
  const errors = [];
  const name = trimStr(body?.name, 255);
  const strengthForm = trimStr(body?.strengthForm, 255);

  if (!partial) {
    if (!name) errors.push('Medicine name is required');
    if (!strengthForm) errors.push('Strength / form is required');
    if (!isValidDate(body?.expiryDate)) errors.push('Valid expiry date is required');
    if (parseMoney(body?.buyPrice) == null) errors.push('Valid buy price is required');
    if (parseMoney(body?.sellPrice) == null) errors.push('Valid sell price is required');
  }

  const qty = parsePositiveInt(body?.qty, partial ? undefined : 0);
  const minLimit = parsePositiveInt(body?.minLimit, partial ? undefined : 10);
  const maxLimit = parsePositiveInt(body?.maxLimit, partial ? undefined : 500);

  if (minLimit != null && maxLimit != null && minLimit > maxLimit) {
    errors.push('Min limit cannot exceed max limit');
  }

  const buyPrice = body?.buyPrice != null ? parseMoney(body.buyPrice) : null;
  const sellPrice = body?.sellPrice != null ? parseMoney(body.sellPrice) : null;
  if (buyPrice != null && sellPrice != null && sellPrice < buyPrice) {
    errors.push('Sell price should not be less than buy price');
  }

  const categoryId = body?.categoryId ? parseInt(body.categoryId, 10) : null;
  const supplierId = body?.supplierId ? parseInt(body.supplierId, 10) : null;
  if (body?.categoryId && (Number.isNaN(categoryId) || categoryId < 1)) {
    errors.push('Invalid category');
  }
  if (body?.supplierId && (Number.isNaN(supplierId) || supplierId < 1)) {
    errors.push('Invalid supplier');
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  const data = {};
  if (name != null) data.name = name;
  if (strengthForm != null) data.strengthForm = strengthForm;
  if (body?.categoryId !== undefined) data.categoryId = categoryId;
  if (body?.supplierId !== undefined) data.supplierId = supplierId;
  if (body?.qty !== undefined) data.qty = qty;
  if (body?.expiryDate !== undefined) data.expiryDate = body.expiryDate;
  if (body?.minLimit !== undefined) data.minLimit = minLimit;
  if (body?.maxLimit !== undefined) data.maxLimit = maxLimit;
  if (body?.buyPrice !== undefined) data.buyPrice = buyPrice;
  if (body?.sellPrice !== undefined) data.sellPrice = sellPrice;
  if (body?.shelfNo !== undefined) data.shelfNo = trimStr(body.shelfNo, 50);
  if (body?.notes !== undefined) data.notes = trimStr(body.notes, 1000);

  return { ok: true, data };
}
