import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, title, message, type, is_read AS isRead, created_at AS createdAt FROM notifications ORDER BY created_at DESC LIMIT 50'
  );
  res.json(rows);
});

router.get('/count', async (req, res) => {
  const [[row]] = await pool.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0'
  );
  res.json({ count: Number(row.count) });
});

router.patch('/:id/read', async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

export default router;
