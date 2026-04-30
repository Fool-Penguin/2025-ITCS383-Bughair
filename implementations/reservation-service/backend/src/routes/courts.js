// ============================================================
// src/routes/courts.js  —  Postgres version
// ============================================================

const { pool, localDateStr } = require('../db/database');
const {
  json, readBody, getCourtStatus, doubleBooking, slotConflict, slotInMaintenance
} = require('../helpers');

// --- [HELPERS / SUB-HANDLERS] ---

async function handleGetAvailable(res, url) {
  const params = new URLSearchParams(url.split('?')[1] || '');
  const targetDate = params.get('date') || localDateStr();
  const r = await pool.query(`SELECT * FROM reservation_svc.courts ORDER BY court_number`);
  return json(res, 200, { success: true, targetDate, courts: r.rows });
}

async function handleBooking(req, res) {
  const { court_id, member_id, member_name, date, time_slot } = await readBody(req);
  if (!court_id || !member_id || !date || !time_slot) {
    return json(res, 400, { success: false, message: 'Missing required fields.' });
  }

  if (await doubleBooking(court_id, date, time_slot)) return json(res, 409, { success: false, message: 'Court already booked.' });
  if (await slotConflict(member_id, date, time_slot)) return json(res, 409, { success: false, message: 'Member already has a booking.' });
  if (await slotInMaintenance(court_id, date, time_slot)) return json(res, 409, { success: false, message: 'Court under maintenance.' });

  const lastRes = await pool.query(
    `SELECT reservation_id FROM reservation_svc.court_reservations
       WHERE reservation_id LIKE 'RES-%'
       ORDER BY reservation_id DESC LIMIT 1`
  );
  const nextNum = lastRes.rowCount > 0
    ? (parseInt(lastRes.rows[0].reservation_id.match(/RES-(\d+)/)?.[1] || 5) + 1)
    : 6;
  const resId = `RES-${String(nextNum).padStart(3, '0')}`;
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ');

  await pool.query(
    `INSERT INTO reservation_svc.court_reservations
       (reservation_id, court_id, member_id, member_name, date, time_slot, status, created_at)
     VALUES ($1,$2,$3,$4,$5::date,$6,$7,$8::timestamptz)`,
    [resId, court_id, member_id, member_name || member_id, date, time_slot, 'active', now]
  );

  const inserted = await pool.query(
    `SELECT * FROM reservation_svc.court_reservations WHERE reservation_id=$1`,
    [resId]
  );
  return json(res, 201, { success: true, reservation: inserted.rows[0] });
}

async function handleGetDashboard(res) {
  const today = localDateStr();
  const courtsRes = await pool.query(`SELECT * FROM reservation_svc.courts`);
  const courtStats = await Promise.all(
    courtsRes.rows.map(async (c) => ({ ...c, status: await getCourtStatus(c) }))
  );
  const insideRes = await pool.query(
    `SELECT COUNT(*)::int AS c FROM reservation_svc.attendance_logs WHERE exit_time IS NULL`
  );
  const reservRes = await pool.query(
    `SELECT COUNT(*)::int AS c FROM reservation_svc.court_reservations
     WHERE date=$1::date AND status='active'`,
    [today]
  );

  return json(res, 200, {
    success: true,
    stats: {
      courts_available: courtStats.filter((c) => c.status === 'available').length,
      courts_booked:    courtStats.filter((c) => c.status === 'booked').length,
      members_inside:   insideRes.rows[0].c,
      reservations_today: reservRes.rows[0].c,
    },
  });
}

async function handleCancelBooking(res, url) {
  const resId = url.split('/').pop();
  const r = await pool.query(
    `SELECT 1 FROM reservation_svc.court_reservations WHERE reservation_id=$1`,
    [resId]
  );
  if (r.rowCount === 0) return json(res, 404, { success: false, message: 'Reservation not found.' });

  await pool.query(
    `UPDATE reservation_svc.court_reservations SET status='cancelled' WHERE reservation_id=$1`,
    [resId]
  );
  return json(res, 200, { success: true, message: 'Reservation cancelled.' });
}

async function handleMaintenance(req, res, url, method) {
  const courtId = parseInt(url.split('/')[3]);
  const r = await pool.query(`SELECT 1 FROM reservation_svc.courts WHERE court_id=$1`, [courtId]);
  if (r.rowCount === 0) return json(res, 404, { success: false, message: 'Court not found.' });

  if (method === 'DELETE') {
    await pool.query(
      `UPDATE reservation_svc.courts SET maintenance_start=NULL, maintenance_end=NULL WHERE court_id=$1`,
      [courtId]
    );
    return json(res, 200, { success: true, message: 'Maintenance removed.' });
  }

  const { maintenance_start, maintenance_end } = await readBody(req);
  if (!maintenance_start || !maintenance_end) {
    return json(res, 400, { success: false, message: 'Start/End dates required.' });
  }

  await pool.query(
    `UPDATE reservation_svc.courts
       SET maintenance_start=$1::timestamptz, maintenance_end=$2::timestamptz
     WHERE court_id=$3`,
    [maintenance_start, maintenance_end, courtId]
  );
  return json(res, 200, { success: true, message: 'Maintenance scheduled.' });
}

// --- [MAIN DISPATCHER] ---

async function handleCourts(req, res, url, method) {
  // Trigger lazy seed on first request
  require('../db/database').getDb();

  if (method === 'GET') {
    if (url.startsWith('/api/courts/available')) return handleGetAvailable(res, url);
    if (url === '/api/dashboard/stats') return handleGetDashboard(res);
    if (url.startsWith('/api/courts/reservations')) {
      const memberId = new URLSearchParams(url.split('?')[1] || '').get('member_id');
      const rows = memberId
        ? (await pool.query(
            `SELECT * FROM reservation_svc.court_reservations WHERE member_id=$1 ORDER BY created_at DESC`,
            [memberId]
          )).rows
        : (await pool.query(
            `SELECT * FROM reservation_svc.court_reservations ORDER BY created_at DESC`
          )).rows;
      return json(res, 200, { success: true, reservations: rows });
    }
  }

  if (method === 'POST') {
    if (url === '/api/courts/book') return await handleBooking(req, res);
    if (/\/api\/courts\/\d+\/maintenance/.test(url)) return await handleMaintenance(req, res, url, 'POST');
  }

  if (method === 'DELETE') {
    if (url.startsWith('/api/courts/reservations/')) return handleCancelBooking(res, url);
    if (/\/api\/courts\/\d+\/maintenance/.test(url)) return await handleMaintenance(req, res, url, 'DELETE');
  }

  return false;
}

module.exports = { handleCourts };
