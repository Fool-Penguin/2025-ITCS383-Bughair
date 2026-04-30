// Schema lives in Supabase and is applied by _migration/apply-schema.js.
// This module only seeds sample rows on first run, idempotently.
const pool = require('./db');

const T = (t) => `course_svc."${t}"`;

async function initSchema() {
  const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${T('Trainers')}`);
  if (count > 0) {
    console.log('Database ready (seed already present)');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const trainers = [
      ['Alex Johnson', 'Yoga, Pilates', 'Certified yoga instructor with 8 years experience', '081-000-0001', 'alex@gym.com'],
      ['Maria Santos', 'CrossFit, Strength Training', 'CrossFit Level 2 coach, former athlete', '081-000-0002', 'maria@gym.com'],
      ['Tom Chen',     'Badminton, Cardio', 'Professional badminton trainer', '081-000-0003', 'tom@gym.com'],
    ];
    const trainerIds = [];
    for (const t of trainers) {
      const r = await client.query(
        `INSERT INTO ${T('Trainers')} (name, expertise, bio, phone, email)
         VALUES ($1,$2,$3,$4,$5) RETURNING "trainerID"`, t
      );
      trainerIds.push(r.rows[0].trainerID);
    }

    const availability = [
      [trainerIds[0], 'Monday',    '08:00', '17:00'],
      [trainerIds[0], 'Wednesday', '08:00', '17:00'],
      [trainerIds[0], 'Friday',    '08:00', '17:00'],
      [trainerIds[1], 'Tuesday',   '09:00', '18:00'],
      [trainerIds[1], 'Thursday',  '09:00', '18:00'],
      [trainerIds[1], 'Saturday',  '09:00', '14:00'],
      [trainerIds[2], 'Monday',    '10:00', '19:00'],
      [trainerIds[2], 'Wednesday', '10:00', '19:00'],
      [trainerIds[2], 'Saturday',  '08:00', '16:00'],
    ];
    for (const a of availability) {
      await client.query(
        `INSERT INTO ${T('TrainerAvailability')} ("trainerID", "dayOfWeek", "startTime", "endTime")
         VALUES ($1,$2,$3,$4)`, a
      );
    }

    const courses = [
      ['Morning Yoga Flow', 'Energizing morning yoga for all levels',  '2026-04-05 07:00:00', 'Alex Johnson', 15, 'Yoga',      'beginner'],
      ['CrossFit HIIT',     'High-intensity interval training',         '2026-04-06 18:00:00', 'Maria Santos', 12, 'CrossFit',  'advanced'],
      ['Badminton Basics',  'Learn fundamental badminton techniques',   '2026-04-07 10:00:00', 'Tom Chen',     10, 'Badminton', 'beginner'],
    ];
    for (const c of courses) {
      await client.query(
        `INSERT INTO ${T('Courses')}
           ("courseName","description","schedule","instructor","maxAttendees","courseType","fitnessLevel","status")
         VALUES ($1,$2,$3,$4,$5,$6,$7,'published')`, c
      );
    }

    const bookings = [
      [trainerIds[0], 1, '2026-04-01', '09:00', 60, 'completed', 'Great yoga session'],
      [trainerIds[1], 1, '2026-04-02', '14:00', 90, 'completed', 'CrossFit intro'],
      [trainerIds[2], 1, '2026-04-03', '10:00', 60, 'completed', 'Badminton practice'],
      [trainerIds[0], 1, '2026-04-10', '09:00', 60, 'completed', 'Follow-up yoga'],
      [trainerIds[1], 1, '2026-04-12', '15:00', 90, 'completed', 'Strength training'],
    ];
    const bookingIds = [];
    for (const b of bookings) {
      const r = await client.query(
        `INSERT INTO ${T('TrainerBookings')}
           ("trainerID","memberID","sessionDate","sessionTime","durationMinutes","status","notes")
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "bookingID"`, b
      );
      bookingIds.push(r.rows[0].bookingID);
    }

    await client.query(
      `INSERT INTO ${T('TrainerReviews')} ("trainerID","memberID","bookingID","rating","comment")
       VALUES ($1,$2,$3,$4,$5)`,
      [trainerIds[0], 1, bookingIds[0], 5, 'Alex is an amazing yoga instructor! Very patient and encouraging.']
    );
    await client.query(
      `INSERT INTO ${T('TrainerReviews')} ("trainerID","memberID","bookingID","rating","comment")
       VALUES ($1,$2,$3,$4,$5)`,
      [trainerIds[1], 1, bookingIds[1], 4, 'Intense CrossFit session, Maria pushes you to your limits. Loved it!']
    );

    await client.query('COMMIT');
    console.log('Database initialized (Postgres / Supabase, course_svc)');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = initSchema;
