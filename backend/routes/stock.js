import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

const MOVEMENT_SELECT = `
  SELECT sm.*, m.name AS medicine_name, m.strength_form, s.name AS supplier_name
  FROM stock_movements sm
  JOIN medicines m ON sm.medicine_id = m.id
  LEFT JOIN suppliers s ON sm.supplier_id = s.id
`;

router.get('/', async (req, res) => {
  try {
    const type = req.query.type;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    if (type === 'in' || type === 'out') {
      conditions.push('sm.type = ?');
      params.push(type);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM stock_movements sm ${where}`,
      params
    );

    const [rows] = await pool.query(
      `${MOVEMENT_SELECT} ${where} ORDER BY sm.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        medicineId: r.medicine_id,
        medicineName: r.medicine_name,
        strengthForm: r.strength_form,
        displayName: `${r.medicine_name} - ${r.strength_form}`,
        quantity: r.quantity,
        supplierId: r.supplier_id,
        supplierName: r.supplier_name || '—',
        referenceNo: r.reference_no || '—',
        reason: r.reason || '—',
        notes: r.notes || '—',
        previousQty: r.previous_qty,
        newQty: r.new_qty,
        createdAt: r.created_at,
      })),
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/in', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { medicineId, quantity, supplierId, referenceNo, reason, notes } = req.body;
    const qty = parseInt(quantity, 10);
    if (!medicineId || !qty || qty < 1) {
      return res.status(400).json({ error: 'Valid medicine and quantity required' });
    }

    await conn.beginTransaction();
    const [[med]] = await conn.query('SELECT qty FROM medicines WHERE id = ? FOR UPDATE', [medicineId]);
    if (!med) {
      await conn.rollback();
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const prev = med.qty;
    const newQty = prev + qty;
    await conn.query('UPDATE medicines SET qty = ? WHERE id = ?', [newQty, medicineId]);

    const [result] = await conn.query(
      `INSERT INTO stock_movements
       (type, medicine_id, quantity, supplier_id, reference_no, reason, notes, previous_qty, new_qty)
       VALUES ('in', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineId,
        qty,
        supplierId || null,
        referenceNo || null,
        reason || 'Stock In',
        notes || null,
        prev,
        newQty,
      ]
    );

    await conn.commit();
    res.status(201).json({ id: result.insertId, previousQty: prev, newQty });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.post('/out', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { medicineId, quantity, reason, notes } = req.body;
    const qty = parseInt(quantity, 10);
    if (!medicineId || !qty || qty < 1) {
      return res.status(400).json({ error: 'Valid medicine and quantity required' });
    }

    await conn.beginTransaction();
    const [[med]] = await conn.query('SELECT qty FROM medicines WHERE id = ? FOR UPDATE', [medicineId]);
    if (!med) {
      await conn.rollback();
      return res.status(404).json({ error: 'Medicine not found' });
    }
    if (med.qty < qty) {
      await conn.rollback();
      return res.status(400).json({ error: `Insufficient stock. Available: ${med.qty}` });
    }

    const prev = med.qty;
    const newQty = prev - qty;
    await conn.query('UPDATE medicines SET qty = ? WHERE id = ?', [newQty, medicineId]);

    const [result] = await conn.query(
      `INSERT INTO stock_movements
       (type, medicine_id, quantity, reference_no, reason, notes, previous_qty, new_qty)
       VALUES ('out', ?, ?, NULL, ?, ?, ?, ?)`,
      [medicineId, qty, reason || 'Stock Out', notes || null, prev, newQty]
    );

    await conn.commit();
    res.status(201).json({ id: result.insertId, previousQty: prev, newQty });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

export default router;
