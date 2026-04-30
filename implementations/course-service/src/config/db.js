const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to course-service/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err);
});

module.exports = pool;
