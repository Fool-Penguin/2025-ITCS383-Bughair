const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbDir = path.dirname(process.env.DB_PATH || "./data/fitness_payment.db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(
  path.resolve(process.env.DB_PATH || "./data/fitness_payment.db")
);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initializeDatabase() {
  db.exec(`
    
    -- Member 1: User Accounts Table
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT UNIQUE NOT NULL, -- e.g., MEM123456
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Member 1: Membership Subscriptions Table
    CREATE TABLE IF NOT EXISTS Memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id TEXT NOT NULL,
      start_date TEXT DEFAULT (datetime('now')),
      expiry_date TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES Users(id)
    );

    -- Payment Transactions Table
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id              TEXT PRIMARY KEY,
      member_id       TEXT NOT NULL,
      payment_method  TEXT NOT NULL CHECK(payment_method IN ('CREDIT_CARD','PAYPAL','TRUEMONEY')),
      purpose         TEXT NOT NULL CHECK(purpose IN ('MEMBERSHIP','COURSE','TRAINING','COURT')),
      amount          REAL NOT NULL CHECK(amount > 0),
      currency        TEXT NOT NULL DEFAULT 'THB',
      status          TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK(status IN ('PENDING','PROCESSING','SUCCESS','FAILED','REFUNDED','CANCELLED')),
      reference_id    TEXT UNIQUE,           -- ID returned by payment gateway
      idempotency_key TEXT UNIQUE NOT NULL,  -- Prevent duplicate payments
      metadata        TEXT,                  -- JSON: membership plan, course id, etc.
      failure_reason  TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at    TEXT
    );

    -- Payment Refunds Table
    CREATE TABLE IF NOT EXISTS payment_refunds (
      id              TEXT PRIMARY KEY,
      transaction_id  TEXT NOT NULL REFERENCES payment_transactions(id),
      admin_id        TEXT NOT NULL,
      amount          REAL NOT NULL CHECK(amount > 0),
      reason          TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK(status IN ('PENDING','SUCCESS','FAILED')),
      reference_id    TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Membership Plans Table (for payment service reference)
    CREATE TABLE IF NOT EXISTS membership_plans (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('FREE','PAID')),
      billing     TEXT CHECK(billing IN ('MONTHLY','YEARLY')),
      price       REAL NOT NULL DEFAULT 0,
      currency    TEXT NOT NULL DEFAULT 'THB',
      description TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Audit Log Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          TEXT PRIMARY KEY,
      actor_id    TEXT NOT NULL,
      actor_role  TEXT NOT NULL CHECK(actor_role IN ('MEMBER','ADMIN','SYSTEM')),
      action      TEXT NOT NULL,
      entity      TEXT NOT NULL,
      entity_id   TEXT,
      details     TEXT,
      ip_address  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_transactions_member    ON payment_transactions(member_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status    ON payment_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_created   ON payment_transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_refunds_transaction    ON payment_refunds(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_audit_actor            ON audit_logs(actor_id);
  `);

  // Seed default membership plans
  const existing = db
    .prepare("SELECT COUNT(*) as count FROM membership_plans")
    .get();
  if (existing.count === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO membership_plans (id, name, type, billing, price, currency, description)
      VALUES (?, ?, ?, ?, ?, 'THB', ?)
    `);
    insertPlan.run("plan_free", "Free Membership", "FREE", null, 0, "Basic access with limited features");
    insertPlan.run("plan_monthly", "Monthly Membership", "PAID", "MONTHLY", 499, "Full access, billed monthly");
    insertPlan.run("plan_yearly", "Yearly Membership", "PAID", "YEARLY", 4999, "Full access, billed yearly (save 17%)");
    console.log("✅ Default membership plans seeded");
  }

  console.log("✅ Database initialized successfully");
}

module.exports = { db, initializeDatabase };
