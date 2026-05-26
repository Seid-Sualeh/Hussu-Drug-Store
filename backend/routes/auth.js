import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { signToken, authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isDbConnectionError } from '../utils/dbQuery.js';
import { DEMO_USERS, isDemoLoginAllowed } from '../utils/demoAuth.js';
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

function loginError(msg) {
  if (isProduction) {
    return { error: 'Authentication failed. Please check credentials and try again.' };
  }
  return { error: msg };
}

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
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const key = username.trim().toLowerCase();

    try {
      const [rows] = await pool.query(
        'SELECT id, username, password_hash, name, role, avatar_initials, email FROM users WHERE username = ?',
        [key]
      );

      if (rows.length) {
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
        return res.json({
          token: signToken(payload),
          user: payload,
        });
      }
    } catch (err) {
      if (!isDbConnectionError(err)) throw err;
    }

    if (!isDevelopment) {
      return res.status(503).json({ error: 'Service unavailable' });
    }

    if (!isDemoLoginAllowed()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const demo = DEMO_USERS[key];
    if (!demo) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validDemo = await bcrypt.compare(password, demo.passwordHash);
    if (!validDemo) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const payload = userResponse(demo, 8);
    res.json({
      token: signToken(payload),
      user: payload,
      _fallback: true,
    });
  } catch (err) {
    res.status(500).json(loginError(err.message || 'Login failed'));
  }
});

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  try {
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
    return res.json({
      user: userResponse({
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role,
        avatar_initials: req.user.avatar_initials,
        email: req.user.email,
      }),
    });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return res.json({
        user: userResponse({
          id: req.user.id,
          username: req.user.username,
          name: req.user.name,
          role: req.user.role,
          avatar_initials: req.user.avatar_initials,
          email: req.user.email,
        }),
      });
    }
    throw err;
  }
}));

export default router;
