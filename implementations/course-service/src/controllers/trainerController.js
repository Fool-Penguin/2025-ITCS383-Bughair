const pool = require('../config/db');

const T = (t) => `course_svc."${t}"`;

// ─── ADMIN: Add Trainer ───────────────────────────────────────────────────────
const createTrainer = async (req, res) => {
  try {
    const { name, expertise, bio, phone, email } = req.body;
    if (!name || !expertise) {
      return res.status(400).json({ success: false, message: 'Name and expertise are required' });
    }
    const r = await pool.query(
      `INSERT INTO ${T('Trainers')} (name, expertise, bio, phone, email)
       VALUES ($1,$2,$3,$4,$5) RETURNING "trainerID"`,
      [name, expertise, bio, phone, email]
    );
    res.status(201).json({ success: true, message: 'Trainer created', data: { trainerID: r.rows[0].trainerID } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Update Trainer ────────────────────────────────────────────────────
const updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, expertise, bio, phone, email, status } = req.body;
    const r = await pool.query(
      `UPDATE ${T('Trainers')}
         SET name=$1, expertise=$2, bio=$3, phone=$4, email=$5, status=$6, "updatedAt"=NOW()
       WHERE "trainerID"=$7`,
      [name, expertise, bio, phone, email, status || 'active', id]
    );
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Trainer not found' });
    res.json({ success: true, message: 'Trainer updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Delete Trainer ────────────────────────────────────────────────────
const deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(`DELETE FROM ${T('Trainers')} WHERE "trainerID" = $1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Trainer not found' });
    res.json({ success: true, message: 'Trainer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get All Trainers (req 5.8 filter by expertise) ──────────────────
const getAllTrainers = async (req, res) => {
  try {
    const { expertise } = req.query;
    let query = `SELECT * FROM ${T('Trainers')} WHERE status = 'active'`;
    const params = [];
    if (expertise) { params.push(`%${expertise}%`); query += ` AND expertise LIKE $${params.length}`; }
    query += ' ORDER BY name ASC';
    const trainersRes = await pool.query(query, params);
    const trainers = trainersRes.rows;

    const result = await Promise.all(trainers.map(async (t) => {
      const [availRes, statsRes] = await Promise.all([
        pool.query(`SELECT * FROM ${T('TrainerAvailability')} WHERE "trainerID" = $1`, [t.trainerID]),
        pool.query(
          `SELECT ROUND(AVG(rating)::numeric, 1) AS "avgRating", COUNT(*)::int AS "reviewCount"
           FROM ${T('TrainerReviews')} WHERE "trainerID" = $1 AND status = 'visible'`,
          [t.trainerID]
        ),
      ]);
      const stats = statsRes.rows[0];
      return {
        ...t,
        availability: availRes.rows,
        avgRating: stats.avgRating !== null ? Number(stats.avgRating) : 0,
        reviewCount: stats.reviewCount || 0,
      };
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Get All Trainers (including inactive) ────────────────────────────
const getAllTrainersAdmin = async (req, res) => {
  try {
    const { expertise } = req.query;
    let query = `SELECT * FROM ${T('Trainers')} WHERE 1=1`;
    const params = [];
    if (expertise) { params.push(`%${expertise}%`); query += ` AND expertise LIKE $${params.length}`; }
    query += ' ORDER BY name ASC';
    const trainersRes = await pool.query(query, params);
    const trainers = trainersRes.rows;

    const result = await Promise.all(trainers.map(async (t) => {
      const availRes = await pool.query(
        `SELECT * FROM ${T('TrainerAvailability')} WHERE "trainerID" = $1`,
        [t.trainerID]
      );
      return { ...t, availability: availRes.rows };
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get Trainer Profile ──────────────────────────────────────────────
const getTrainerById = async (req, res) => {
  try {
    const trainerRes = await pool.query(
      `SELECT * FROM ${T('Trainers')} WHERE "trainerID" = $1`,
      [req.params.id]
    );
    if (trainerRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const trainer = trainerRes.rows[0];

    const [availRes, statsRes] = await Promise.all([
      pool.query(`SELECT * FROM ${T('TrainerAvailability')} WHERE "trainerID" = $1`, [req.params.id]),
      pool.query(
        `SELECT ROUND(AVG(rating)::numeric, 1) AS "avgRating", COUNT(*)::int AS "reviewCount"
         FROM ${T('TrainerReviews')} WHERE "trainerID" = $1 AND status = 'visible'`,
        [req.params.id]
      ),
    ]);
    const stats = statsRes.rows[0];

    res.json({
      success: true,
      data: {
        ...trainer,
        availability: availRes.rows,
        avgRating: stats.avgRating !== null ? Number(stats.avgRating) : 0,
        reviewCount: stats.reviewCount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Book Private Training (req 7.8 conflict check) ──────────────────
const bookTrainer = async (req, res) => {
  try {
    const { trainerID, sessionDate, sessionTime, durationMinutes, notes } = req.body;
    const memberID = req.user.id;

    if (!trainerID || !sessionDate || !sessionTime) {
      return res.status(400).json({ success: false, message: 'trainerID, sessionDate, and sessionTime are required' });
    }

    const trainerRes = await pool.query(
      `SELECT 1 FROM ${T('Trainers')} WHERE "trainerID" = $1 AND status = 'active'`,
      [trainerID]
    );
    if (trainerRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Trainer not found or inactive' });

    const duration = durationMinutes || 60;

    // Trainer conflict (req 7.8)
    const trainerConflict = await pool.query(
      `SELECT "bookingID" FROM ${T('TrainerBookings')}
       WHERE "trainerID" = $1 AND "sessionDate" = $2 AND status != 'cancelled'
         AND ABS(EXTRACT(EPOCH FROM (("sessionDate"||' '||"sessionTime")::timestamp - ($3||' '||$4)::timestamp)) / 60) < $5`,
      [trainerID, sessionDate, sessionDate, sessionTime, duration]
    );
    if (trainerConflict.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Trainer is not available at this time' });
    }

    // Member conflict
    const memberConflict = await pool.query(
      `SELECT "bookingID" FROM ${T('TrainerBookings')}
       WHERE "memberID" = $1 AND "sessionDate" = $2 AND status != 'cancelled'
         AND ABS(EXTRACT(EPOCH FROM (("sessionDate"||' '||"sessionTime")::timestamp - ($3||' '||$4)::timestamp)) / 60) < $5`,
      [memberID, sessionDate, sessionDate, sessionTime, duration]
    );
    if (memberConflict.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'You already have a booking at this time' });
    }

    const r = await pool.query(
      `INSERT INTO ${T('TrainerBookings')}
         ("trainerID","memberID","sessionDate","sessionTime","durationMinutes","notes")
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING "bookingID"`,
      [trainerID, memberID, sessionDate, sessionTime, duration, notes]
    );

    res.status(201).json({ success: true, message: 'Booking created', data: { bookingID: r.rows[0].bookingID } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: My Bookings ──────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT tb.*, t.name AS "trainerName", t.expertise
       FROM ${T('TrainerBookings')} tb
       JOIN ${T('Trainers')} t ON tb."trainerID" = t."trainerID"
       WHERE tb."memberID" = $1
       ORDER BY tb."sessionDate" DESC, tb."sessionTime" DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Update Trainer Schedule ──────────────────────────────────────────
const updateTrainerSchedule = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { availability } = req.body;

    await client.query('BEGIN');
    await client.query(`DELETE FROM ${T('TrainerAvailability')} WHERE "trainerID" = $1`, [id]);
    if (availability && availability.length > 0) {
      for (const slot of availability) {
        await client.query(
          `INSERT INTO ${T('TrainerAvailability')} ("trainerID", "dayOfWeek", "startTime", "endTime")
           VALUES ($1,$2,$3,$4)`,
          [id, slot.dayOfWeek, slot.startTime, slot.endTime]
        );
      }
    }
    await client.query('COMMIT');

    res.json({ success: true, message: 'Schedule updated' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  createTrainer, updateTrainer, deleteTrainer,
  getAllTrainers, getAllTrainersAdmin, getTrainerById,
  bookTrainer, getMyBookings, updateTrainerSchedule
};
