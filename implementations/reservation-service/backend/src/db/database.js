// ============================================================
// src/db/database.js
// Postgres (Supabase) — schema reservation_svc
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to reservation-service/backend/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => console.error('Unexpected pg pool error:', err));

let seeded = false;

// Idempotent — seeds 5 courts and a few attendance rows on first call.
async function seedIfEmpty() {
  if (seeded) return;
  seeded = true;
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM reservation_svc.courts');
  if (rows[0].c > 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 1; i <= 5; i++) {
      await client.query(
        `INSERT INTO reservation_svc.courts (court_id, court_number)
         VALUES ($1,$2) ON CONFLICT (court_id) DO NOTHING`,
        [i, i]
      );
    }
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const seedLogs = [
      ['M001', 'John Doe', `${todayStr} 08:00:00+00`],
      ['M003', 'Tom Lee',  `${todayStr} 09:00:00+00`],
      ['M005', 'Pat Wong', `${todayStr} 09:30:00+00`],
      ['M007', 'Mark Tan', `${todayStr} 10:00:00+00`],
    ];
    for (const [id, name, time] of seedLogs) {
      await client.query(
        `INSERT INTO reservation_svc.attendance_logs (member_id, member_name, entry_time)
         VALUES ($1,$2,$3::timestamptz)`,
        [id, name, time]
      );
    }
    await client.query('COMMIT');
    console.log('Reservation DB seeded (5 courts + sample attendance logs)');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Returns the connection pool. Kept named getDb() for backwards compat with old call sites.
function getDb() {
  // Fire-and-forget seed on first call
  seedIfEmpty().catch((e) => console.error('Reservation seed failed:', e.message));
  return pool;
}

// ── Helpers ────────────────────────────────────────────────
function localDateStr(d) {
  const dt = d || new Date();
  return dt.getFullYear() + '-' +
    String(dt.getMonth() + 1).padStart(2, '0') + '-' +
    String(dt.getDate()).padStart(2, '0');
}

// Upsert user from external Auth & Membership service.
async function upsertUser(id, name, email, role) {
  await pool.query(
    `INSERT INTO reservation_svc.users (id,name,email,password,role)
     VALUES ($1,$2,$3,'[external-auth]',$4)
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, role=EXCLUDED.role`,
    [id, name, email, role || 'member']
  );
}

module.exports = { pool, getDb, localDateStr, upsertUser };
