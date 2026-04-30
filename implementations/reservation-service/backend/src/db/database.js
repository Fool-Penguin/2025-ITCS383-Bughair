// ============================================================
// src/db/database.js
// Postgres (Supabase) — schema reservation_svc
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const isTestMode = process.env.NODE_ENV === 'test' || process.env.RESERVATION_TEST_MODE === '1';
let pool;

function createTestPool() {
  const data = require('./data');
  const result = (rows = []) => ({ rows, rowCount: rows.length });

  return {
    on() {},
    async connect() {
      return { query: this.query, release() {} };
    },
    async query(sql, params = []) {
      if (sql.includes('COUNT(*)::int AS c FROM reservation_svc.courts')) {
        return result([{ c: data.courts.length }]);
      }

      if (sql.includes('FROM reservation_svc.courts WHERE court_id=$1')) {
        return result(data.courts.filter((court) => court.court_id === Number(params[0])));
      }

      if (sql.includes('FROM reservation_svc.court_reservations')) {
        const [first, date, slot] = params;
        const rows = data.courtReservations.filter((reservation) => {
          if (reservation.status !== 'active') return false;
          if (date && reservation.date !== date) return false;

          if (sql.includes('member_id=$1')) {
            return reservation.member_id === first && reservation.time_slot === slot;
          }

          if (sql.includes('time_slot LIKE')) {
            return reservation.court_id === Number(first) && reservation.time_slot.startsWith(String(slot).replace('%', ''));
          }

          return reservation.court_id === Number(first) && reservation.time_slot === slot;
        });
        return result(rows.length > 0 ? [{ exists: 1 }] : []);
      }

      if (sql.includes('FROM reservation_svc.attendance_logs')) {
        return result([{ c: 0 }]);
      }

      return result([]);
    },
  };
}

if (!process.env.DATABASE_URL && !isTestMode) {
  throw new Error('DATABASE_URL is not set. Add it to reservation-service/backend/.env');
}

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
} else {
  pool = createTestPool();
}

pool.on('error', (err) => console.error('Unexpected pg pool error:', err));

let seeded = false;
let seedPromise = null;

// Idempotent — seeds 5 courts and a few attendance rows on first call.
async function seedIfEmpty() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    if (seeded) return;
    const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM reservation_svc.courts');
    if (rows[0].c > 0) {
      seeded = true;
      return;
    }

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
      seeded = true;
      console.log('Reservation DB seeded (5 courts + sample attendance logs)');
    } catch (e) {
      await client.query('ROLLBACK');
      seedPromise = null;
      throw e;
    } finally {
      client.release();
    }
  })();
  return seedPromise;
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

module.exports = { pool, getDb, seedIfEmpty, localDateStr, upsertUser };
