import jwt from 'jsonwebtoken';

const WEAK_DEFAULT = 'medicare-drug-store-secret-change-in-production';

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set in .env (at least 32 characters) before running in production.'
      );
    }
    if (secret === WEAK_DEFAULT) {
      throw new Error('JWT_SECRET cannot use the default placeholder in production.');
    }
    return secret;
  }

  if (!secret) {
    console.warn('[auth] JWT_SECRET not set — using development-only default. Set JWT_SECRET in .env.');
    return WEAK_DEFAULT;
  }

  return secret;
}

export const JWT_SECRET = resolveJwtSecret();

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar_initials: user.avatar_initials,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Login required. Please sign in.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Guest accounts have view-only access. Admin permission required.',
    });
  }
  next();
}
