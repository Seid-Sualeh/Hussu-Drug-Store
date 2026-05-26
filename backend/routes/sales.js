import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM sales');
    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*) AS totalSales,
        COALESCE(SUM(total_amount), 0) AS totalRevenue,
        COALESCE(SUM(profit), 0) AS totalProfit,
        COALESCE(SUM(quantity), 0) AS totalUnits
      FROM sales
    `);

    const [rows] = await pool.query(`
      SELECT s.*, m.name AS medicine_name, m.strength_form
      FROM sales s
      JOIN medicines m ON s.medicine_id = m.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({
      summary: {
        totalSales: Number(summary.totalSales),
        totalRevenue: Number(summary.totalRevenue),
        totalProfit: Number(summary.totalProfit),
        totalUnits: Number(summary.totalUnits),
      },
      items: rows.map((r) => ({
        id: r.id,
        medicineId: r.medicine_id,
        medicineName: r.medicine_name,
        strengthForm: r.strength_form,
        displayName: `${r.medicine_name} - ${r.strength_form}`,
        quantity: r.quantity,
        unitPrice: Number(r.unit_price),
        buyPrice: Number(r.buy_price),
        totalAmount: Number(r.total_amount),
        profit: Number(r.profit),
        profitPct:
          Number(r.buy_price) > 0
            ? (((Number(r.unit_price) - Number(r.buy_price)) / Number(r.buy_price)) * 100).toFixed(1) + '%'
            : '0%',
        customerName: r.customer_name || '—',
        notes: r.notes || '—',
        createdAt: r.created_at,
      })),
      pagination: { page, limit, total: Number(total), totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { medicineId, quantity, unitPrice, customerName, notes } = req.body;
    const qty = parseInt(quantity, 10);
    if (!medicineId || !qty || qty < 1) {
      return res.status(400).json({ error: 'Valid medicine and quantity required' });
    }

    await conn.beginTransaction();
    const [[med]] = await conn.query(
      'SELECT qty, buy_price, sell_price FROM medicines WHERE id = ? FOR UPDATE',
      [medicineId]
    );
    if (!med) {
      await conn.rollback();
      return res.status(404).json({ error: 'Medicine not found' });
    }
    if (med.qty < qty) {
      await conn.rollback();
      return res.status(400).json({ error: `Insufficient stock. Available: ${med.qty}` });
    }

    const price = unitPrice != null ? Number(unitPrice) : Number(med.sell_price);
    const buy = Number(med.buy_price);
    const total = price * qty;
    const profit = (price - buy) * qty;
    const newQty = med.qty - qty;

    await conn.query('UPDATE medicines SET qty = ? WHERE id = ?', [newQty, medicineId]);

    const [saleResult] = await conn.query(
      `INSERT INTO sales (medicine_id, quantity, unit_price, buy_price, total_amount, profit, customer_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicineId, qty, price, buy, total, profit, customerName || null, notes || null]
    );

    await conn.query(
      `INSERT INTO stock_movements
       (type, medicine_id, quantity, reason, notes, previous_qty, new_qty)
       VALUES ('out', ?, ?, 'Sale', ?, ?, ?)`,
      [medicineId, qty, notes || `Sale #${saleResult.insertId}`, med.qty, newQty]
    );

    await conn.commit();
    res.status(201).json({
      id: saleResult.insertId,
      totalAmount: total,
      profit,
      newQty,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

export default router;
