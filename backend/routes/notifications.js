import { Router } from 'express';
import pool from '../config/db.js';
import { withDb, dbErrorMessage } from '../utils/dbQuery.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const rows = await withDb(
      async (db) => {
        const [list] = await db.query(
          'SELECT id, title, message, type, is_read AS isRead, created_at AS createdAt FROM notifications ORDER BY created_at DESC LIMIT 50'
        );
        return list;
      },
      () => [
        { id: 1, title: 'Low Stock Alert', message: '23 medicines below min', type: 'low_stock', isRead: 0, createdAt: new Date() },
        { id: 2, title: 'Expiring Soon', message: '17 medicines expiring', type: 'expiry', isRead: 0, createdAt: new Date() },
      ]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

router.get('/count', async (req, res) => {
  try {
    const result = await withDb(
      async (db) => {
        const [[row]] = await db.query(
          'SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0'
        );
        return { count: Number(row.count) };
      },
      () => ({ count: 8 })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: dbErrorMessage(err) });
  }
});

export default router;
