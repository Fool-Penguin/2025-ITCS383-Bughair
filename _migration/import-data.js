// Imports rows from each existing SQLite .db into the matching Postgres
// schema. Idempotent — every insert is ON CONFLICT DO NOTHING and sequences
// are bumped to MAX(id)+1 at the end.
const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
const { requireDatabaseUrl } = require('./db-env');

const ROOT = path.resolve(__dirname, '..', 'implementations');

function open(p) { return fs.existsSync(p) ? new Database(p, { readonly: true }) : null; }

async function main() {
  const { databaseUrl, source } = requireDatabaseUrl();
  console.log('Using DATABASE_URL from ' + source + '.');
  const pg = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  try {
    await importPayment(pg);
    await importAdmin(pg);
    console.log('\nAll existing data imported.');
  } finally {
    await pg.end();
  }
}

async function importPayment(pg) {
  const dbPath = path.join(ROOT, 'payment-service', 'data', 'fitness_payment.db');
  const lite = open(dbPath);
  if (!lite) { console.log('payment-service: no .db file, skipping'); return; }
  console.log('\n=== payment-service ===');

  const users = lite.prepare('SELECT * FROM Users').all();
  for (const u of users) {
    await pg.query(
      `INSERT INTO payment_svc."Users"
         (id, member_id, email, password, full_name, phone, profile_picture, role, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::timestamptz, NOW()))
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.member_id, u.email, u.password, u.full_name, u.phone || null, u.profile_picture || null, u.role || 'member', u.created_at || null]
    );
  }
  console.log(`  Users: ${users.length}`);

  // membership_plans — table is auto-seeded by initializeDatabase, but copy any non-default rows
  const plans = lite.prepare('SELECT * FROM membership_plans').all();
  for (const p of plans) {
    await pg.query(
      `INSERT INTO payment_svc."membership_plans"
         (id, name, type, billing, price, currency, description, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::timestamptz, NOW()))
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.type, p.billing, p.price, p.currency, p.description, p.is_active, p.created_at]
    );
  }
  console.log(`  membership_plans: ${plans.length}`);

  // password_reset_tokens (preserves existing tokens if any)
  const tokens = lite.prepare('SELECT * FROM password_reset_tokens').all();
  for (const t of tokens) {
    await pg.query(
      `INSERT INTO payment_svc."password_reset_tokens"
         (id, user_id, token, expires_at, used, created_at)
       VALUES ($1,$2,$3,$4::timestamptz,$5,COALESCE($6::timestamptz, NOW()))
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.user_id, t.token, t.expires_at, t.used, t.created_at]
    );
  }
  console.log(`  password_reset_tokens: ${tokens.length}`);

  // Existing payment_transactions / refunds / audit_logs (likely empty but copy if not)
  for (const tbl of ['payment_transactions', 'payment_refunds', 'audit_logs', 'Memberships']) {
    const rows = lite.prepare(`SELECT * FROM ${tbl}`).all();
    for (const r of rows) {
      const cols = Object.keys(r).map(c => `"${c}"`).join(',');
      const placeholders = Object.keys(r).map((_, i) => `$${i + 1}`).join(',');
      const values = Object.values(r);
      try {
        await pg.query(
          `INSERT INTO payment_svc."${tbl}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
      } catch (e) {
        console.log(`    skip ${tbl} row: ${e.message}`);
      }
    }
    console.log(`  ${tbl}: ${rows.length}`);
  }

  // Bump the BIGSERIAL sequence on Users + Memberships + password_reset_tokens
  for (const t of ['Users', 'Memberships', 'password_reset_tokens']) {
    await pg.query(`
      SELECT setval(
        pg_get_serial_sequence('payment_svc."${t}"', 'id'),
        COALESCE((SELECT MAX(id) FROM payment_svc."${t}"), 1),
        true
      )
    `);
  }
  lite.close();
}

async function importAdmin(pg) {
  console.log('\n=== Admin service ===');
  const baseDir = path.join(ROOT, 'Admin', 'backend', 'backend', 'databases');

  const audit = open(path.join(baseDir, 'admin_audit.db'));
  if (audit) {
    const rows = audit.prepare('SELECT * FROM audit_logs').all();
    for (const r of rows) {
      await pg.query(
        `INSERT INTO admin_svc.audit_logs (id, admin_id, action, target_user, details, "timestamp")
         VALUES ($1,$2,$3,$4,$5,COALESCE($6::timestamptz, NOW()))
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.admin_id, r.action, r.target_user, r.details, r.timestamp]
      );
    }
    console.log(`  admin_audit / audit_logs: ${rows.length}`);
    audit.close();
  }

  const courseDb = open(path.join(baseDir, 'course.db'));
  if (courseDb) {
    const rows = courseDb.prepare('SELECT * FROM courses').all();
    for (const r of rows) {
      await pg.query(
        `INSERT INTO admin_svc.courses
           (id, course_name, instructor, schedule, max_attendees, course_type, fitness_level, status, cancel_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.course_name, r.instructor, r.schedule, r.max_attendees, r.course_type, r.fitness_level, r.status, r.cancel_reason]
      );
    }
    console.log(`  course / courses: ${rows.length}`);
    courseDb.close();
  }

  const promoDb = open(path.join(baseDir, 'promotion.db'));
  if (promoDb) {
    const promos = promoDb.prepare('SELECT * FROM promotions').all();
    for (const p of promos) {
      await pg.query(
        `INSERT INTO admin_svc.promotions
           (promo_id, promo_code, promo_name, discount_amount, discount_type, usage_limit,
            current_uses, target_audience, status, expiry_date, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,COALESCE($11::timestamptz, NOW()))
         ON CONFLICT (promo_id) DO NOTHING`,
        [p.promo_id, p.promo_code, p.promo_name, p.discount_amount, p.discount_type, p.usage_limit,
         p.current_uses, p.target_audience, p.status, p.expiry_date, p.created_at]
      );
    }
    console.log(`  promotion / promotions: ${promos.length}`);

    const reports = promoDb.prepare('SELECT * FROM daily_reports').all();
    for (const r of reports) {
      await pg.query(
        `INSERT INTO admin_svc.daily_reports
           (report_id, report_date, total_revenue, total_attendance, active_memberships, new_signups, updated_at)
         VALUES ($1,$2::date,$3,$4,$5,$6,COALESCE($7::timestamptz, NOW()))
         ON CONFLICT (report_id) DO NOTHING`,
        [r.report_id, r.report_date, r.total_revenue, r.total_attendance, r.active_memberships, r.new_signups, r.updated_at]
      );
    }
    console.log(`  promotion / daily_reports: ${reports.length}`);
    promoDb.close();
  }

  // Bump sequences
  for (const t of ['audit_logs', 'courses']) {
    await pg.query(`
      SELECT setval(
        pg_get_serial_sequence('admin_svc.${t}', 'id'),
        COALESCE((SELECT MAX(id) FROM admin_svc.${t}), 1),
        true
      )
    `);
  }
  await pg.query(`
    SELECT setval(
      pg_get_serial_sequence('admin_svc.promotions', 'promo_id'),
      COALESCE((SELECT MAX(promo_id) FROM admin_svc.promotions), 1),
      true
    )
  `);
  await pg.query(`
    SELECT setval(
      pg_get_serial_sequence('admin_svc.daily_reports', 'report_id'),
      COALESCE((SELECT MAX(report_id) FROM admin_svc.daily_reports), 1),
      true
    )
  `);
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(2); });
