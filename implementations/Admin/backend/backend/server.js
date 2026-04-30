const express = require('express');
const cors = require('cors');

// ---------- Postgres pool (shared with gateway via DATABASE_URL) ----------
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  // When running standalone (not via gateway), load local .env
  require('dotenv').config();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error (admin_svc):', err);
});

const app = express();
app.use(cors());
app.use(express.json());

// --- HELPER FUNCTIONS ---

/** Run a COUNT / SUM query against any schema and return 0 on failure. */
async function runQuery(query, params = []) {
  try {
    const { rows } = await pool.query(query, params);
    if (!rows || rows.length === 0) return 0;
    return rows[0].count || rows[0].total || 0;
  } catch (err) {
    console.log(`⚠️ Query failed: ${err.message}`);
    return 0;
  }
}

/** Insert an audit-log row into admin_svc.audit_logs */
async function logAdminActivity(action, target, details) {
  try {
    await pool.query(
      `INSERT INTO admin_svc.audit_logs (admin_id, action, target_user, details) VALUES ($1, $2, $3, $4)`,
      ['Phruek_Admin', action, target, details]
    );
  } catch (err) {
    console.error('Audit-log write failed:', err.message);
  }
}

// --- API ROUTES ---

// 1. DASHBOARD STATS  (cross-schema reads — all in the same Supabase DB)
app.get('/api/dashboard/stats', async (req, res) => {
  const stats = {
    revenue:         await runQuery(`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM payment_svc."payment_transactions"`),
    activeMembers:   await runQuery(`SELECT COUNT(*)::int AS count FROM payment_svc."Users"`),
    attendanceToday: await runQuery(`SELECT COUNT(*)::int AS count FROM reservation_svc.attendance_logs WHERE entry_time::date = CURRENT_DATE`),
    activePromos:    await runQuery(`SELECT COUNT(*)::int AS count FROM admin_svc.promotions`),
  };
  res.json(stats);
});

// 2. PROMOTIONS (CRUD)
app.get('/api/promotions', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM admin_svc.promotions`);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/promotions', async (req, res) => {
  const { promo_code, promo_name, discount_amount, discount_type, expiry_date, usage_limit } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO admin_svc.promotions (promo_code, promo_name, discount_amount, discount_type, expiry_date, usage_limit, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING promo_id AS id`,
      [promo_code, promo_name, discount_amount, discount_type, expiry_date, usage_limit]
    );
    await logAdminActivity('CREATE_PROMO', promo_code, `Name: ${promo_name}`);
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/promotions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT promo_code FROM admin_svc.promotions WHERE promo_id = $1`, [id]
    );
    const promoCode = rows.length ? rows[0].promo_code : 'Unknown';
    await pool.query(`DELETE FROM admin_svc.promotions WHERE promo_id = $1`, [id]);
    await logAdminActivity('DELETE_PROMO', promoCode, `Deleted promo ID: ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. COURSES (CRUD)  — uses admin_svc.courses
app.get('/api/courses', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM admin_svc.courses`);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', async (req, res) => {
  const { course_name, instructor, schedule, max_attendees, course_type, fitness_level } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO admin_svc.courses (course_name, instructor, schedule, max_attendees, course_type, fitness_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [course_name, instructor, schedule, max_attendees, course_type, fitness_level]
    );
    await logAdminActivity('CREATE_COURSE', course_name, 'Created new course');
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/courses/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query(`UPDATE admin_svc.courses SET status = $1 WHERE id = $2`, [status, req.params.id]);
    await logAdminActivity('COURSE_STATUS', req.params.id, `Status updated to ${status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  const { reason } = req.body;
  try {
    await pool.query(`DELETE FROM admin_svc.courses WHERE id = $1`, [req.params.id]);
    await logAdminActivity('DELETE_COURSE', req.params.id, `Reason: ${reason}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CUSTOMER MANAGEMENT  (reads from payment_svc."Users")
app.get('/api/admin/customers', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT "id", "member_id", "role", "full_name" FROM payment_svc."Users"`
    );
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/customers/:id/status', async (req, res) => {
  const { status, actor_id } = req.body;
  try {
    await pool.query(
      `UPDATE payment_svc."Users" SET "role" = $1 WHERE "id" = $2`, [status, req.params.id]
    );
    await logAdminActivity('USER_STATUS_CHANGE', actor_id, `Status set to ${status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. AUDIT LOGS
app.get('/api/admin/audit', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM admin_svc.audit_logs ORDER BY "timestamp" DESC`
    );
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Export for gateway integration & standalone mode ---
const PORT = process.env.ADMIN_PORT || 8081;

// Only start listening when run directly (not when imported by gateway)
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Admin Service running on http://localhost:${PORT}`));
}

module.exports = { adminApp: app, adminPool: pool };