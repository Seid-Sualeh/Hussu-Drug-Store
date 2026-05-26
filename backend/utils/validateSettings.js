const ALLOWED_KEYS = new Set([
  'pharmacy_name',
  'currency',
  'expiry_alert_days',
  'low_stock_alert',
  'email',
  'phone',
  'address',
  'tax_rate',
]);

export function sanitizeSettingsBody(body) {
  if (!body || typeof body !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_KEYS.has(key)) {
      out[key] = String(value ?? '').slice(0, 500);
    }
  }
  return out;
}
