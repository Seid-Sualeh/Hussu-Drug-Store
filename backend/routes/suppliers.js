import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, COUNT(m.id) AS medicine_count, COALESCE(SUM(m.qty), 0) AS total_qty
      FROM suppliers s
      LEFT JOIN medicines m ON m.supplier_id = s.id
      GROUP BY s.id
      ORDER BY medicine_count DESC, s.name ASC
    `);
    res.json(rows.map((r) => ({
      id: r.id,
      name: r.name,
      contactPhone: r.contact_phone,
      contactEmail: r.contact_email,
      address: r.address,
      medicineCount: Number(r.medicine_count),
      totalQty: Number(r.total_qty),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Supplier not found' });
    const r = rows[0];
    res.json({
      id: r.id,
      name: r.name,
      contactPhone: r.contact_phone,
      contactEmail: r.contact_email,
      address: r.address,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, contactPhone, contactEmail, address } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, contact_phone, contact_email, address) VALUES (?, ?, ?, ?)',
      [name, contactPhone || null, contactEmail || null, address || null]
    );
    res.status(201).json({ id: result.insertId, name, contactPhone, contactEmail, address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, contactPhone, contactEmail, address } = req.body;
    await pool.query(
      'UPDATE suppliers SET name = ?, contact_phone = ?, contact_email = ?, address = ? WHERE id = ?',
      [name, contactPhone || null, contactEmail || null, address || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE medicines SET supplier_id = NULL WHERE supplier_id = ?', [req.params.id]);
    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
