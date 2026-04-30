const { Client } = require('pg');
const { requireDatabaseUrl } = require('./db-env');

(async () => {
  const { databaseUrl, source } = requireDatabaseUrl();
  console.log('Using DATABASE_URL from ' + source + '.');
  const c = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    const r = await c.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('course_svc','payment_svc','admin_svc','reservation_svc')
      ORDER BY table_schema, table_name
    `);
    let last = '';
    for (const row of r.rows) {
      if (row.table_schema !== last) { console.log('\n[' + row.table_schema + ']'); last = row.table_schema; }
      console.log('  ' + row.table_name);
    }
  } finally { await c.end(); }
})().catch((e) => {
  console.error('Schema verification failed:', e.message);
  process.exitCode = 1;
});
