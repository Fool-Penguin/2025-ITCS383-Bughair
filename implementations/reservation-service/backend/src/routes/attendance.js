// ============================================================
// src/routes/attendance.js  —  SQLite version
// ============================================================

const { getDb, localDateStr } = require("../db/database");
const { json, readBody, calcDuration, getTodayPeakStats } = require("../helpers");

// ฟังก์ชันสำหรับบันทึกการเข้า (Enter)
async function handleEnter(db, req, res) {
  const { member_id } = await readBody(req);
  if (!member_id) return json(res, 400, { success: false, message: "member_id is required." });

  const alreadyInside = db.prepare("SELECT 1 FROM attendance_logs WHERE member_id=? AND exit_time IS NULL").get(member_id);
  if (alreadyInside) return json(res, 409, { success: false, message: "Member is already inside." });

  const user = db.prepare("SELECT name FROM users WHERE id=?").get(member_id);
  const member_name = user?.name || member_id;
  const entry_time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace("T", " ");

  const result = db.prepare("INSERT INTO attendance_logs (member_id, member_name, entry_time) VALUES (?,?,?)").run(member_id, member_name, entry_time);
  const log = db.prepare("SELECT * FROM attendance_logs WHERE log_id=?").get(result.lastInsertRowid);
  const current_count = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c;

  return json(res, 201, { success: true, log, current_count });
}

// ฟังก์ชันสำหรับบันทึกการออก (Exit)
async function handleExit(db, req, res) {
  const { member_id } = await readBody(req);
  if (!member_id) return json(res, 400, { success: false, message: "member_id is required." });

  const log = db.prepare("SELECT * FROM attendance_logs WHERE member_id=? AND exit_time IS NULL ORDER BY log_id DESC LIMIT 1").get(member_id);
  if (!log) return json(res, 404, { success: false, message: "No active entry found." });

  const exit_time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace("T", " ");
  db.prepare("UPDATE attendance_logs SET exit_time=? WHERE log_id=?").run(exit_time, log.log_id);
  const current_count = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c;

  return json(res, 200, { success: true, log: { ...log, exit_time, duration: calcDuration(log.entry_time, exit_time) }, current_count });
}

// ฟังก์ชันสำหรับดึง Log และสรุป Report
function handleGetLogs(db, req, res, url) {
  if (url.startsWith("/api/attendance/logs")) {
    const filter = new URLSearchParams(req.url.split("?")[1] || "").get("filter");
    let query = "SELECT * FROM attendance_logs";
    if (filter === "in") query += " WHERE exit_time IS NULL";
    if (filter === "out") query += " WHERE exit_time IS NOT NULL";
    
    const rows = db.prepare(query + " ORDER BY log_id DESC").all().map(l => ({
      ...l, duration: calcDuration(l.entry_time, l.exit_time), status: l.exit_time ? "exited" : "inside"
    }));
    return json(res, 200, { success: true, logs: rows });
  }

  if (url === "/api/reports/attendance") {
    const today = localDateStr();
    const peak = getTodayPeakStats();
    const peakHour = Object.entries(peak).sort((a, b) => b[1] - a[1])[0];
    return json(res, 200, {
      success: true,
      report: {
        date: today,
        total_entries: db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE date(entry_time)=?").get(today).c,
        currently_inside: db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c,
        peak_hour: peakHour?.[0] || null,
        peak_count: peakHour?.[1] || 0,
        hourly_breakdown: peak,
      },
    });
  }
}

async function handleAttendance(req, res, url, method) {
  const db = getDb();

  if (method === "POST") {
    if (url === "/api/attendance/enter") return await handleEnter(db, req, res);
    if (url === "/api/attendance/exit") return await handleExit(db, req, res);
  }

  if (method === "GET") {
    if (url === "/api/attendance/current") {
      const inside = db.prepare("SELECT * FROM attendance_logs WHERE exit_time IS NULL").all();
      return json(res, 200, { success: true, current_count: inside.length, members_inside: inside });
    }
    return handleGetLogs(db, req, res, url);
  }

  return false;
}

module.exports = { handleAttendance };