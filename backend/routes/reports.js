import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

router.get('/summary', async (req, res) => {
  try {
    const [[inv]] = await pool.query(`
      SELECT COUNT(*) AS medicines, SUM(qty) AS qty,
        SUM((sell_price - buy_price) * qty) AS profit,
        SUM(qty * buy_price) AS value
      FROM medicines
    `);
    const [[sales]] = await pool.query(`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(SUM(profit), 0) AS profit
      FROM sales WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    const [[stock]] = await pool.query(`
      SELECT
        SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) AS stockIn,
        SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) AS stockOut
      FROM stock_movements WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    res.json({
      inventory: {
        medicines: Number(inv.medicines),
        totalQty: Number(inv.qty),
        potentialProfit: Number(inv.profit),
        inventoryValue: Number(inv.value),
      },
      salesLast30Days: {
        count: Number(sales.count),
        revenue: Number(sales.revenue),
        profit: Number(sales.profit),
      },
      stockLast30Days: {
        stockIn: Number(stock.stockIn),
        stockOut: Number(stock.stockOut),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/expiry', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.name, m.strength_form, m.expiry_date, m.qty, c.name AS category,
        DATEDIFF(m.expiry_date, CURDATE()) AS days_left
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
      ORDER BY m.expiry_date ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stock-movements', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sm.type, sm.quantity, sm.reason, sm.created_at,
        m.name AS medicine_name, m.strength_form
      FROM stock_movements sm
      JOIN medicines m ON sm.medicine_id = m.id
      ORDER BY sm.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const [byDay] = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS sales, SUM(total_amount) AS revenue, SUM(profit) AS profit
      FROM sales
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    const [byCategory] = await pool.query(`
      SELECT COALESCE(c.name, 'Uncategorized') AS category,
        SUM(s.total_amount) AS revenue, SUM(s.profit) AS profit, SUM(s.quantity) AS units
      FROM sales s
      JOIN medicines m ON s.medicine_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `);
    res.json({ byDay, byCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.name, m.strength_form, m.qty, m.min_limit, m.max_limit, c.name AS category
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.qty = 0 OR m.qty < m.min_limit
      ORDER BY m.qty ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
