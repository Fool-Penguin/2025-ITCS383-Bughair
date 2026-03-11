// ============================================================
// src/routes/courts.js  —  SQLite version
// ============================================================

const { getDb, localDateStr } = require("../db/database");
const { json, readBody, getCourtStatus, doubleBooking, slotConflict, slotInMaintenance } = require("../helpers");

async function handleCourts(req, res, url, method) {

  // GET /api/courts/available?date=YYYY-MM-DD
  if (method === "GET" && url.startsWith("/api/courts/available")) {
    const db = getDb();
    const params = new URLSearchParams(req.url.split("?")[1] || "");
    const targetDate = params.get("date") || localDateStr();
    const isToday = targetDate === localDateStr();

    const courts = db.prepare("SELECT * FROM courts ORDER BY court_number").all();
    const result = courts.map(c => {
      let status;
      if (isToday) {
        status = getCourtStatus(c);
      } else {
        if (c.maintenance_start && c.maintenance_end) {
          const ms = new Date(c.maintenance_start);
          const me = new Date(c.maintenance_end);
          const dayStart = new Date(targetDate + "T00:00:00");
          const dayEnd   = new Date(targetDate + "T23:59:59");
          status = (ms <= dayEnd && me >= dayStart) ? "maintenance" : "available";
        } else {
          status = "available";
        }
      }
      const booked_slots = db.prepare(
        "SELECT time_slot FROM court_reservations WHERE court_id=? AND date=? AND status='active'"
      ).all(c.court_id, targetDate).map(r => r.time_slot);

      return { ...c, status, booked_slots };
    });
    json(res, 200, { success: true, courts: result });
    return true;
  }

  // POST /api/courts/book
  if (method === "POST" && url === "/api/courts/book") {
    const db = getDb();
    const { court_id, member_id, member_name, date, time_slot } = await readBody(req);
    if (!court_id || !member_id || !date || !time_slot) {
      json(res, 400, { success: false, message: "Missing required fields." }); return true;
    }
    if (doubleBooking(court_id, date, time_slot)) {
      json(res, 409, { success: false, message: "Court already booked for this slot." }); return true;
    }
    if (slotConflict(member_id, date, time_slot)) {
      json(res, 409, { success: false, message: "You already have a booking at this time." }); return true;
    }
    if (slotInMaintenance(court_id, date, time_slot)) {
      json(res, 409, { success: false, message: "Court is under maintenance during this time." }); return true;
    }
    // Generate next reservation ID
    const lastRes = db.prepare("SELECT reservation_id FROM court_reservations ORDER BY reservation_id DESC LIMIT 1").get();
    let nextNum = 6;
    if (lastRes) {
      const match = lastRes.reservation_id.match(/RES-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const reservation_id = `RES-${String(nextNum).padStart(3, "0")}`;
    const created_at = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace("T", " ");

    db.prepare(
      "INSERT INTO court_reservations (reservation_id,court_id,member_id,member_name,date,time_slot,status,created_at) VALUES (?,?,?,?,?,?,?,?)"
    ).run(reservation_id, court_id, member_id, member_name || member_id, date, time_slot, "active", created_at);

    const reservation = db.prepare("SELECT * FROM court_reservations WHERE reservation_id=?").get(reservation_id);
    json(res, 201, { success: true, reservation });
    return true;
  }

  // GET /api/courts/reservations
  if (method === "GET" && url.startsWith("/api/courts/reservations") && !url.includes("/reservations/")) {
    const db = getDb();
    const params = new URLSearchParams(req.url.split("?")[1] || "");
    const memberId = params.get("member_id");
    const rows = memberId
      ? db.prepare("SELECT * FROM court_reservations WHERE member_id=? ORDER BY created_at DESC").all(memberId)
      : db.prepare("SELECT * FROM court_reservations ORDER BY created_at DESC").all();
    json(res, 200, { success: true, reservations: rows });
    return true;
  }

  // DELETE /api/courts/reservations/:id
  if (method === "DELETE" && url.startsWith("/api/courts/reservations/")) {
    const db = getDb();
    const resId = url.split("/").pop();
    const r = db.prepare("SELECT * FROM court_reservations WHERE reservation_id=?").get(resId);
    if (!r) { json(res, 404, { success: false, message: "Reservation not found." }); return true; }
    db.prepare("UPDATE court_reservations SET status='cancelled' WHERE reservation_id=?").run(resId);
    json(res, 200, { success: true, message: "Reservation cancelled.", reservation: { ...r, status: "cancelled" } });
    return true;
  }

  // POST /api/courts/:id/maintenance
  if (method === "POST" && /^\/api\/courts\/\d+\/maintenance$/.test(url)) {
    const db = getDb();
    const courtId = parseInt(url.split("/")[3]);
    const { maintenance_start, maintenance_end } = await readBody(req);
    if (!maintenance_start || !maintenance_end) {
      json(res, 400, { success: false, message: "maintenance_start and maintenance_end required." }); return true;
    }
    const court = db.prepare("SELECT * FROM courts WHERE court_id=?").get(courtId);
    if (!court) { json(res, 404, { success: false, message: "Court not found." }); return true; }
    db.prepare("UPDATE courts SET maintenance_start=?, maintenance_end=? WHERE court_id=?").run(maintenance_start, maintenance_end, courtId);
    json(res, 200, { success: true, message: "Maintenance scheduled.", court: { ...court, maintenance_start, maintenance_end } });
    return true;
  }

  // DELETE /api/courts/:id/maintenance
  if (method === "DELETE" && /^\/api\/courts\/\d+\/maintenance$/.test(url)) {
    const db = getDb();
    const courtId = parseInt(url.split("/")[3]);
    const court = db.prepare("SELECT * FROM courts WHERE court_id=?").get(courtId);
    if (!court) { json(res, 404, { success: false, message: "Court not found." }); return true; }
    db.prepare("UPDATE courts SET maintenance_start=NULL, maintenance_end=NULL WHERE court_id=?").run(courtId);
    json(res, 200, { success: true, message: "Maintenance removed." });
    return true;
  }

  // GET /api/dashboard/stats
  if (method === "GET" && url === "/api/dashboard/stats") {
    const db = getDb();
    const today = localDateStr();
    const courts = db.prepare("SELECT * FROM courts").all();
    const courtStats = courts.map(c => ({ ...c, status: getCourtStatus(c) }));
    const reservationsToday = db.prepare(
      "SELECT COUNT(*) as c FROM court_reservations WHERE date=? AND status='active'"
    ).get(today).c;
    const membersInside = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c;
    json(res, 200, {
      success: true,
      stats: {
        courts_available:   courtStats.filter(c => c.status === "available").length,
        courts_booked:      courtStats.filter(c => c.status === "booked").length,
        courts_maintenance: courtStats.filter(c => c.status === "maintenance").length,
        members_inside:     membersInside,
        reservations_today: reservationsToday,
        capacity_percent:   membersInside,
      },
    });
    return true;
  }

  return false;
}

module.exports = { handleCourts };