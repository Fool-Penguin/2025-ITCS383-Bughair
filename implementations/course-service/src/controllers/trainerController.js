const db = require('../config/db');

// ─── ADMIN: Add Trainer ───────────────────────────────────────────────────────
const createTrainer = (req, res) => {
  try {
    const { name, expertise, bio, phone, email } = req.body;
    if (!name || !expertise) {
      return res.status(400).json({ success: false, message: 'Name and expertise are required' });
    }
    const result = db.prepare(
      'INSERT INTO Trainers (name, expertise, bio, phone, email) VALUES (?, ?, ?, ?, ?)'
    ).run(name, expertise, bio, phone, email);
    res.status(201).json({ success: true, message: 'Trainer created', data: { trainerID: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Update Trainer ────────────────────────────────────────────────────
const updateTrainer = (req, res) => {
  try {
    const { id } = req.params;
    const { name, expertise, bio, phone, email, status } = req.body;
    const trainer = db.prepare('SELECT * FROM Trainers WHERE trainerID = ?').get(id);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    db.prepare(
      "UPDATE Trainers SET name=?, expertise=?, bio=?, phone=?, email=?, status=?, updatedAt=datetime('now') WHERE trainerID=?"
    ).run(name, expertise, bio, phone, email, status || 'active', id);
    res.json({ success: true, message: 'Trainer updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Delete Trainer ────────────────────────────────────────────────────
const deleteTrainer = (req, res) => {
  try {
    const { id } = req.params;
    const trainer = db.prepare('SELECT * FROM Trainers WHERE trainerID = ?').get(id);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    db.prepare('DELETE FROM Trainers WHERE trainerID = ?').run(id);
    res.json({ success: true, message: 'Trainer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get All Trainers (req 5.8 filter by expertise) ──────────────────
const getAllTrainers = (req, res) => {
  try {
    const { expertise } = req.query;
    let query = "SELECT * FROM Trainers WHERE status = 'active'";
    const params = [];
    if (expertise) { query += ' AND expertise LIKE ?'; params.push(`%${expertise}%`); }
    query += ' ORDER BY name ASC';
    const trainers = db.prepare(query).all(...params);

    // Attach availability and average rating to each trainer
    const avail = db.prepare('SELECT * FROM TrainerAvailability WHERE trainerID = ?');
    const ratingQuery = db.prepare(`
      SELECT ROUND(AVG(rating), 1) as avgRating, COUNT(*) as reviewCount 
      FROM TrainerReviews WHERE trainerID = ? AND status = 'visible'
    `);
    const result = trainers.map(t => {
      const stats = ratingQuery.get(t.trainerID);
      return { 
        ...t, 
        availability: avail.all(t.trainerID),
        avgRating: stats.avgRating || 0,
        reviewCount: stats.reviewCount || 0
      };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Get All Trainers (including inactive) ────────────────────────────
const getAllTrainersAdmin = (req, res) => {
  try {
    const { expertise } = req.query;
    let query = 'SELECT * FROM Trainers WHERE 1=1';
    const params = [];
    if (expertise) { query += ' AND expertise LIKE ?'; params.push(`%${expertise}%`); }
    query += ' ORDER BY name ASC';
    const trainers = db.prepare(query).all(...params);

    const avail = db.prepare('SELECT * FROM TrainerAvailability WHERE trainerID = ?');
    const result = trainers.map(t => ({ ...t, availability: avail.all(t.trainerID) }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get Trainer Profile ──────────────────────────────────────────────
const getTrainerById = (req, res) => {
  try {
    const trainer = db.prepare('SELECT * FROM Trainers WHERE trainerID = ?').get(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const availability = db.prepare('SELECT * FROM TrainerAvailability WHERE trainerID = ?').all(req.params.id);
    const stats = db.prepare(`
      SELECT ROUND(AVG(rating), 1) as avgRating, COUNT(*) as reviewCount 
      FROM TrainerReviews WHERE trainerID = ? AND status = 'visible'
    `).get(req.params.id);
    res.json({ success: true, data: { 
      ...trainer, 
      availability,
      avgRating: stats.avgRating || 0,
      reviewCount: stats.reviewCount || 0
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Book Private Training (req 7.8 conflict check) ──────────────────
const bookTrainer = (req, res) => {
  try {
    const { trainerID, sessionDate, sessionTime, durationMinutes, notes } = req.body;
    const memberID = req.user.id;

    if (!trainerID || !sessionDate || !sessionTime) {
      return res.status(400).json({ success: false, message: 'trainerID, sessionDate, and sessionTime are required' });
    }

    const trainer = db.prepare("SELECT * FROM Trainers WHERE trainerID = ? AND status = 'active'").get(trainerID);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found or inactive' });

    const duration = durationMinutes || 60;

    // Trainer conflict (req 7.8)
    const trainerConflict = db.prepare(`
      SELECT bookingID FROM TrainerBookings
      WHERE trainerID = ? AND sessionDate = ? AND status != 'cancelled'
        AND ABS((strftime('%s', sessionDate||' '||sessionTime) - strftime('%s', ?||' '||?)) / 60) < ?
    `).get(trainerID, sessionDate, sessionDate, sessionTime, duration);
    if (trainerConflict) {
      return res.status(409).json({ success: false, message: 'Trainer is not available at this time' });
    }

    // Member conflict
    const memberConflict = db.prepare(`
      SELECT bookingID FROM TrainerBookings
      WHERE memberID = ? AND sessionDate = ? AND status != 'cancelled'
        AND ABS((strftime('%s', sessionDate||' '||sessionTime) - strftime('%s', ?||' '||?)) / 60) < ?
    `).get(memberID, sessionDate, sessionDate, sessionTime, duration);
    if (memberConflict) {
      return res.status(409).json({ success: false, message: 'You already have a booking at this time' });
    }

    const result = db.prepare(
      'INSERT INTO TrainerBookings (trainerID, memberID, sessionDate, sessionTime, durationMinutes, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(trainerID, memberID, sessionDate, sessionTime, duration, notes);

    res.status(201).json({ success: true, message: 'Booking created', data: { bookingID: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: My Bookings ──────────────────────────────────────────────────────
const getMyBookings = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT tb.*, t.name AS trainerName, t.expertise
      FROM TrainerBookings tb
      JOIN Trainers t ON tb.trainerID = t.trainerID
      WHERE tb.memberID = ?
      ORDER BY tb.sessionDate DESC, tb.sessionTime DESC
    `).all(req.user.id);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Update Trainer Schedule ──────────────────────────────────────────
const updateTrainerSchedule = (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    const update = db.transaction(() => {
      db.prepare('DELETE FROM TrainerAvailability WHERE trainerID = ?').run(id);
      if (availability && availability.length > 0) {
        const ins = db.prepare(
          'INSERT INTO TrainerAvailability (trainerID, dayOfWeek, startTime, endTime) VALUES (?, ?, ?, ?)'
        );
        for (const slot of availability) {
          ins.run(id, slot.dayOfWeek, slot.startTime, slot.endTime);
        }
      }
    });
    update();

    res.json({ success: true, message: 'Schedule updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  createTrainer, updateTrainer, deleteTrainer,
  getAllTrainers, getAllTrainersAdmin, getTrainerById,
  bookTrainer, getMyBookings, updateTrainerSchedule
};
