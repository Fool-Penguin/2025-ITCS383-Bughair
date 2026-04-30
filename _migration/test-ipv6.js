const dns = require('dns');
const { Client } = require('pg');
const { requireDatabaseUrl } = require('./db-env');

dns.setDefaultResultOrder('ipv6first');

(async () => {
  const { databaseUrl, source } = requireDatabaseUrl();
  console.log('Using DATABASE_URL from ' + source + '.');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    lookup: (hostname, opts, cb) => dns.lookup(hostname, { family: 6, all: false }, cb),
  });

  try {
    await client.connect();
    const result = await client.query('SELECT 1 AS ok');
    console.log('OK via IPv6-preferred lookup:', result.rows[0]);
  } catch (error) {
    console.error('FAILED:', error.code || '', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})().catch((error) => {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
});
