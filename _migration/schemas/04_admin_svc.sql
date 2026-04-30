-- Admin service tables. SQLite originally split these across 3 files
-- (admin_audit.db / course.db / promotion.db); they all live in one schema here.
-- Names match the original SQLite tables exactly so server.js queries stay readable.

SET search_path TO admin_svc;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    TEXT,
  action      TEXT,
  target_user TEXT,
  details     TEXT,
  "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id            BIGSERIAL PRIMARY KEY,
  course_name   TEXT NOT NULL,
  instructor    TEXT NOT NULL,
  schedule      TEXT NOT NULL,
  max_attendees INTEGER NOT NULL,
  course_type   TEXT,
  fitness_level TEXT,
  status        TEXT DEFAULT 'UNPUBLISHED',
  cancel_reason TEXT
);

CREATE TABLE IF NOT EXISTS promotions (
  promo_id        BIGSERIAL PRIMARY KEY,
  promo_code      TEXT NOT NULL,
  promo_name      TEXT NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL,
  discount_type   TEXT NOT NULL,
  usage_limit     INTEGER,
  current_uses    INTEGER DEFAULT 0,
  target_audience TEXT DEFAULT 'ALL',
  status          TEXT DEFAULT 'ACTIVE',
  expiry_date     DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_reports (
  report_id          BIGSERIAL PRIMARY KEY,
  report_date        DATE NOT NULL,
  total_revenue      NUMERIC(12,2) DEFAULT 0,
  total_attendance   INTEGER DEFAULT 0,
  active_memberships INTEGER DEFAULT 0,
  new_signups        INTEGER DEFAULT 0,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
