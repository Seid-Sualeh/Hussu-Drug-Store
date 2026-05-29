import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Production database config missing: ${missing.join(", ")}`,
    );
  }
}

const pool = mysql.createPool({
  // Support a single DATABASE_URL (Aiven/managed providers) or individual parts
  ...(process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306", 10),
        user: process.env.DB_USER || (isProduction ? null : "root"),
        password: process.env.DB_PASSWORD || (isProduction ? null : ""),
        database: process.env.DB_NAME || "medicare_drug_store",
      }),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true,
  // Optional SSL support for managed DBs (Aiven provides TLS)
  ...(process.env.DB_SSL === "true"
    ? {
        ssl: process.env.DB_SSL_CA
          ? { ca: process.env.DB_SSL_CA }
          : {
              rejectUnauthorized:
                process.env.DB_SSL_REJECT_UNAUTHORIZED?.toLowerCase() ===
                "false"
                  ? false
                  : isProduction,
            },
      }
    : {}),
});

pool.on("connection", (connection) => {
  connection.on("error", (err) => {
    if (
      [
        "PROTOCOL_CONNECTION_LOST",
        "ECONNRESET",
        "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
      ].includes(err.code)
    ) {
      console.error("[DB] Connection error:", err.code);
    }
  });
});

export async function pingDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

export async function ensureMedicineUnitColumn() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query("SHOW COLUMNS FROM medicines LIKE 'unit'");
    if (rows.length === 0) {
      await conn.query(
        "ALTER TABLE medicines ADD COLUMN unit VARCHAR(60) NULL AFTER name",
      );
      console.log("[DB] Added missing medicines.unit column");
    }
  } finally {
    conn.release();
  }
}

export default pool;
