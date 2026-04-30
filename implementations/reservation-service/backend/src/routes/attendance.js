// ============================================================
// src/routes/attendance.js  —  Postgres version
// Routes:
//   POST /api/attendance/enter
//   POST /api/attendance/exit
//   GET  /api/attendance/current
//   GET  /api/attendance/logs
//   GET  /api/reports/attendance
// ============================================================

const { pool, seedIfEmpty, localDateStr } = require('../db/database');
const { json, readBody, calcDuration, getTodayPeakStats } = require('../helpers');

async function getCurrentCount() {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS c FROM reservation_svc.attendance_logs WHERE exit_time IS NULL`
  );
  return r.rows[0].c;
}

// ENTER
async function handleEnter(req, res) {
  const { member_id } = await readBody(req);
  if (!member_id) {
    return json(res, 400, { success: false, message: 'member_id is required.' });
  }

  const inside = await pool.query(
    `SELECT 1 FROM reservation_svc.attendance_logs
     WHERE member_id=$1 AND exit_time IS NULL LIMIT 1`,
    [member_id]
  );
  if (inside.rowCount > 0) {
    return json(res, 409, { success: false, message: 'Member is already inside the facility.' });
  }

  const userRes = await pool.query(
    `SELECT name FROM reservation_svc.users WHERE id=$1`,
    [member_id]
  );
  const member_name = userRes.rows[0]?.name || member_id;

  const ins = await pool.query(
    `INSERT INTO reservation_svc.attendance_logs (member_id, member_name, entry_time)
     VALUES ($1,$2,NOW()) RETURNING *`,
    [member_id, member_name]
  );

  json(res, 201, {
    success: true,
    log: ins.rows[0],
    current_count: await getCurrentCount(),
  });
}

// EXIT
async function handleExit(req, res) {
  const { member_id } = await readBody(req);
  if (!member_id) {
    return json(res, 400, { success: false, message: 'member_id is required.' });
  }

  const openRes = await pool.query(
    `SELECT * FROM reservation_svc.attendance_logs
     WHERE member_id=$1 AND exit_time IS NULL
     ORDER BY log_id DESC LIMIT 1`,
    [member_id]
  );
  const log = openRes.rows[0];
  if (!log) {
    return json(res, 404, { success: false, message: 'No active entry found for this member.' });
  }

  const upd = await pool.query(
    `UPDATE reservation_svc.attendance_logs SET exit_time=NOW()
     WHERE log_id=$1 RETURNING *`,
    [log.log_id]
  );
  const updated = upd.rows[0];

  json(res, 200, {
    success: true,
    log: { ...updated, duration: calcDuration(updated.entry_time, updated.exit_time) },
    current_count: await getCurrentCount(),
  });
}

// CURRENT
async function handleCurrent(res) {
  const r = await pool.query(
    `SELECT * FROM reservation_svc.attendance_logs WHERE exit_time IS NULL ORDER BY entry_time DESC`
  );
  json(res, 200, {
    success: true,
    current_count: r.rowCount,
    capacity_max: 100,
    capacity_percent: r.rowCount,
    members_inside: r.rows,
  });
}

// LOGS
async function handleLogs(req, res) {
  const params = new URLSearchParams(req.url.split('?')[1] || '');
  const filter = params.get('filter');

  let sql = `SELECT * FROM reservation_svc.attendance_logs`;
  if (filter === 'in')  sql += ` WHERE exit_time IS NULL`;
  if (filter === 'out') sql += ` WHERE exit_time IS NOT NULL`;
  sql += ` ORDER BY log_id DESC`;

  const r = await pool.query(sql);
  const result = r.rows.map((l) => ({
    ...l,
    duration: calcDuration(l.entry_time, l.exit_time),
    status: l.exit_time ? 'exited' : 'inside',
  }));

  json(res, 200, { success: true, logs: result });
}

// REPORT
async function handleReport(res) {
  const today = localDateStr();
  const totalRes = await pool.query(
    `SELECT COUNT(*)::int AS c FROM reservation_svc.attendance_logs
     WHERE entry_time::date = $1::date`,
    [today]
  );
  const peak = await getTodayPeakStats();
  const peakHour = Object.entries(peak).sort((a, b) => b[1] - a[1])[0];

  json(res, 200, {
    success: true,
    report: {
      date: today,
      total_entries: totalRes.rows[0].c,
      currently_inside: await getCurrentCount(),
      peak_hour: peakHour ? peakHour[0] : null,
      peak_count: peakHour ? peakHour[1] : 0,
      hourly_breakdown: peak,
    },
  });
}

// MAIN ROUTER
async function handleAttendance(req, res, url, method) {
  await seedIfEmpty();

  if (method === 'POST' && url === '/api/attendance/enter') {
    await handleEnter(req, res);
    return true;
  }
  if (method === 'POST' && url === '/api/attendance/exit') {
    await handleExit(req, res);
    return true;
  }
  if (method === 'GET' && url === '/api/attendance/current') {
    await handleCurrent(res);
    return true;
  }
  if (method === 'GET' && url.startsWith('/api/attendance/logs')) {
    await handleLogs(req, res);
    return true;
  }
  if (method === 'GET' && url === '/api/reports/attendance') {
    await handleReport(res);
    return true;
  }

  return false;
}

// AuthMembership server.js destructures handleAttendance — export both forms.
module.exports = handleAttendance;
module.exports.handleAttendance = handleAttendance;
