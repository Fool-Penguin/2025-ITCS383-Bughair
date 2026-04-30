// ============================================================
// src/helpers.js  —  Postgres version
// ============================================================

const { pool, localDateStr } = require('./db/database');

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && Object.keys(req.body).length > 0) {
      return resolve(req.body);
    }
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

async function getCourtStatus(court) {
  const now = new Date();
  if (court.maintenance_start && court.maintenance_end) {
    const s = new Date(court.maintenance_start);
    const e = new Date(court.maintenance_end);
    if (now >= s && now <= e) return 'maintenance';
  }
  const today = localDateStr();
  const currentHour = String(now.getHours()).padStart(2, '0') + ':00';
  const r = await pool.query(
    `SELECT 1 FROM reservation_svc.court_reservations
     WHERE court_id=$1 AND date=$2::date AND time_slot LIKE $3 AND status='active' LIMIT 1`,
    [court.court_id, today, currentHour + '%']
  );
  return r.rowCount > 0 ? 'booked' : 'available';
}

async function slotInMaintenance(courtId, date, slot) {
  const r = await pool.query(
    `SELECT maintenance_start, maintenance_end FROM reservation_svc.courts WHERE court_id=$1`,
    [courtId]
  );
  const court = r.rows[0];
  if (!court || !court.maintenance_start || !court.maintenance_end) return false;
  const slotHour = parseInt(slot.split(':')[0]);
  const ms = new Date(court.maintenance_start);
  const me = new Date(court.maintenance_end);
  const slotDate = new Date(`${date}T${String(slotHour).padStart(2, '0')}:00:00`);
  return slotDate >= ms && slotDate < me;
}

async function doubleBooking(courtId, date, slot) {
  const r = await pool.query(
    `SELECT 1 FROM reservation_svc.court_reservations
     WHERE court_id=$1 AND date=$2::date AND time_slot=$3 AND status='active' LIMIT 1`,
    [courtId, date, slot]
  );
  return r.rowCount > 0;
}

async function slotConflict(memberId, date, slot) {
  const r = await pool.query(
    `SELECT 1 FROM reservation_svc.court_reservations
     WHERE member_id=$1 AND date=$2::date AND time_slot=$3 AND status='active' LIMIT 1`,
    [memberId, date, slot]
  );
  return r.rowCount > 0;
}

function calcDuration(entry, exit) {
  if (!entry || !exit) return null;
  const diff = Math.round((new Date(exit) - new Date(entry)) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

async function getTodayPeakStats() {
  const today = localDateStr();
  const hours = {};
  for (let h = 6; h <= 22; h++) {
    const label = `${String(h).padStart(2, '0')}:00`;
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM reservation_svc.attendance_logs
       WHERE entry_time::date = $1::date
         AND EXTRACT(HOUR FROM entry_time) <= $2
         AND (exit_time IS NULL OR EXTRACT(HOUR FROM exit_time) > $2)`,
      [today, h]
    );
    hours[label] = r.rows[0].c;
  }
  return hours;
}

module.exports = {
  json, readBody, localDateStr,
  getCourtStatus, slotConflict, doubleBooking, slotInMaintenance,
  calcDuration, getTodayPeakStats,
};
