import { Router } from 'express';
import pool from '../config/db.js';
import { sanitizeSettingsBody } from '../utils/validateSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const DEFAULTS = {
  pharmacy_name: 'MediCare Drug Store',
  currency: 'ETB',
  expiry_alert_days: '180',
  low_stock_alert: '1',
  email: '',
  phone: '',
  address: '',
  tax_rate: '0',
};

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = { ...DEFAULTS };
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', asyncHandler(async (req, res) => {
  const updates = sanitizeSettingsBody(req.body);
  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No valid settings provided' });
  }
  try {
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, String(value ?? '')]
      );
    }
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = { ...DEFAULTS };
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

export default router;
