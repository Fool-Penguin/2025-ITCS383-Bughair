// Applies every .sql file in schemas/ to Supabase, in lexical order.
// Idempotent — uses CREATE ... IF NOT EXISTS, safe to re-run.
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(__dirname, 'schemas');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  if (files.length === 0) { console.error('No schema files found in', dir); process.exit(1); }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    for (const f of files) {
      console.log('-> ' + f);
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      await client.query(sql);
    }
    console.log('\nAll schemas applied.');
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
