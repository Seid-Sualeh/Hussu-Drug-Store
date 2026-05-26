import { Router } from 'express';
import { setupDatabase } from '../scripts/setupDatabase.js';

const router = Router();

/**
 * Install endpoint - development only.
 * NEVER expose in production - it drops/creates tables!
 */
function isInstallAllowed() {
  return process.env.NODE_ENV !== 'production';
}

function installHtml(result, error) {
  if (error) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Install Failed</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 24px; background: #fef2f2; }
    h1 { color: #b91c1c; margin: 0 0 16px; }
    pre { background: #fff; padding: 16px; border-radius: 8px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Install Failed</h1>
  <pre>${String(error || '').replace(/[<>'"]/g, '')}</pre>
  <p>Check server logs for details.</p>
</body>
</html>`;
  }

  const tableRows = result.tables
    .map((t) => `<tr><td>${t.name}</td><td>${t.created ? '✓ Created' : '✗ Missing'}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Install Complete - Hussu Drug Store</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 32px 24px; background: linear-gradient(135deg, #ecfdf5, #f8fafc); color: #111827; }
    .card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
    h1 { color: #059669; margin: 0 0 8px; font-size: 26px; }
    .badge { display: inline-block; background: #d1fae5; color: #047857; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    h2 { font-size: 16px; margin: 24px 0 12px; color: #374151; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .steps { background: #f0fdf4; border-radius: 8px; padding: 16px 20px; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin: 8px 0; }
    a.btn { display: inline-block; margin-top: 20px; background: #10b981; color: #fff !important; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; }
    a.btn:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Database Install Complete</h1>
    <span class="badge">All tables are created</span>
    <p>Database is ready.</p>

    <h2>Tables (${result.tables.length})</h2>
    <table>
      <thead><tr><th>Table</th><th>Status</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>

    <h2>Seed data counts</h2>
    <table>
      <tr><td>Users</td><td>${result.counts.users}</td></tr>
      <tr><td>Categories</td><td>${result.counts.categories}</td></tr>
      <tr><td>Suppliers</td><td>${result.counts.suppliers}</td></tr>
      <tr><td>Medicines</td><td>${result.counts.medicines}</td></tr>
    </table>

    <div class="steps">
      <h2 style="margin-top:0">Next steps</h2>
      <ol>
        <li>Start backend: <code>cd backend && node server.js</code></li>
        <li>Start frontend: <code>cd frontend && npm run dev</code></li>
        <li>Open http://localhost:3000/welcome and sign in</li>
      </ol>
    </div>

    <a class="btn" href="http://localhost:3000/welcome">Open application →</a>
  </div>
</body>
</html>`;
}

router.get('/', async (req, res) => {
  const format = req.query.format;

  if (!isInstallAllowed()) {
    const message = 'Installation is not available in production.';
    if (format === 'json') {
      return res.status(403).json({ success: false, error: message });
    }
    res.status(403).setHeader('Content-Type', 'text/html');
    return res.send(installHtml(null, message));
  }

  try {
    const result = await setupDatabase();

    if (format === 'json') {
      const { logins, ...safeResult } = result;
      return res.json({
        success: true,
        message: 'Setup complete',
        ...safeResult,
      });
    }

    res.setHeader('Content-Type', 'text/html');
    return res.send(installHtml(result));
  } catch (err) {
    const message = err.message || String(err);
    console.error('Install route error:', message);

    if (format === 'json') {
      return res.status(500).json({ success: false, error: 'Installation failed' });
    }

    res.status(500).setHeader('Content-Type', 'text/html');
    return res.send(installHtml(null, 'Installation failed. Check server logs.'));
  }
});

export default router;
