-- reservation-service tables. Mirrors the original SQLite schema exactly.
-- No FK on member_id in court_reservations / attendance_logs because the
-- referenced member rows live in payment_svc."Users", not here.

SET search_path TO reservation_svc;

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courts (
  court_id          INTEGER PRIMARY KEY,
  court_number      INTEGER UNIQUE NOT NULL,
  maintenance_start TIMESTAMPTZ,
  maintenance_end   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS court_reservations (
  reservation_id TEXT PRIMARY KEY,
  court_id       INTEGER NOT NULL REFERENCES courts(court_id),
  member_id      TEXT NOT NULL,
  member_name    TEXT NOT NULL,
  date           DATE NOT NULL,
  time_slot      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  log_id      BIGSERIAL PRIMARY KEY,
  member_id   TEXT NOT NULL,
  member_name TEXT NOT NULL,
  entry_time  TIMESTAMPTZ DEFAULT NOW(),
  exit_time   TIMESTAMPTZ
);
