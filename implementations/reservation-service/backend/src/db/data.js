// ============================================================
// src/db/data.js
// Shared in-memory data store.
// In production: replace these arrays with MySQL queries.
// All route files import from here so they share the same data.
// ============================================================

let users = [
    { id: "M001", name: "John Doe",   email: "john@fit.com",  password: "1234",     role: "member" },
    { id: "M002", name: "Sara Kim",   email: "sara@fit.com",  password: "1234",     role: "member" },
    { id: "A001", name: "Admin User", email: "admin@fit.com", password: "admin123", role: "admin"  },
  ];
  
  let courts = [
    { court_id: 1, court_number: 1, status: "available", maintenance_start: null, maintenance_end: null },
    { court_id: 2, court_number: 2, status: "available", maintenance_start: null, maintenance_end: null },
    { court_id: 3, court_number: 3, status: "available", maintenance_start: null, maintenance_end: null },
    { court_id: 4, court_number: 4, status: "available", maintenance_start: null, maintenance_end: null },
    { court_id: 5, court_number: 5, status: "available", maintenance_start: null, maintenance_end: null },
  ];
  
  let courtReservations = [
    { reservation_id: "RES-001", court_id: 2, member_id: "M001", member_name: "John Doe", date: "2026-03-10", time_slot: "10:00–11:00", status: "active",    created_at: "2026-03-10T08:00:00" },
    { reservation_id: "RES-002", court_id: 4, member_id: "M002", member_name: "Sara Kim", date: "2026-03-10", time_slot: "13:00–14:00", status: "active",    created_at: "2026-03-10T08:30:00" },
    { reservation_id: "RES-003", court_id: 1, member_id: "M002", member_name: "Sara Kim", date: "2026-03-10", time_slot: "15:00–16:00", status: "active",    created_at: "2026-03-10T09:00:00" },
    { reservation_id: "RES-004", court_id: 5, member_id: "M001", member_name: "John Doe", date: "2026-03-09", time_slot: "18:00–19:00", status: "active",    created_at: "2026-03-09T17:00:00" },
    { reservation_id: "RES-005", court_id: 3, member_id: "M001", member_name: "John Doe", date: "2026-03-08", time_slot: "09:00–10:00", status: "cancelled", created_at: "2026-03-08T08:00:00" },
  ];
  
  let attendanceLogs = [
    { log_id: 1, member_id: "M001", member_name: "John Doe",  entry_time: "2026-03-10T07:32:00", exit_time: null },
    { log_id: 2, member_id: "M002", member_name: "Sara Kim",  entry_time: "2026-03-10T08:15:00", exit_time: "2026-03-10T09:45:00" },
    { log_id: 3, member_id: "M003", member_name: "Tom Lee",   entry_time: "2026-03-10T09:00:00", exit_time: null },
    { log_id: 4, member_id: "M004", member_name: "Amy Chen",  entry_time: "2026-03-10T06:50:00", exit_time: "2026-03-10T08:20:00" },
    { log_id: 5, member_id: "M005", member_name: "Pat Wong",  entry_time: "2026-03-10T09:30:00", exit_time: null },
    { log_id: 6, member_id: "M006", member_name: "Lisa Park", entry_time: "2026-03-10T07:00:00", exit_time: "2026-03-10T08:30:00" },
    { log_id: 7, member_id: "M007", member_name: "Mark Tan",  entry_time: "2026-03-10T10:00:00", exit_time: null },
  ];
  
  let nextResId = 6;
  let nextLogId = 8;
  
  module.exports = { users, courts, courtReservations, attendanceLogs, nextResId, nextLogId };