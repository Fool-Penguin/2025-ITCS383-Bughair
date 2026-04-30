-- payment-service tables. AuthMembership shares this schema (Users + tokens).
-- Identifiers are mostly snake_case already; we keep the original PascalCase
-- table names ("Users", "Memberships") quoted to preserve the SQL exactly.

SET search_path TO payment_svc;

CREATE TABLE IF NOT EXISTS "Users" (
  "id"              BIGSERIAL PRIMARY KEY,
  "member_id"       TEXT UNIQUE NOT NULL,
  "email"           TEXT UNIQUE NOT NULL,
  "password"        TEXT NOT NULL,
  "full_name"       TEXT NOT NULL,
  "phone"           TEXT,
  "profile_picture" TEXT,
  "role"            TEXT DEFAULT 'member',
  "created_at"      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id"         BIGSERIAL PRIMARY KEY,
  "user_id"    BIGINT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "token"      TEXT UNIQUE NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used"       INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Memberships" (
  "id"          BIGSERIAL PRIMARY KEY,
  "user_id"     BIGINT NOT NULL REFERENCES "Users"("id"),
  "plan_id"     TEXT NOT NULL,
  "start_date"  TIMESTAMPTZ DEFAULT NOW(),
  "expiry_date" TIMESTAMPTZ,
  "status"      TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id"              TEXT PRIMARY KEY,
  "member_id"       TEXT NOT NULL,
  "payment_method"  TEXT NOT NULL CHECK ("payment_method" IN ('CREDIT_CARD','PAYPAL','TRUEMONEY')),
  "purpose"         TEXT NOT NULL CHECK ("purpose" IN ('MEMBERSHIP','COURSE','TRAINING','COURT')),
  "amount"          NUMERIC(12,2) NOT NULL CHECK ("amount" > 0),
  "currency"        TEXT NOT NULL DEFAULT 'THB',
  "status"          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK ("status" IN ('PENDING','PROCESSING','SUCCESS','FAILED','REFUNDED','CANCELLED')),
  "reference_id"    TEXT UNIQUE,
  "idempotency_key" TEXT UNIQUE NOT NULL,
  "metadata"        TEXT,
  "failure_reason"  TEXT,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completed_at"    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "payment_refunds" (
  "id"             TEXT PRIMARY KEY,
  "transaction_id" TEXT NOT NULL REFERENCES "payment_transactions"("id"),
  "admin_id"       TEXT NOT NULL,
  "amount"         NUMERIC(12,2) NOT NULL CHECK ("amount" > 0),
  "reason"         TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK ("status" IN ('PENDING','SUCCESS','FAILED')),
  "reference_id"   TEXT,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "membership_plans" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "type"        TEXT NOT NULL CHECK ("type" IN ('FREE','PAID')),
  "billing"     TEXT CHECK ("billing" IN ('MONTHLY','YEARLY')),
  "price"       NUMERIC(12,2) NOT NULL DEFAULT 0,
  "currency"    TEXT NOT NULL DEFAULT 'THB',
  "description" TEXT,
  "is_active"   INTEGER NOT NULL DEFAULT 1,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         TEXT PRIMARY KEY,
  "actor_id"   TEXT NOT NULL,
  "actor_role" TEXT NOT NULL CHECK ("actor_role" IN ('MEMBER','ADMIN','SYSTEM')),
  "action"     TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "entity_id"  TEXT,
  "details"    TEXT,
  "ip_address" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_member  ON "payment_transactions" ("member_id");
CREATE INDEX IF NOT EXISTS idx_transactions_status  ON "payment_transactions" ("status");
CREATE INDEX IF NOT EXISTS idx_transactions_created ON "payment_transactions" ("created_at");
CREATE INDEX IF NOT EXISTS idx_refunds_transaction  ON "payment_refunds" ("transaction_id");
CREATE INDEX IF NOT EXISTS idx_audit_actor          ON "audit_logs" ("actor_id");
