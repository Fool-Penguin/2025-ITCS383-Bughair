const { Client } = require('pg');
const dns = require('dns');
const { requireDatabaseUrl } = require('./db-env');

// Force IPv6 first since Supabase direct host is AAAA-only on this project
dns.setDefaultResultOrder('ipv6first');

(async () => {
  const { databaseUrl, source } = requireDatabaseUrl();
  console.log('Using DATABASE_URL from ' + source + '.');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    // Lookup that prefers IPv6
    lookup: (hostname, opts, cb) => dns.lookup(hostname, { family: 6, all: false }, cb),
  });
  try {
    await client.connect();
    const r = await client.query('SELECT version() v, current_database() db, current_user u');
    console.log('OK:', r.rows[0]);
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exit(2);
  } finally {
    await client.end().catch(() => {});
  }
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
});
