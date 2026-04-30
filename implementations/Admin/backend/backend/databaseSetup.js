// Seed the admin_svc schema with sample data (idempotent).
// Run this once after apply-schema.js, or let the gateway call it at startup.

require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

async function seedAdminData() {
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM admin_svc.promotions`
  );
  if (count > 0) {
    console.log('admin_svc: seed already present — skipping');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed promotions
    await client.query(`
      INSERT INTO admin_svc.promotions
        (promo_code, promo_name, discount_amount, discount_type, expiry_date, usage_limit, status)
      VALUES
        ('WELCOME20', 'Welcome 20% Off',  20, 'PERCENTAGE', '2026-12-31', 100, 'ACTIVE'),
        ('NEWYEAR',   'New Year Special', 500, 'FIXED',      '2026-02-28', 50,  'ACTIVE')
    `);

    // Seed an audit log entry
    await client.query(`
      INSERT INTO admin_svc.audit_logs (admin_id, action, target_user, details)
      VALUES ('Phruek_Admin', 'SYSTEM_INIT', 'SYSTEM', 'Admin database seeded')
    `);

    await client.query('COMMIT');
    console.log('admin_svc: seeded promotions + initial audit log');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// When run directly: seed and exit
if (require.main === module) {
  seedAdminData()
    .then(() => pool.end())
    .catch((e) => { console.error(e); pool.end(); process.exitCode = 1; });
}

module.exports = seedAdminData;