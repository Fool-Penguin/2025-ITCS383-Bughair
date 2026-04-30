const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to payment-service/.env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on("error", (err) => {
  console.error("Unexpected pg pool error:", err);
});

// Schema lives in Supabase (applied by _migration/apply-schema.js).
// Seeds default plans only if the table is empty.
async function initializeDatabase() {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM payment_svc."membership_plans"`
  );
  if (rows[0].count > 0) {
    console.log("Database ready (Postgres / Supabase, payment_svc)");
    return;
  }
  const insertPlan = `
    INSERT INTO payment_svc."membership_plans"
      (id, name, type, billing, price, currency, description)
    VALUES ($1, $2, $3, $4, $5, 'THB', $6)
  `;
  await pool.query(insertPlan, ["plan_free",    "Free Membership",    "FREE", null,      0,    "Basic access with limited features"]);
  await pool.query(insertPlan, ["plan_monthly", "Monthly Membership", "PAID", "MONTHLY", 499,  "Full access, billed monthly"]);
  await pool.query(insertPlan, ["plan_yearly",  "Yearly Membership",  "PAID", "YEARLY",  4999, "Full access, billed yearly (save 17%)"]);
  console.log("Database ready (Postgres / Supabase, payment_svc) — default plans seeded");
}

module.exports = { db: pool, initializeDatabase };
