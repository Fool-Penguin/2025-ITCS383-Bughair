// Try connecting directly to the IPv6 literal we resolved.
const { Client } = require('pg');
require('dotenv').config();

const PASSWORD = '1mKA3bUYD2VPawXx';
const IPV6 = '2406:da12:b78:de19:da20:baab:1050:14f8';

(async () => {
  const client = new Client({
    host: IPV6,
    port: 5432,
    user: 'postgres',
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false, servername: 'db.gtfswumxifmopecwbbbx.supabase.co' },
  });
  try {
    await client.connect();
    const r = await client.query('SELECT 1 as ok');
    console.log('OK via IPv6 literal:', r.rows[0]);
  } catch (e) {
    console.error('FAILED:', e.code || '', e.message);
  } finally {
    await client.end().catch(() => {});
  }
})();
