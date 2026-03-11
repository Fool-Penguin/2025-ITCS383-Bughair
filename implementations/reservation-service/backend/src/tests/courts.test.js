// ============================================================
// src/tests/courts.test.js
// Unit tests for the Resource Conflict Checker logic.
//
// Run:  node --test src/tests/courts.test.js
// Uses Node.js built-in test runner (v18+). No npm install needed.
// ============================================================

const { describe, it, before, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// We test the pure logic functions directly, bypassing HTTP.
// Import helpers (they read from db/data.js).
const db = require("../db/data");
const {
  doubleBooking,
  slotConflict,
  slotInMaintenance,
  getCourtStatus,
  calcDuration,
} = require("../helpers");

// ── Reset data before each test so tests don't bleed into each other ──
const ORIGINAL_RESERVATIONS = JSON.parse(JSON.stringify(db.courtReservations));
const ORIGINAL_COURTS       = JSON.parse(JSON.stringify(db.courts));

function resetData() {
  db.courtReservations.length = 0;
  ORIGINAL_RESERVATIONS.forEach((r) => db.courtReservations.push({ ...r }));
  db.courts.length = 0;
  ORIGINAL_COURTS.forEach((c) => db.courts.push({ ...c }));
}

// ══════════════════════════════════════════════════════════════
// doubleBooking()
// ══════════════════════════════════════════════════════════════
describe("doubleBooking()", () => {
  beforeEach(resetData);

  it("returns true when court + date + slot already has an active booking", () => {
    // RES-001 is court 2, date 2026-03-10, slot "10:00–11:00"
    const result = doubleBooking(2, "2026-03-10", "10:00–11:00");
    assert.equal(result, true);
  });

  it("returns false when the slot is free on that court", () => {
    const result = doubleBooking(2, "2026-03-10", "09:00–10:00");
    assert.equal(result, false);
  });

  it("returns false when same slot but different court", () => {
    const result = doubleBooking(3, "2026-03-10", "10:00–11:00");
    assert.equal(result, false);
  });

  it("returns false when same court + slot but cancelled status", () => {
    // RES-005 is court 3, 2026-03-08, 09:00–10:00, status=cancelled
    const result = doubleBooking(3, "2026-03-08", "09:00–10:00");
    assert.equal(result, false);
  });

  it("returns false when same court + slot but different date", () => {
    const result = doubleBooking(2, "2026-03-11", "10:00–11:00");
    assert.equal(result, false);
  });
});

// ══════════════════════════════════════════════════════════════
// slotConflict()
// ══════════════════════════════════════════════════════════════
describe("slotConflict()", () => {
  beforeEach(resetData);

  it("returns true when member already has a booking at same date + slot", () => {
    // M001 has RES-001: court 2, 2026-03-10, 10:00–11:00
    const result = slotConflict("M001", "2026-03-10", "10:00–11:00");
    assert.equal(result, true);
  });

  it("returns false when member has no booking at that slot", () => {
    const result = slotConflict("M001", "2026-03-10", "08:00–09:00");
    assert.equal(result, false);
  });

  it("returns false when a different member has that slot", () => {
    // M002 has the 13:00–14:00 slot, not M001
    const result = slotConflict("M001", "2026-03-10", "13:00–14:00");
    assert.equal(result, false);
  });

  it("returns false when member's booking for that slot is cancelled", () => {
    // M001 RES-005 is cancelled
    const result = slotConflict("M001", "2026-03-08", "09:00–10:00");
    assert.equal(result, false);
  });
});

// ══════════════════════════════════════════════════════════════
// slotInMaintenance()
// ══════════════════════════════════════════════════════════════
describe("slotInMaintenance()", () => {
  beforeEach(resetData);

  it("returns false when court has no maintenance scheduled", () => {
    const result = slotInMaintenance(1, "2026-03-10", "10:00");
    assert.equal(result, false);
  });

  it("returns true when slot falls inside maintenance window", () => {
    db.courts[0].maintenance_start = "2026-03-10 09:00:00";
    db.courts[0].maintenance_end   = "2026-03-10 12:00:00";
    const result = slotInMaintenance(1, "2026-03-10", "10:00–11:00");
    assert.equal(result, true);
  });

  it("returns false when slot is before the maintenance window", () => {
    db.courts[0].maintenance_start = "2026-03-10 14:00:00";
    db.courts[0].maintenance_end   = "2026-03-10 17:00:00";
    const result = slotInMaintenance(1, "2026-03-10", "10:00–11:00");
    assert.equal(result, false);
  });

  it("returns false when slot is after the maintenance window", () => {
    db.courts[0].maintenance_start = "2026-03-10 07:00:00";
    db.courts[0].maintenance_end   = "2026-03-10 09:00:00";
    const result = slotInMaintenance(1, "2026-03-10", "10:00–11:00");
    assert.equal(result, false);
  });
});

// ══════════════════════════════════════════════════════════════
// calcDuration()
// ══════════════════════════════════════════════════════════════
describe("calcDuration()", () => {
  it("returns null when exit_time is null", () => {
    assert.equal(calcDuration("2026-03-10T08:00:00", null), null);
  });

  it("returns minutes-only string for durations under 1 hour", () => {
    assert.equal(calcDuration("2026-03-10T08:00:00", "2026-03-10T08:45:00"), "45m");
  });

  it("returns hours and minutes string for durations over 1 hour", () => {
    assert.equal(calcDuration("2026-03-10T08:00:00", "2026-03-10T09:30:00"), "1h 30m");
  });

  it("returns correct string for exactly 1 hour", () => {
    assert.equal(calcDuration("2026-03-10T08:00:00", "2026-03-10T09:00:00"), "1h 0m");
  });
});

// ══════════════════════════════════════════════════════════════
// getCourtStatus()
// ══════════════════════════════════════════════════════════════
describe("getCourtStatus()", () => {
  beforeEach(resetData);

  it("returns 'available' when no bookings and no maintenance", () => {
    const court = db.courts.find((c) => c.court_id === 3); // court 3 has no active today booking
    const status = getCourtStatus(court);
    assert.equal(status, "available");
  });

  it("returns 'maintenance' when current time is inside the maintenance window", () => {
    const now = new Date();
    const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
    const end   = new Date(now.getTime() + 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
    const testCourt = { court_id: 99, court_number: 99, status: "available", maintenance_start: start, maintenance_end: end };
    const status = getCourtStatus(testCourt);
    assert.equal(status, "maintenance");
  });
});