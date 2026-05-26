import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Production database config missing: ${missing.join(', ')}`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || (isProduction ? null : 'root'),
  password: process.env.DB_PASSWORD || (isProduction ? null : ''),
  database: process.env.DB_NAME || 'medicare_drug_store',
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true,
});

pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    if (['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'].includes(err.code)) {
      console.error('[DB] Connection error:', err.code);
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

export default pool;
