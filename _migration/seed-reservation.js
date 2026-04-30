const { requireDatabaseUrl } = require('./db-env');

(async () => {
  const { source } = requireDatabaseUrl();
  console.log('Using DATABASE_URL from ' + source + '.');

  const { pool, seedIfEmpty } = require('../implementations/reservation-service/backend/src/db/database');

  try {
    await seedIfEmpty();
    console.log('reservation_svc seed complete.');
  } finally {
    await pool.end().catch(() => {});
  }
})().catch((error) => {
  console.error('reservation_svc seed failed:', error.message);
  process.exitCode = 1;
});
