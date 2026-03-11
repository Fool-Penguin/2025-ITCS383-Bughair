// ============================================================
// src/routes/attendance.js  —  SQLite version
// ============================================================

const { getDb, localDateStr } = require("../db/database");
const { json, readBody, calcDuration, getTodayPeakStats } = require("../helpers");

async function handleAttendance(req, res, url, method) {

  // POST /api/attendance/enter
  if (method === "POST" && url === "/api/attendance/enter") {
    const db = getDb();
    const { member_id } = await readBody(req);
    if (!member_id) { json(res, 400, { success: false, message: "member_id is required." }); return true; }

    const alreadyInside = db.prepare("SELECT 1 FROM attendance_logs WHERE member_id=? AND exit_time IS NULL").get(member_id);
    if (alreadyInside) { json(res, 409, { success: false, message: "Member is already inside." }); return true; }

    const user = db.prepare("SELECT name FROM users WHERE id=?").get(member_id);
    const member_name = user ? user.name : member_id;
    const entry_time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace("T", " ");

    const result = db.prepare("INSERT INTO attendance_logs (member_id, member_name, entry_time) VALUES (?,?,?)").run(member_id, member_name, entry_time);
    const log = db.prepare("SELECT * FROM attendance_logs WHERE log_id=?").get(result.lastInsertRowid);
    const current_count = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c;
    json(res, 201, { success: true, log, current_count });
    return true;
  }

  // POST /api/attendance/exit
  if (method === "POST" && url === "/api/attendance/exit") {
    const db = getDb();
    const { member_id } = await readBody(req);
    if (!member_id) { json(res, 400, { success: false, message: "member_id is required." }); return true; }

    const log = db.prepare("SELECT * FROM attendance_logs WHERE member_id=? AND exit_time IS NULL ORDER BY log_id DESC LIMIT 1").get(member_id);
    if (!log) { json(res, 404, { success: false, message: "No active entry found." }); return true; }

    const exit_time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace("T", " ");
    db.prepare("UPDATE attendance_logs SET exit_time=? WHERE log_id=?").run(exit_time, log.log_id);
    const current_count = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c;
    json(res, 200, { success: true, log: { ...log, exit_time, duration: calcDuration(log.entry_time, exit_time) }, current_count });
    return true;
  }

  // GET /api/attendance/current
  if (method === "GET" && url === "/api/attendance/current") {
    const db = getDb();
    const inside = db.prepare("SELECT * FROM attendance_logs WHERE exit_time IS NULL").all();
    json(res, 200, { success: true, current_count: inside.length, capacity_max: 100, capacity_percent: inside.length, members_inside: inside });
    return true;
  }

  // GET /api/attendance/logs
  if (method === "GET" && url.startsWith("/api/attendance/logs")) {
    const db = getDb();
    const params = new URLSearchParams(req.url.split("?")[1] || "");
    const filter = params.get("filter");
    let query = "SELECT * FROM attendance_logs";
    if (filter === "in")  query += " WHERE exit_time IS NULL";
    if (filter === "out") query += " WHERE exit_time IS NOT NULL";
    query += " ORDER BY log_id DESC";
    const rows = db.prepare(query).all().map(l => ({
      ...l,
      duration: calcDuration(l.entry_time, l.exit_time),
      status: l.exit_time ? "exited" : "inside",
    }));
    json(res, 200, { success: true, logs: rows });
    return true;
  }

  // GET /api/reports/attendance
  if (method === "GET" && url === "/api/reports/attendance") {
    const db = getDb();
    const today = localDateStr();
    const total_entries = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE date(entry_time)=?").get(today).c;
    const currently_inside = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c;
    const peak = getTodayPeakStats();
    const peakHour = Object.entries(peak).sort((a, b) => b[1] - a[1])[0];
    json(res, 200, {
      success: true,
      report: {
        date: today,
        total_entries,
        currently_inside,
        peak_hour: peakHour ? peakHour[0] : null,
        peak_count: peakHour ? peakHour[1] : 0,
        hourly_breakdown: peak,
      },
    });
    return true;
  }

  return false;
}

module.exports = { handleAttendance };