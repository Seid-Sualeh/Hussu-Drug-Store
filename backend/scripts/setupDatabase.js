import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXPECTED_TABLES = [
  'users',
  'categories',
  'suppliers',
  'medicines',
  'stock_movements',
  'sales',
  'settings',
  'notifications',
];

function log(line) {
  console.log(line);
}

export async function setupDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'medicare_drug_store';

  log('');
  log('========================================');
  log('  DATABASE INSTALL - Hussu Drug Store');
  log('========================================');
  log(`Host: ${host}`);
  log(`Database: ${dbName}`);
  log('');

  const conn = await mysql.createConnection({
    host,
    user,
    password,
    multipleStatements: true,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  log(`✓ Database created (or already exists): ${dbName}`);

  await conn.query(`USE \`${dbName}\``);

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  const seed = readFileSync(join(__dirname, 'seed.sql'), 'utf8');

  log('');
  log('Creating tables...');
  await conn.query(schema);

  const [tableRows] = await conn.query('SHOW TABLES');
  const createdTables = tableRows.map((row) => Object.values(row)[0]);

  EXPECTED_TABLES.forEach((name) => {
    if (createdTables.includes(name)) {
      log(`✓ Table created: ${name}`);
    } else {
      log(`✗ Table missing: ${name}`);
    }
  });

  const allPresent = EXPECTED_TABLES.every((t) => createdTables.includes(t));
  if (allPresent) {
    log('');
    log(`✓ All tables are created (${EXPECTED_TABLES.length}/${EXPECTED_TABLES.length})`);
  } else {
    log('');
    log(`⚠ Warning: expected ${EXPECTED_TABLES.length} tables, found ${createdTables.length}`);
  }

  log('');
  log('Inserting seed data...');
  await conn.query(seed);

  const [countRows] = await conn.query('SELECT COUNT(*) AS c FROM medicines');
  let current = countRows[0].c;
  const targetTotal = 1256;

  const names = [
    'Ibuprofen', 'Diclofenac', 'Ranitidine', 'Pantoprazole', 'Losartan',
    'Amlodipine', 'Levothyroxine', 'Salbutamol', 'Montelukast', 'Clopidogrel',
    'Warfarin', 'Furosemide', 'Hydrochlorothiazide', 'Prednisolone', 'Dexamethasone',
    'Fluconazole', 'Clotrimazole', 'Betamethasone', 'Telmisartan', 'Rosuvastatin',
  ];
  const forms = [
    '250mg - Tablet', '500mg - Capsule', '5mg - Syrup', '10mg - Injection', '1% - Cream',
  ];

  while (current < targetTotal) {
    const batch = [];
    for (let i = 0; i < 50 && current < targetTotal; i++, current++) {
      const n = names[current % names.length];
      const cat = (current % 13) + 1;
      const sup = (current % 8) + 1;
      const qtyPattern = current % 47;
      let qty;
      if (qtyPattern === 0) qty = 0;
      else if (qtyPattern < 5) qty = 5 + (current % 8);
      else if (qtyPattern < 10) qty = 600 + (current % 100);
      else qty = 20 + (current % 200);

      const minL = 15 + (current % 20);
      const maxL = 200 + (current % 300);
      const buy = 5 + (current % 200);
      const sell = buy + 5 + (current % 50);
      const monthsAhead = (current % 24) - 2;
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + monthsAhead);

      batch.push([
        `${n} ${current}`,
        forms[current % forms.length],
        cat,
        sup,
        qty,
        expiry.toISOString().slice(0, 10),
        minL,
        maxL,
        buy,
        sell,
        `${String.fromCharCode(65 + (current % 8))}-${String((current % 9) + 1).padStart(2, '0')}-${String((current % 12) + 1).padStart(2, '0')}`,
        current % 5 === 0 ? 'Bulk stock' : null,
      ]);
    }
    await conn.query(
      `INSERT INTO medicines (name, strength_form, category_id, supplier_id, qty, expiry_date, min_limit, max_limit, buy_price, sell_price, shelf_no, notes) VALUES ?`,
      [batch]
    );
  }

  const adminHash = await bcrypt.hash('admin123', 10);
  const guestHash = await bcrypt.hash('guest123', 10);
  await conn.query('UPDATE users SET password_hash = ? WHERE username = ?', [adminHash, 'admin']);
  await conn.query('UPDATE users SET password_hash = ? WHERE username = ?', [guestHash, 'guest']);

  const [[medStats]] = await conn.query(`
    SELECT COUNT(*) AS medicines, COALESCE(SUM(qty), 0) AS qty
    FROM medicines
  `);
  const [[userCount]] = await conn.query('SELECT COUNT(*) AS c FROM users');
  const [[catCount]] = await conn.query('SELECT COUNT(*) AS c FROM categories');
  const [[supCount]] = await conn.query('SELECT COUNT(*) AS c FROM suppliers');
  const [[notifCount]] = await conn.query('SELECT COUNT(*) AS c FROM notifications');

  log(`✓ Users: ${userCount.c} (admin + guest)`);
  log(`✓ Categories: ${catCount.c}`);
  log(`✓ Suppliers: ${supCount.c}`);
  log(`✓ Medicines: ${medStats.medicines}`);
  log(`✓ Notifications: ${notifCount.c}`);
  log(`✓ Stock movements & sales sample rows inserted`);
  log(`✓ Settings configured`);
  log('');
  log('Login credentials:');
  log('  Admin (full access):  admin / admin123');
  log('  Guest (view only):    guest / guest123');
  log('');
  log('========================================');
  log('  INSTALL COMPLETE');
  log('  Open http://localhost:3000/welcome to sign in');
  log('========================================');
  log('');

  await conn.end();

  return {
    success: allPresent,
    database: dbName,
    host,
    tables: EXPECTED_TABLES.map((name) => ({
      name,
      created: createdTables.includes(name),
    })),
    counts: {
      users: Number(userCount.c),
      categories: Number(catCount.c),
      suppliers: Number(supCount.c),
      medicines: Number(medStats.medicines),
      notifications: Number(notifCount.c),
    },
    logins: [
      { role: 'admin', username: 'admin', password: 'admin123', access: 'Full access (add, edit, delete)' },
      { role: 'guest', username: 'guest', password: 'guest123', access: 'View only' },
    ],
    nextSteps: [
      'Start backend: cd backend && node server.js',
      'Start frontend: cd frontend && npm run dev',
      'Open http://localhost:3000/welcome and sign in',
    ],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('');
      console.error('INSTALL FAILED:', err.message || err);
      console.error('');
      console.error('Fix:');
      console.error('  1. Start MySQL (Docker: docker compose up -d)');
      console.error('  2. Set backend/.env → DB_HOST, DB_USER, DB_PASSWORD');
      console.error('  3. Visit http://localhost:5000/install again');
      console.error('');
      process.exit(1);
    });
}
