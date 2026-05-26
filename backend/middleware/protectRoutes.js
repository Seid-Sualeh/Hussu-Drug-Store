import { authenticate, requireAdmin } from './auth.js';

const ADMIN_ONLY = [
  { method: 'POST', pattern: /^\/api\/inventory\/?$/ },
  { method: 'PUT', pattern: /^\/api\/inventory\/\d+$/ },
  { method: 'DELETE', pattern: /^\/api\/inventory\/\d+$/ },
  { method: 'POST', pattern: /^\/api\/categories\/?$/ },
  { method: 'PUT', pattern: /^\/api\/categories\/\d+$/ },
  { method: 'DELETE', pattern: /^\/api\/categories\/\d+$/ },
  { method: 'POST', pattern: /^\/api\/suppliers\/?$/ },
  { method: 'PUT', pattern: /^\/api\/suppliers\/\d+$/ },
  { method: 'DELETE', pattern: /^\/api\/suppliers\/\d+$/ },
  { method: 'POST', pattern: /^\/api\/stock\/(in|out)$/ },
  { method: 'POST', pattern: /^\/api\/sales\/?$/ },
  { method: 'GET', pattern: /^\/api\/settings\/?$/ },
  { method: 'PUT', pattern: /^\/api\/settings\/?$/ },
  { method: 'PATCH', pattern: /^\/api\/notifications\/\d+\/read$/ },
];

const PUBLIC_PATHS = ['/api/health', '/api/auth/login'];
// /api/auth/me requires token — not public

export function protectApiRoutes(app) {
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) return next();
    if (PUBLIC_PATHS.includes(req.path)) return next();

    authenticate(req, res, () => {
      const needsAdmin = ADMIN_ONLY.some(
        (r) => r.method === req.method && r.pattern.test(req.path)
      );
      if (needsAdmin) return requireAdmin(req, res, next);
      next();
    });
  });
}
