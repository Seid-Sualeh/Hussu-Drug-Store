import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { signToken, authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function userResponse(user, notificationCount = 0) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar_initials: user.avatar_initials,
    email: user.email,
    notification_count: notificationCount,
  };
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const key = username.trim().toLowerCase();

  const [rows] = await pool.query(
    'SELECT id, username, password_hash, name, role, avatar_initials, email FROM users WHERE username = ?',
    [key]
  );

  if (!rows.length) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  let notificationCount = 0;
  try {
    const [[n]] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0'
    );
    notificationCount = Number(n.count);
  } catch {
    /* ignore */
  }

  const payload = userResponse(user, notificationCount);
  res.json({
    token: signToken(payload),
    user: payload,
  });
});

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, name, role, avatar_initials, email FROM users WHERE id = ?',
    [req.user.id]
  );
  if (rows.length) {
    let notificationCount = 0;
    try {
      const [[n]] = await pool.query(
        'SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0'
      );
      notificationCount = Number(n.count);
    } catch {
      /* ignore */
    }
    return res.json({ user: userResponse(rows[0], notificationCount) });
  }
  return res.status(404).json({ error: 'User not found' });
}));

export default router;