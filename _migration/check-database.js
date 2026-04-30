const dns = require('dns');
const { Client } = require('pg');
const { requireDatabaseUrl } = require('./db-env');

dns.setDefaultResultOrder('ipv6first');

const TABLES = [
  ['course_svc', 'Trainers'],
  ['course_svc', 'TrainerAvailability'],
  ['course_svc', 'Courses'],
  ['course_svc', 'CourseEnrollments'],
  ['course_svc', 'TrainerBookings'],
  ['course_svc', 'TrainerReviews'],
  ['payment_svc', 'Users'],
  ['payment_svc', 'password_reset_tokens'],
  ['payment_svc', 'Memberships'],
  ['payment_svc', 'payment_transactions'],
  ['payment_svc', 'payment_refunds'],
  ['payment_svc', 'membership_plans'],
  ['payment_svc', 'audit_logs'],
  ['admin_svc', 'audit_logs'],
  ['admin_svc', 'courses'],
  ['admin_svc', 'promotions'],
  ['admin_svc', 'daily_reports'],
  ['reservation_svc', 'users'],
  ['reservation_svc', 'courts'],
  ['reservation_svc', 'court_reservations'],
  ['reservation_svc', 'attendance_logs'],
];

const COLUMNS = {
  'payment_svc.Users': ['id', 'member_id', 'email', 'password', 'full_name', 'phone', 'profile_picture', 'role'],
  'payment_svc.password_reset_tokens': ['user_id', 'token', 'expires_at', 'used'],
  'course_svc.Trainers': ['trainerID', 'name', 'expertise', 'status'],
  'course_svc.Courses': ['courseID', 'courseName', 'schedule', 'status'],
  'course_svc.TrainerReviews': ['reviewID', 'trainerID', 'memberID', 'rating', 'status'],
  'admin_svc.promotions': ['promo_id', 'promo_code', 'promo_name', 'discount_amount', 'discount_type', 'expiry_date'],
  'reservation_svc.courts': ['court_id', 'court_number', 'maintenance_start', 'maintenance_end'],
  'reservation_svc.court_reservations': ['reservation_id', 'court_id', 'member_id', 'date', 'time_slot', 'status'],
  'reservation_svc.attendance_logs': ['log_id', 'member_id', 'member_name', 'entry_time', 'exit_time'],
};

function tableKey(schema, table) {
  return `${schema}.${table}`;
}

async function main() {
  const { databaseUrl, source } = requireDatabaseUrl();
  console.log(`Using DATABASE_URL from ${source}.`);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const schemas = ['course_svc', 'payment_svc', 'admin_svc', 'reservation_svc'];
  const schemaResult = await client.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name = ANY($1)`,
    [schemas]
  );
  const foundSchemas = new Set(schemaResult.rows.map((row) => row.schema_name));
  const missingSchemas = schemas.filter((schema) => !foundSchemas.has(schema));

  const tableResult = await client.query(
    `SELECT table_schema, table_name
     FROM information_schema.tables
     WHERE table_schema = ANY($1)`,
    [schemas]
  );
  const foundTables = new Set(tableResult.rows.map((row) => tableKey(row.table_schema, row.table_name)));
  const missingTables = TABLES.filter(([schema, table]) => !foundTables.has(tableKey(schema, table)));

  const columnResult = await client.query(
    `SELECT table_schema, table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = ANY($1)`,
    [schemas]
  );
  const foundColumns = new Set(
    columnResult.rows.map((row) => `${tableKey(row.table_schema, row.table_name)}.${row.column_name}`)
  );
  const missingColumns = [];
  for (const [key, columns] of Object.entries(COLUMNS)) {
    for (const column of columns) {
      if (!foundColumns.has(`${key}.${column}`)) {
        missingColumns.push(`${key}.${column}`);
      }
    }
  }

  if (missingSchemas.length || missingTables.length || missingColumns.length) {
    if (missingSchemas.length) {
      console.error('Missing schemas:', missingSchemas.join(', '));
    }
    if (missingTables.length) {
      console.error('Missing tables:', missingTables.map(([schema, table]) => tableKey(schema, table)).join(', '));
    }
    if (missingColumns.length) {
      console.error('Missing columns:', missingColumns.join(', '));
    }
    process.exitCode = 2;
    await client.end().catch(() => {});
    return;
  }

  const counts = [];
  counts.push(await client.query('SELECT COUNT(*)::int AS count FROM payment_svc."Users"'));
  counts.push(await client.query('SELECT COUNT(*)::int AS count FROM payment_svc."membership_plans"'));
  counts.push(await client.query('SELECT COUNT(*)::int AS count FROM course_svc."Trainers"'));
  counts.push(await client.query('SELECT COUNT(*)::int AS count FROM course_svc."Courses"'));
  counts.push(await client.query('SELECT COUNT(*)::int AS count FROM admin_svc.promotions'));
  counts.push(await client.query('SELECT COUNT(*)::int AS count FROM reservation_svc.courts'));

  console.log('Database schema check passed.');
  console.table([
    { area: 'users', rows: counts[0].rows[0].count },
    { area: 'membership_plans', rows: counts[1].rows[0].count },
    { area: 'trainers', rows: counts[2].rows[0].count },
    { area: 'courses', rows: counts[3].rows[0].count },
    { area: 'promotions', rows: counts[4].rows[0].count },
    { area: 'courts', rows: counts[5].rows[0].count },
  ]);
  await client.end().catch(() => {});
}

main()
  .catch((error) => {
    console.error('Database check failed:', error.message);
    process.exitCode = 1;
  });
