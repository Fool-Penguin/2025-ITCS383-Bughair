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

// ---------------- Helper ----------------
function getCurrentCount() {
  return db.attendanceLogs.filter((l) => !l.exit_time).length;
}

// ---------------- ENTER ----------------
async function handleEnter(req, res) {
  const body = await readBody(req);
  const { member_id } = body;

  if (!member_id) {
    json(res, 400, { success: false, message: "member_id is required." });
    return;
  }

  const alreadyInside = db.attendanceLogs.find(
    (l) => l.member_id === member_id && !l.exit_time
  );

  if (alreadyInside) {
    json(res, 409, { success: false, message: "Member is already inside the facility." });
    return;
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

  json(res, 201, {
    success: true,
    log,
    current_count: getCurrentCount(),
  });
}

// ---------------- EXIT ----------------
async function handleExit(req, res) {
  const body = await readBody(req);
  const { member_id } = body;

  if (!member_id) {
    json(res, 400, { success: false, message: "member_id is required." });
    return;
  }

  const log = db.attendanceLogs
    .slice()
    .reverse()
    .find((l) => l.member_id === member_id && !l.exit_time);

  if (!log) {
    json(res, 404, { success: false, message: "No active entry found for this member." });
    return;
  }

  log.exit_time = new Date().toISOString();

  json(res, 200, {
    success: true,
    log: { ...log, duration: calcDuration(log.entry_time, log.exit_time) },
    current_count: getCurrentCount(),
  });
}

// ---------------- CURRENT ----------------
function handleCurrent(res) {
  const inside = db.attendanceLogs.filter((l) => !l.exit_time);

  json(res, 200, {
    success: true,
    current_count: inside.length,
    capacity_max: 100,
    capacity_percent: inside.length,
    members_inside: inside,
  });
}

// ---------------- LOGS ----------------
function handleLogs(req, res) {
  const params = new URLSearchParams(req.url.split("?")[1] || "");
  const filter = params.get("filter");

  let list = [...db.attendanceLogs];

  if (filter === "in") list = list.filter((l) => !l.exit_time);
  if (filter === "out") list = list.filter((l) => l.exit_time);

  const result = list.map((l) => ({
    ...l,
    duration: calcDuration(l.entry_time, l.exit_time),
    status: l.exit_time ? "exited" : "inside",
  }));

  json(res, 200, { success: true, logs: result.reverse() });
}

// ---------------- REPORT ----------------
function handleReport(res) {
  const today = new Date().toISOString().split("T")[0];

  const todayLogs = db.attendanceLogs.filter((l) =>
    l.entry_time.startsWith(today)
  );

  const peak = getTodayPeakStats();
  const peakHour = Object.entries(peak).sort((a, b) => b[1] - a[1])[0];

  json(res, 200, {
    success: true,
    report: {
      date: today,
      total_entries: todayLogs.length,
      currently_inside: getCurrentCount(),
      peak_hour: peakHour ? peakHour[0] : null,
      peak_count: peakHour ? peakHour[1] : 0,
      hourly_breakdown: peak,
    },
  });
}

// ---------------- MAIN ROUTER ----------------
async function handleAttendance(req, res, url, method) {

  if (method === "POST" && url === "/api/attendance/enter") {
    await handleEnter(req, res);
    return true;
  }

  if (method === "POST" && url === "/api/attendance/exit") {
    await handleExit(req, res);
    return true;
  }

  if (method === "GET" && url === "/api/attendance/current") {
    handleCurrent(res);
    return true;
  }

  if (method === "GET" && url.startsWith("/api/attendance/logs")) {
    handleLogs(req, res);
    return true;
  }

  if (method === "GET" && url === "/api/reports/attendance") {
    handleReport(res);
    return true;
  }

  return false;
}

module.exports = handleAttendance;
