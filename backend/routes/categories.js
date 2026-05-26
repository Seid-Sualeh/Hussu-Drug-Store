import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(m.id) AS medicine_count, COALESCE(SUM(m.qty), 0) AS total_qty
      FROM categories c
      LEFT JOIN medicines m ON m.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.id ASC
    `);
    res.json(rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      sortOrder: r.sort_order,
      medicineCount: Number(r.medicine_count),
      totalQty: Number(r.total_qty),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, sortOrder } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO categories (code, name, sort_order) VALUES (?, ?, ?)',
      [code || null, name, sortOrder ?? 99]
    );
    res.status(201).json({ id: result.insertId, code, name, sortOrder: sortOrder ?? 99 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { code, name, sortOrder } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const [result] = await pool.query(
      'UPDATE categories SET code = ?, name = ?, sort_order = ? WHERE id = ?',
      [code || null, name.trim(), sortOrder ?? 0, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM medicines WHERE category_id = ?',
      [req.params.id]
    );
    if (count > 0) {
      return res.status(400).json({ error: 'Cannot delete category with linked medicines' });
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
