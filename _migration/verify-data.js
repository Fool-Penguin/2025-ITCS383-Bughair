const { Client } = require('pg');
const { requireDatabaseUrl } = require('./db-env');

(async () => {
  const { databaseUrl, source } = requireDatabaseUrl();
  console.log('Using DATABASE_URL from ' + source + '.');
  const c = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    const sections = [
      ['payment_svc."Users"',        'SELECT id, member_id, email, full_name, role, created_at FROM payment_svc."Users" ORDER BY id'],
      ['payment_svc."membership_plans"', 'SELECT id, name, type, price FROM payment_svc."membership_plans" ORDER BY id'],
      ['admin_svc.audit_logs',       'SELECT id, admin_id, action, target_user FROM admin_svc.audit_logs ORDER BY id'],
      ['admin_svc.courses',          'SELECT id, course_name, instructor, status FROM admin_svc.courses ORDER BY id'],
      ['admin_svc.promotions',       'SELECT promo_id, promo_code, promo_name, status, expiry_date FROM admin_svc.promotions ORDER BY promo_id'],
    ];
    for (const [label, sql] of sections) {
      console.log('\n=== ' + label + ' ===');
      const r = await c.query(sql);
      console.log(`(${r.rowCount} rows)`);
      console.table(r.rows);
    }
  } finally { await c.end(); }
})().catch((e) => {
  console.error('Data verification failed:', e.message);
  process.exitCode = 1;
});
