const db = require('../config/db');

function getTrainerStats(trainerID) {
  const stmt = db.prepare(`
    SELECT
      ROUND(COALESCE(AVG(r.rating), 0), 1) AS averageRating,
      COUNT(r.reviewID) AS reviewCount
    FROM TrainerReviews r
    WHERE r.trainerID = ? AND r.status = 'approved'
  `);
  if (stmt && typeof stmt.get === 'function') return stmt.get(trainerID);
  return { averageRating: 0, reviewCount: 0 };
}

function getTrainerReviews(trainerID) {
  const stmt = db.prepare(`
    SELECT reviewID, bookingID, memberID, rating, reviewText, status, createdAt, updatedAt
    FROM TrainerReviews
    WHERE trainerID = ? AND status = 'approved'
    ORDER BY createdAt DESC
  `);
  if (stmt && typeof stmt.all === 'function') return stmt.all(trainerID);
  return [];
}

function attachTrainerMeta(trainer) {
  if (!trainer) {
    return null;
  }

  const stats = getTrainerStats(trainer.trainerID);
  return {
    ...trainer,
    averageRating: Number(stats?.averageRating || 0),
    reviewCount: Number(stats?.reviewCount || 0),
  };
}

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

    // Attach availability to each trainer
    const avail = db.prepare('SELECT * FROM TrainerAvailability WHERE trainerID = ?');
    const result = trainers.map(t => ({
      ...attachTrainerMeta(t),
      availability: avail.all(t.trainerID),
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Get All Trainers ─────────────────────────────────────────────────
const getAllTrainersAdmin = (req, res) => {
  try {
    const trainers = db.prepare('SELECT * FROM Trainers ORDER BY name ASC').all();
    const avail = db.prepare('SELECT * FROM TrainerAvailability WHERE trainerID = ?');
    const result = trainers.map((trainer) => ({
      ...attachTrainerMeta(trainer),
      availability: avail.all(trainer.trainerID),
    }));
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
    res.json({
      success: true,
      data: {
        ...attachTrainerMeta(trainer),
        availability,
        reviews: getTrainerReviews(req.params.id),
      },
    });
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
    const { status } = req.query;
    const rows = db.prepare(`
      SELECT tb.*, t.name AS trainerName, t.expertise
      FROM TrainerBookings tb
      JOIN Trainers t ON tb.trainerID = t.trainerID
      WHERE tb.memberID = ?
      ${status ? ' AND tb.status = ?' : ''}
      ORDER BY tb.sessionDate DESC, tb.sessionTime DESC
    `).all(...(status ? [req.user.id, status] : [req.user.id]));
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Mark Booking Completed ───────────────────────────────────────────
const completeTrainerBooking = (req, res) => {
  try {
    const { bookingID } = req.params;
    const booking = db.prepare('SELECT * FROM TrainerBookings WHERE bookingID = ?').get(bookingID);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    db.prepare("UPDATE TrainerBookings SET status = 'completed' WHERE bookingID = ?").run(bookingID);
    res.json({ success: true, message: 'Booking marked as completed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Submit Trainer Review ──────────────────────────────────────────
const submitTrainerReview = (req, res) => {
  try {
    const { id: trainerID } = req.params;
    const { bookingID, rating, reviewText } = req.body;

    if (!bookingID || !rating) {
      return res.status(400).json({ success: false, message: 'bookingID and rating are required' });
    }

    const booking = db.prepare(`
      SELECT * FROM TrainerBookings
      WHERE bookingID = ? AND trainerID = ? AND memberID = ? AND status = 'completed'
    `).get(bookingID, trainerID, req.user.id);

    if (!booking) {
      return res.status(403).json({ success: false, message: 'Only completed bookings can be reviewed' });
    }

    const existing = db.prepare('SELECT reviewID FROM TrainerReviews WHERE bookingID = ?').get(bookingID);
    if (existing) {
      return res.status(409).json({ success: false, message: 'A review already exists for this booking' });
    }

    const result = db.prepare(`
      INSERT INTO TrainerReviews (trainerID, bookingID, memberID, rating, reviewText)
      VALUES (?, ?, ?, ?, ?)
    `).run(trainerID, bookingID, req.user.id, rating, reviewText || null);

    res.status(201).json({ success: true, message: 'Review submitted', data: { reviewID: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get Trainer Reviews ────────────────────────────────────────────
const getTrainerReviewList = (req, res) => {
  try {
    const rows = getTrainerReviews(req.params.id);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Moderate Review ─────────────────────────────────────────────────
const moderateTrainerReview = (req, res) => {
  try {
    const { reviewID } = req.params;
    const { status } = req.body;

    if (!['approved', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or hidden' });
    }

    const review = db.prepare('SELECT * FROM TrainerReviews WHERE reviewID = ?').get(reviewID);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    db.prepare("UPDATE TrainerReviews SET status = ?, updatedAt = datetime('now') WHERE reviewID = ?").run(status, reviewID);
    res.json({ success: true, message: 'Review updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Delete Review ────────────────────────────────────────────────────
const deleteTrainerReview = (req, res) => {
  try {
    const { reviewID } = req.params;
    const review = db.prepare('SELECT * FROM TrainerReviews WHERE reviewID = ?').get(reviewID);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    db.prepare('DELETE FROM TrainerReviews WHERE reviewID = ?').run(reviewID);
    res.json({ success: true, message: 'Review deleted' });
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
  bookTrainer, getMyBookings, completeTrainerBooking,
  submitTrainerReview, getTrainerReviewList, moderateTrainerReview,
  deleteTrainerReview, updateTrainerSchedule
};
