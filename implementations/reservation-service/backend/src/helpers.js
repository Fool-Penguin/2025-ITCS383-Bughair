// ============================================================
// src/helpers.js  —  SQLite version
// ============================================================

const { getDb, localDateStr } = require("./db/database");

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    // ✅ ถ้า Express (req.body) อ่านมาให้แล้ว ให้ใช้ค่านั้นเลย ไม่ต้องรออ่าน Stream ใหม่
    if (req.body && Object.keys(req.body).length > 0) {
      return resolve(req.body);
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function getCourtStatus(court) {
  const now = new Date();
  if (court.maintenance_start && court.maintenance_end) {
    const s = new Date(court.maintenance_start);
    const e = new Date(court.maintenance_end);
    if (now >= s && now <= e) return "maintenance";
  }
  const db = getDb();
  const today = localDateStr();
  const currentHour = String(now.getHours()).padStart(2, "0") + ":00";
  const active = db.prepare(
    "SELECT 1 FROM court_reservations WHERE court_id=? AND date=? AND time_slot LIKE ? AND status='active'"
  ).get(court.court_id, today, currentHour + "%");
  return active ? "booked" : "available";
}

function slotInMaintenance(courtId, date, slot) {
  const db = getDb();
  const court = db.prepare("SELECT * FROM courts WHERE court_id=?").get(courtId);
  if (!court || !court.maintenance_start || !court.maintenance_end) return false;
  const slotHour = parseInt(slot.split(":")[0]);
  const ms = new Date(court.maintenance_start);
  const me = new Date(court.maintenance_end);
  const slotDate = new Date(`${date}T${String(slotHour).padStart(2,"0")}:00:00`);
  return slotDate >= ms && slotDate < me;
}

function doubleBooking(courtId, date, slot) {
  const db = getDb();
  return !!db.prepare(
    "SELECT 1 FROM court_reservations WHERE court_id=? AND date=? AND time_slot=? AND status='active'"
  ).get(courtId, date, slot);
}

function slotConflict(memberId, date, slot) {
  const db = getDb();
  return !!db.prepare(
    "SELECT 1 FROM court_reservations WHERE member_id=? AND date=? AND time_slot=? AND status='active'"
  ).get(memberId, date, slot);
}

function calcDuration(entry, exit) {
  if (!entry || !exit) return null;
  const diff = Math.round((new Date(exit) - new Date(entry)) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getTodayPeakStats() {
  const db = getDb();
  const today = localDateStr();
  const hours = {};
  for (let h = 6; h <= 22; h++) {
    const label = `${String(h).padStart(2,"0")}:00`;
    const count = db.prepare(
      "SELECT COUNT(*) as c FROM attendance_logs WHERE date(entry_time)=? AND CAST(strftime('%H',entry_time) AS INTEGER)<=? AND (exit_time IS NULL OR CAST(strftime('%H',exit_time) AS INTEGER)>?)"
    ).get(today, h, h).c;
    hours[label] = count;
  }
  return hours;
}

module.exports = { json, readBody, localDateStr, getCourtStatus, slotConflict, doubleBooking, slotInMaintenance, calcDuration, getTodayPeakStats };