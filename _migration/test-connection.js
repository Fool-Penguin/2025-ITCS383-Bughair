require('dotenv').config();
const { Client } = require('pg');
const dns = require('dns');

// Force IPv6 first since Supabase direct host is AAAA-only on this project
dns.setDefaultResultOrder('ipv6first');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set in .env'); process.exit(1); }
  const client = new Client({
    connectionString: url,
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
})();
