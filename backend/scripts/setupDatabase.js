import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXPECTED_TABLES = [
  "users",
  "categories",
  "suppliers",
  "medicines",
  "stock_movements",
  "sales",
  "settings",
  "notifications",
];

function log(line) {
  console.log(line);
}

export async function setupDatabase() {
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME || "medicare_drug_store";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const useSsl = process.env.DB_SSL === "true";
  const rejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED?.toLowerCase() !== "false";

  log("");
  log("========================================");
  log("  DATABASE INSTALL - Hussu Drug Store");
  log("========================================");
  log(`Host: ${host}`);
  log(`Database: ${dbName}`);
  log("");

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    connectTimeout: 20000,
    ...(useSsl
      ? {
          ssl: process.env.DB_SSL_CA
            ? { ca: process.env.DB_SSL_CA }
            : { rejectUnauthorized },
        }
      : {}),
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  log(`✓ Database created (or already exists): ${dbName}`);

  await conn.query(`USE \`${dbName}\``);

  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  await conn.query(schema);

  const [tableRows] = await conn.query("SHOW TABLES");
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
    log("");
    log(
      `✓ All tables are created (${EXPECTED_TABLES.length}/${EXPECTED_TABLES.length})`,
    );
  } else {
    log("");
    log(
      `⚠ Warning: expected ${EXPECTED_TABLES.length} tables, found ${createdTables.length}`,
    );
  }

  // Upsert minimal admin and guest users (no bulk seeding)
  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.email || "hussudrugstore@gmail.com";
  const adminPassword =
    process.env.ADMIN_PASSWORD || process.env.password || "hussudrugstore";
  const guestEmail =
    process.env.GUEST_EMAIL ||
    process.env.GUEST_EMAIL ||
    process.env["GUEST_EMAIL"] ||
    "guest@hussudrugstore.com";
  const guestPassword =
    process.env.GUEST_PASSWORD || process.env.GUEST_PASSWORD || "hussuguest";

  log("");
  log("Creating admin and guest users...");

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const guestHash = await bcrypt.hash(guestPassword, 10);

  await conn.query(
    `INSERT INTO users (username, password_hash, name, role, avatar_initials, email, notification_count)
     VALUES (?, ?, ?, 'admin', ?, ?, 0)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), email = VALUES(email)`,
    ["admin", adminHash, "Admin", "AD", adminEmail],
  );

  await conn.query(
    `INSERT INTO users (username, password_hash, name, role, avatar_initials, email, notification_count)
     VALUES (?, ?, ?, 'guest', ?, ?, 0)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), email = VALUES(email)`,
    ["guest", guestHash, "Guest User", "GU", guestEmail],
  );

  const [[userCount]] = await conn.query("SELECT COUNT(*) AS c FROM users");
  const [[catCount]] = await conn.query("SELECT COUNT(*) AS c FROM categories");
  const [[supCount]] = await conn.query("SELECT COUNT(*) AS c FROM suppliers");
  const [[medStats]] = await conn.query(
    `SELECT COUNT(*) AS medicines, COALESCE(SUM(qty),0) AS qty FROM medicines`,
  );
  const [[notifCount]] = await conn.query(
    "SELECT COUNT(*) AS c FROM notifications",
  );

  log(`✓ Users: ${userCount.c} (admin + guest if present)`);
  log(`✓ Categories: ${catCount.c}`);
  log(`✓ Suppliers: ${supCount.c}`);
  log(`✓ Medicines: ${medStats.medicines}`);
  log(`✓ Notifications: ${notifCount.c}`);

  log("");
  log("========================================");
  log("  INSTALL COMPLETE");
  log("  Open http://localhost:3000/welcome to sign in");
  log("========================================");
  log("");

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
      {
        role: "admin",
        username: "admin",
        password: adminPassword,
        access: "Full access (add, edit, delete)",
      },
      {
        role: "guest",
        username: "guest",
        password: guestPassword,
        access: "View only",
      },
    ],
    nextSteps: [
      "Start backend: cd backend && node server.js",
      "Start frontend: cd frontend && npm run dev",
      "Open http://localhost:3000/welcome and sign in",
    ],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("");
      console.error("INSTALL FAILED:", err.message || err);
      console.error("");
      console.error("Fix:");
      console.error("  1. Start MySQL (Docker: docker compose up -d)");
      console.error("  2. Set backend/.env → DB_HOST, DB_USER, DB_PASSWORD");
      console.error("  3. Visit http://localhost:5000/install again");
      console.error("");
      process.exit(1);
    });
}
