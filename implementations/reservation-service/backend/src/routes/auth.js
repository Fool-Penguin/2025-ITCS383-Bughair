// ============================================================
// src/routes/attendance.js
// Routes:
//   POST /api/attendance/enter
//   POST /api/attendance/exit
//   GET  /api/attendance/current
//   GET  /api/attendance/logs
//   GET  /api/reports/attendance
// ============================================================

const db = require("../db/data");
const { json, readBody, calcDuration, getTodayPeakStats } = require("../helpers");

async function handleAttendance(req, res, url, method) {

  // ── POST /api/attendance/enter ─────────────────────────
  // Called by the Entrance Gate System when a member enters.
  if (method === "POST" && url === "/api/attendance/enter") {
    const body = await readBody(req);
    const { member_id } = body;

    if (!member_id) {
      json(res, 400, { success: false, message: "member_id is required." });
      return true;
    }
    const alreadyInside = db.attendanceLogs.find(
      (l) => l.member_id === member_id && !l.exit_time
    );
    if (alreadyInside) {
      json(res, 409, { success: false, message: "Member is already inside the facility." });
      return true;
    }

    const user = db.users.find((u) => u.id === member_id);
    const log = {
      log_id: db.nextLogId++,
      member_id,
      member_name: user ? user.name : member_id,
      entry_time: new Date().toISOString(),
      exit_time: null,
    };
    db.attendanceLogs.push(log);

    const currentCount = db.attendanceLogs.filter((l) => !l.exit_time).length;
    json(res, 201, { success: true, log, current_count: currentCount });
    return true;
  }

  // ── POST /api/attendance/exit ──────────────────────────
  // Called by the Entrance Gate System when a member exits.
  if (method === "POST" && url === "/api/attendance/exit") {
    const body = await readBody(req);
    const { member_id } = body;

    if (!member_id) {
      json(res, 400, { success: false, message: "member_id is required." });
      return true;
    }
    const log = db.attendanceLogs
      .slice()
      .reverse()
      .find((l) => l.member_id === member_id && !l.exit_time);
    if (!log) {
      json(res, 404, { success: false, message: "No active entry found for this member." });
      return true;
    }

    log.exit_time = new Date().toISOString();
    const currentCount = db.attendanceLogs.filter((l) => !l.exit_time).length;
    json(res, 200, {
      success: true,
      log: { ...log, duration: calcDuration(log.entry_time, log.exit_time) },
      current_count: currentCount,
    });
    return true;
  }

  // ── GET /api/attendance/current ────────────────────────
  // Returns live count of members currently inside (exit_time IS NULL).
  if (method === "GET" && url === "/api/attendance/current") {
    const inside = db.attendanceLogs.filter((l) => !l.exit_time);
    json(res, 200, {
      success: true,
      current_count: inside.length,
      capacity_max: 100,
      capacity_percent: inside.length,
      members_inside: inside,
    });
    return true;
  }

  // ── GET /api/attendance/logs ───────────────────────────
  // Returns attendance history. Optional ?filter=in|out|all
  if (method === "GET" && url.startsWith("/api/attendance/logs")) {
    const params = new URLSearchParams(req.url.split("?")[1] || "");
    const filter = params.get("filter"); // "in" | "out" | "all"
    let list = [...db.attendanceLogs];
    if (filter === "in")  list = list.filter((l) => !l.exit_time);
    if (filter === "out") list = list.filter((l) =>  l.exit_time);
    const result = list.map((l) => ({
      ...l,
      duration: calcDuration(l.entry_time, l.exit_time),
      status: l.exit_time ? "exited" : "inside",
    }));
    json(res, 200, { success: true, logs: result.reverse() });
    return true;
  }

  // ── GET /api/reports/attendance ────────────────────────
  // Returns hourly breakdown and peak hours for today.
  if (method === "GET" && url === "/api/reports/attendance") {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = db.attendanceLogs.filter((l) => l.entry_time.startsWith(today));
    const peak = getTodayPeakStats();
    const peakHour = Object.entries(peak).sort((a, b) => b[1] - a[1])[0];
    json(res, 200, {
      success: true,
      report: {
        date: today,
        total_entries: todayLogs.length,
        currently_inside: db.attendanceLogs.filter((l) => !l.exit_time).length,
        peak_hour:  peakHour ? peakHour[0] : null,
        peak_count: peakHour ? peakHour[1] : 0,
        hourly_breakdown: peak,
      },
    });
    return true;
  }

  return false; // route not matched
}

module.exports = { handleAttendance };