import pool, { pingDatabase } from '../config/db.js';

export function isDbConnectionError(err) {
  const code = err?.code || err?.errno;
  return (
    code === 'ECONNREFUSED' ||
    code === 'ER_BAD_DB_ERROR' ||
    code === 'ENOTFOUND' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    err?.fatal === true
  );
}

function isTransientDbError(err) {
  const code = err?.code;
  return (
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'ECONNRESET' ||
    code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
    code === 'ETIMEDOUT'
  );
}

export async function withDb(queryFn, fallbackFn) {
  const run = () => queryFn(pool);

  try {
    return await run();
  } catch (err) {
    if (isDbConnectionError(err) && fallbackFn) {
      console.warn('[DB] Using fallback data — start MySQL and open http://localhost:5000/install');
      return fallbackFn();
    }

    if (isTransientDbError(err)) {
      try {
        await pingDatabase();
        return await run();
      } catch (retryErr) {
        if (isDbConnectionError(retryErr) && fallbackFn) {
          console.warn('[DB] Retry failed — using fallback data');
          return fallbackFn();
        }
        throw retryErr;
      }
    }

    throw err;
  }
}

export function dbErrorMessage(err) {
  if (isDbConnectionError(err)) {
    return 'MySQL is not running. Start MySQL (or Docker) and open http://localhost:5000/install';
  }
  return err?.message || 'Database error';
}
