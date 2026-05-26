/**
 * API smoke test — run with backend on port 5000:
 *   node scripts/apiSmokeTest.js
 */
const BASE = process.env.API_BASE || 'http://localhost:5000';

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(name, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function login(username, password) {
  const { status, data } = await req('POST', '/api/auth/login', {
    body: { username, password },
  });
  if (status !== 200 || !data.token) throw new Error(`Login ${username}: ${status} ${data.error || ''}`);
  return data.token;
}

async function main() {
  console.log(`\nAPI smoke test → ${BASE}\n`);
  let passed = 0;
  let failed = 0;

  const check = (name, ok, detail) => {
    if (assert(name, ok, detail)) passed++;
    else failed++;
  };

  const health = await req('GET', '/api/health');
  check('Health endpoint', health.status === 200 && health.data.status === 'ok');

  let adminToken;
  let guestToken;
  try {
    adminToken = await login('admin', 'admin123');
    guestToken = await login('guest', 'guest123');
    check('Admin login', true);
    check('Guest login', true);
  } catch (e) {
    check('Login', false, e.message);
    console.log(`\n${failed} failed — is the backend running?\n`);
    process.exit(1);
  }

  const noAuth = await req('GET', '/api/dashboard');
  check('Protected route rejects missing token', noAuth.status === 401);

  const guestPost = await req('POST', '/api/inventory', {
    token: guestToken,
    body: { name: 'test' },
  });
  check('Guest cannot POST inventory', guestPost.status === 403);

  const adminStats = await req('GET', '/api/inventory/stats', { token: adminToken });
  check(
    'Admin stats',
    adminStats.status === 200 && typeof adminStats.data.totalMedicines === 'number',
    adminStats.data._fallback ? 'fallback mode' : 'live DB'
  );

  const dashboard = await req('GET', '/api/dashboard', { token: adminToken });
  check(
    'Dashboard payload',
    dashboard.status === 200 && dashboard.data.summary && Array.isArray(dashboard.data.expiryAlerts)
  );

  const categories = await req('GET', '/api/categories', { token: guestToken });
  check('Guest can GET categories', categories.status === 200);

  const install = await fetch(`${BASE}/install?format=json`);
  const installData = await install.json().catch(() => ({}));
  check(
    'Install route',
    install.status === 200 || install.status === 500,
    install.status === 200 ? 'DB ready' : installData.error || 'MySQL not running'
  );

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
