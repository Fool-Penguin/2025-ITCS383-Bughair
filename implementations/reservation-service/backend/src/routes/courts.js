// ============================================================
// src/routes/courts.js  —  SQLite version (Refactored)
// ============================================================

const { getDb, localDateStr } = require("../db/database");
const { json, readBody, getCourtStatus, doubleBooking, slotConflict, slotInMaintenance } = require("../helpers");

// --- [HELPERS / SUB-HANDLERS] ---

function handleGetAvailable(db, res, url) {
  const params = new URLSearchParams(url.split("?")[1] || "");
  const targetDate = params.get("date") || localDateStr();
  const courts = db.prepare("SELECT * FROM courts ORDER BY court_number").all();
  return json(res, 200, { success: true, targetDate, courts });
}

async function handleBooking(db, req, res) {
  const { court_id, member_id, member_name, date, time_slot } = await readBody(req);
  if (!court_id || !member_id || !date || !time_slot) {
    return json(res, 400, { success: false, message: "Missing required fields." });
  }

  if (doubleBooking(court_id, date, time_slot)) return json(res, 409, { success: false, message: "Court already booked." });
  if (slotConflict(member_id, date, time_slot)) return json(res, 409, { success: false, message: "Member already has a booking." });
  if (slotInMaintenance(court_id, date, time_slot)) return json(res, 409, { success: false, message: "Court under maintenance." });

  const lastRes = db.prepare("SELECT reservation_id FROM court_reservations ORDER BY reservation_id DESC LIMIT 1").get();
  const nextNum = lastRes ? (parseInt(lastRes.reservation_id.match(/RES-(\d+)/)?.[1] || 5) + 1) : 6;
  const resId = `RES-${String(nextNum).padStart(3, "0")}`;
  const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace("T", " ");

  db.prepare("INSERT INTO court_reservations (reservation_id,court_id,member_id,member_name,date,time_slot,status,created_at) VALUES (?,?,?,?,?,?,?,?)")
    .run(resId, court_id, member_id, member_name || member_id, date, time_slot, "active", now);

  return json(res, 201, { success: true, reservation: db.prepare("SELECT * FROM court_reservations WHERE reservation_id=?").get(resId) });
}

function handleGetDashboard(db, res) {
  const today = localDateStr();
  const courts = db.prepare("SELECT * FROM courts").all();
  const courtStats = courts.map(c => ({ ...c, status: getCourtStatus(c) }));
  const membersInside = db.prepare("SELECT COUNT(*) as c FROM attendance_logs WHERE exit_time IS NULL").get().c;
  
  return json(res, 200, {
    success: true,
    stats: {
      courts_available: courtStats.filter(c => c.status === "available").length,
      courts_booked: courtStats.filter(c => c.status === "booked").length,
      members_inside: membersInside,
      reservations_today: db.prepare("SELECT COUNT(*) as c FROM court_reservations WHERE date=? AND status='active'").get(today).c
    }
  });
}

// ฟังก์ชันย่อยสำหรับยกเลิกการจอง
function handleCancelBooking(db, res, url) {
  const resId = url.split("/").pop();
  const r = db.prepare("SELECT * FROM court_reservations WHERE reservation_id=?").get(resId);
  if (!r) return json(res, 404, { success: false, message: "Reservation not found." });

  db.prepare("UPDATE court_reservations SET status='cancelled' WHERE reservation_id=?").run(resId);
  return json(res, 200, { success: true, message: "Reservation cancelled." });
}

// ฟังก์ชันย่อยสำหรับจัดการการซ่อมบำรุง (POST/DELETE)
async function handleMaintenance(db, req, res, url, method) {
  const courtId = parseInt(url.split("/")[3]);
  const court = db.prepare("SELECT * FROM courts WHERE court_id=?").get(courtId);
  if (!court) return json(res, 404, { success: false, message: "Court not found." });

  if (method === "DELETE") {
    db.prepare("UPDATE courts SET maintenance_start=NULL, maintenance_end=NULL WHERE court_id=?").run(courtId);
    return json(res, 200, { success: true, message: "Maintenance removed." });
  }

  const { maintenance_start, maintenance_end } = await readBody(req);
  if (!maintenance_start || !maintenance_end) return json(res, 400, { success: false, message: "Start/End dates required." });

  db.prepare("UPDATE courts SET maintenance_start=?, maintenance_end=? WHERE court_id=?").run(maintenance_start, maintenance_end, courtId);
  return json(res, 200, { success: true, message: "Maintenance scheduled." });
}

// --- [MAIN DISPATCHER] ---

async function handleCourts(req, res, url, method) {
  const db = getDb();

  // GET Requests
  if (method === "GET") {
    if (url.startsWith("/api/courts/available")) return handleGetAvailable(db, res, url);
    if (url === "/api/dashboard/stats") return handleGetDashboard(db, res);
    if (url.startsWith("/api/courts/reservations")) {
      const memberId = new URLSearchParams(url.split("?")[1] || "").get("member_id");
      const rows = memberId 
        ? db.prepare("SELECT * FROM court_reservations WHERE member_id=? ORDER BY created_at DESC").all(memberId)
        : db.prepare("SELECT * FROM court_reservations ORDER BY created_at DESC").all();
      return json(res, 200, { success: true, reservations: rows });
    }
  }

  // POST Requests
  if (method === "POST") {
    if (url === "/api/courts/book") return await handleBooking(db, req, res);
    if (/\/api\/courts\/\d+\/maintenance/.test(url)) return await handleMaintenance(db, req, res, url, "POST");
  }

  // DELETE Requests
  if (method === "DELETE") {
    if (url.startsWith("/api/courts/reservations/")) return handleCancelBooking(db, res, url);
    if (/\/api\/courts\/\d+\/maintenance/.test(url)) return await handleMaintenance(db, req, res, url, "DELETE");
  }

  return false;
}

module.exports = { handleCourts };