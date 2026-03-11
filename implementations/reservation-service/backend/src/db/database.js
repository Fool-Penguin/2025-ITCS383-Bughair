// ============================================================
// src/db/database.js
// SQLite database — fitcourt.db
// ============================================================

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "fitcourt.db");
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    // NOTE: foreign_keys OFF intentionally so that attendance_logs and
    // court_reservations can reference member IDs that come from the
    // external Auth & Membership service (not seeded in our users table).
    db.pragma("foreign_keys = OFF");
    initSchema();
    seedData();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'member',
      created_at  TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS courts (
      court_id            INTEGER PRIMARY KEY,
      court_number        INTEGER UNIQUE NOT NULL,
      maintenance_start   TEXT,
      maintenance_end     TEXT
    );

    -- No hard FK on member_id so external Auth service accounts work too
    CREATE TABLE IF NOT EXISTS court_reservations (
      reservation_id  TEXT PRIMARY KEY,
      court_id        INTEGER NOT NULL,
      member_id       TEXT NOT NULL,
      member_name     TEXT NOT NULL,
      date            TEXT NOT NULL,
      time_slot       TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'active',
      created_at      TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS attendance_logs (
      log_id       INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id    TEXT NOT NULL,
      member_name  TEXT NOT NULL,
      entry_time   TEXT DEFAULT (datetime('now','localtime')),
      exit_time    TEXT
    );
  `);
}

function seedData() {
  const db = getDb();
  const courtCount = db.prepare("SELECT COUNT(*) as c FROM courts").get().c;
  if (courtCount > 0) return; // ถ้ามีข้อมูลแล้วไม่ต้องใส่ซ้ำ

  console.log("🌱 กำลังใส่ข้อมูลเริ่มต้นเพื่อให้ Dashboard มีข้อมูล...");

  // 1. ใส่สนาม 1-5
  const insertCourt = db.prepare("INSERT INTO courts (court_id, court_number) VALUES (?, ?)");
  for (let i = 1; i <= 5; i++) insertCourt.run(i, i);

  // 2. ใส่ Log การเข้างาน (เพื่อให้เลข Members Inside ขึ้นเป็น 4)
  const today = new Date().toISOString().split('T')[0];
  const il = db.prepare("INSERT INTO attendance_logs (member_id, member_name, entry_time) VALUES (?,?,?)");
  il.run("M001", "John Doe", today + " 08:00:00");
  il.run("M003", "Tom Lee",  today + " 09:00:00");
  il.run("M005", "Pat Wong", today + " 09:30:00");
  il.run("M007", "Mark Tan", today + " 10:00:00");

  console.log("✅ ข้อมูลพร้อมรันแล้ว!");
}
// ── Helpers ────────────────────────────────────────────────
function localDateStr(d) {
  const dt = d || new Date();
  return dt.getFullYear() + "-" +
    String(dt.getMonth() + 1).padStart(2, "0") + "-" +
    String(dt.getDate()).padStart(2, "0");
}
function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

// ── Public API for external Auth service integration ───────
// Call this from Auth service after successful login/register
// to upsert the user into our local users table
function upsertUser(id, name, email, role) {
  getDb().prepare(`
    INSERT INTO users (id,name,email,password,role)
    VALUES (?,?,?,'[external-auth]',?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email, role=excluded.role
  `).run(id, name, email, role || "member");
}

module.exports = { getDb, localDateStr, upsertUser };