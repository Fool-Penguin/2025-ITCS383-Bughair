// ============================================================
// server.js  —  Entry point
// Court Reservation & Attendance Tracking Service
// ITCS383 Software Construction and Evolution
//
// Run:  node server.js
// Port: 8080
// Requires: npm install (better-sqlite3)
// ============================================================

const http = require("http");
const { json } = require("./src/helpers");
const { handleAuth }       = require("./src/routes/auth");
const { handleCourts }     = require("./src/routes/courts");
const { handleAttendance } = require("./src/routes/attendance");

const PORT = 8080;

const server = http.createServer(async (req, res) => {
  const url    = req.url.split("?")[0];
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") {
    json(res, 200, {});
    return;
  }

  // Delegate to route handlers in order.
  // Each handler returns true if it matched the route, false otherwise.
  if (await handleAuth(req, res, url, method))       return;
  if (await handleCourts(req, res, url, method))     return;
  if (await handleAttendance(req, res, url, method)) return;

  // No route matched
  json(res, 404, { success: false, message: `Route not found: ${method} ${url}` });
});

server.listen(PORT, () => {
  console.log(`\n✅  FitCourt Backend running on http://localhost:${PORT}`);
  console.log(`\n📋  Available endpoints:`);
  console.log(`    POST   /api/auth/login`);
  console.log(`    GET    /api/courts/available`);
  console.log(`    POST   /api/courts/book`);
  console.log(`    GET    /api/courts/reservations?member_id=M001`);
  console.log(`    DELETE /api/courts/reservations/:id`);
  console.log(`    POST   /api/courts/:id/maintenance`);
  console.log(`    DELETE /api/courts/:id/maintenance`);
  console.log(`    GET    /api/dashboard/stats`);
  console.log(`    POST   /api/attendance/enter`);
  console.log(`    POST   /api/attendance/exit`);
  console.log(`    GET    /api/attendance/current`);
  console.log(`    GET    /api/attendance/logs`);
  console.log(`    GET    /api/reports/attendance`);
  console.log(`\n💡  Demo accounts:`);
  console.log(`    john@fit.com / 1234   (member)`);
  console.log(`    admin@fit.com / admin123  (admin)\n`);
});