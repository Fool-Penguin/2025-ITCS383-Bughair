// Unit tests for the reservation conflict checker helpers.
// These tests use the in-memory data store through database.js test mode.

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';

const db = require('../db/data');
const {
  doubleBooking,
  slotConflict,
  slotInMaintenance,
  getCourtStatus,
  calcDuration,
} = require('../helpers');

const ORIGINAL_RESERVATIONS = JSON.parse(JSON.stringify(db.courtReservations));
const ORIGINAL_COURTS = JSON.parse(JSON.stringify(db.courts));

function resetData() {
  db.courtReservations.length = 0;
  ORIGINAL_RESERVATIONS.forEach((reservation) => db.courtReservations.push({ ...reservation }));
  db.courts.length = 0;
  ORIGINAL_COURTS.forEach((court) => db.courts.push({ ...court }));
}

describe('doubleBooking()', () => {
  beforeEach(resetData);

  it('returns true when court, date, and slot already have an active booking', async () => {
    const reservation = db.courtReservations.find((item) => item.reservation_id === 'RES-001');
    const result = await doubleBooking(reservation.court_id, reservation.date, reservation.time_slot);
    assert.equal(result, true);
  });

  it('returns false when the slot is free on that court', async () => {
    const result = await doubleBooking(2, '2026-03-10', '09:00-10:00');
    assert.equal(result, false);
  });

  it('returns false when the same slot is booked on a different court', async () => {
    const reservation = db.courtReservations.find((item) => item.reservation_id === 'RES-001');
    const result = await doubleBooking(3, reservation.date, reservation.time_slot);
    assert.equal(result, false);
  });

  it('returns false for cancelled reservations', async () => {
    const reservation = db.courtReservations.find((item) => item.reservation_id === 'RES-005');
    const result = await doubleBooking(reservation.court_id, reservation.date, reservation.time_slot);
    assert.equal(result, false);
  });
});

describe('slotConflict()', () => {
  beforeEach(resetData);

  it('returns true when a member already has an active booking at that date and slot', async () => {
    const reservation = db.courtReservations.find((item) => item.reservation_id === 'RES-001');
    const result = await slotConflict(reservation.member_id, reservation.date, reservation.time_slot);
    assert.equal(result, true);
  });

  it('returns false when the member has no booking at that slot', async () => {
    const result = await slotConflict('M001', '2026-03-10', '08:00-09:00');
    assert.equal(result, false);
  });

  it('returns false when another member owns that slot', async () => {
    const reservation = db.courtReservations.find((item) => item.reservation_id === 'RES-002');
    const result = await slotConflict('M001', reservation.date, reservation.time_slot);
    assert.equal(result, false);
  });

  it('returns false for cancelled reservations', async () => {
    const reservation = db.courtReservations.find((item) => item.reservation_id === 'RES-005');
    const result = await slotConflict(reservation.member_id, reservation.date, reservation.time_slot);
    assert.equal(result, false);
  });
});

describe('slotInMaintenance()', () => {
  beforeEach(resetData);

  it('returns false when court has no maintenance scheduled', async () => {
    const result = await slotInMaintenance(1, '2026-03-10', '10:00-11:00');
    assert.equal(result, false);
  });

  it('returns true when slot falls inside maintenance window', async () => {
    db.courts[0].maintenance_start = '2026-03-10 09:00:00';
    db.courts[0].maintenance_end = '2026-03-10 12:00:00';
    const result = await slotInMaintenance(1, '2026-03-10', '10:00-11:00');
    assert.equal(result, true);
  });

  it('returns false when slot is before the maintenance window', async () => {
    db.courts[0].maintenance_start = '2026-03-10 14:00:00';
    db.courts[0].maintenance_end = '2026-03-10 17:00:00';
    const result = await slotInMaintenance(1, '2026-03-10', '10:00-11:00');
    assert.equal(result, false);
  });

  it('returns false when slot is after the maintenance window', async () => {
    db.courts[0].maintenance_start = '2026-03-10 07:00:00';
    db.courts[0].maintenance_end = '2026-03-10 09:00:00';
    const result = await slotInMaintenance(1, '2026-03-10', '10:00-11:00');
    assert.equal(result, false);
  });
});

describe('calcDuration()', () => {
  it('returns null when exit_time is null', () => {
    assert.equal(calcDuration('2026-03-10T08:00:00', null), null);
  });

  it('returns minutes-only string for durations under 1 hour', () => {
    assert.equal(calcDuration('2026-03-10T08:00:00', '2026-03-10T08:45:00'), '45m');
  });

  it('returns hours and minutes string for durations over 1 hour', () => {
    assert.equal(calcDuration('2026-03-10T08:00:00', '2026-03-10T09:30:00'), '1h 30m');
  });
});

describe('getCourtStatus()', () => {
  beforeEach(resetData);

  it("returns 'available' when no booking or maintenance is active", async () => {
    const court = db.courts.find((item) => item.court_id === 3);
    const status = await getCourtStatus(court);
    assert.equal(status, 'available');
  });

  it("returns 'maintenance' when current time is inside maintenance window", async () => {
    const court = {
      court_id: 99,
      court_number: 99,
      status: 'available',
      maintenance_start: '2000-01-01 00:00:00',
      maintenance_end: '2999-12-31 23:59:59',
    };
    const status = await getCourtStatus(court);
    assert.equal(status, 'maintenance');
  });
});
