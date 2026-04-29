const db = require('../config/db');

// ─── MEMBER: Submit Review ───────────────────────────────────────────────────
const submitReview = (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);
    const memberID = req.user.id;
    const { rating, comment } = req.body;

    // Validate inputs
    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating is required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Verify the trainer exists
    const trainer = db.prepare('SELECT trainerID FROM Trainers WHERE trainerID = ?').get(trainerID);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Check if user already reviewed this trainer
    const existing = db.prepare(
      'SELECT reviewID FROM TrainerReviews WHERE memberID = ? AND trainerID = ?'
    ).get(memberID, trainerID);

    if (existing) {
      // Update existing review instead of failing
      db.prepare(
        'UPDATE TrainerReviews SET rating = ?, comment = ?, createdAt = datetime(\'now\'), status = \'visible\' WHERE reviewID = ?'
      ).run(rating, comment || null, existing.reviewID);

      return res.json({ 
        success: true, 
        message: 'Review updated successfully', 
        data: { reviewID: existing.reviewID } 
      });
    }

    // Insert new review
    const result = db.prepare(
      'INSERT INTO TrainerReviews (trainerID, memberID, rating, comment) VALUES (?, ?, ?, ?)'
    ).run(trainerID, memberID, rating, comment || null);

    res.status(201).json({ 
      success: true, 
      message: 'Review submitted successfully', 
      data: { reviewID: result.lastInsertRowid } 
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this trainer' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get Trainer Reviews ─────────────────────────────────────────────
const getTrainerReviews = (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);

    // Get reviews (only visible ones for public)
    const reviews = db.prepare(`
      SELECT r.reviewID, r.rating, r.comment, r.createdAt, r.status,
             r.memberID, r.bookingID
      FROM TrainerReviews r
      WHERE r.trainerID = ? AND r.status = 'visible'
      ORDER BY r.createdAt DESC
    `).all(trainerID);

    // Calculate average
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalReviews,
        ROUND(AVG(rating), 1) as averageRating
      FROM TrainerReviews 
      WHERE trainerID = ? AND status = 'visible'
    `).get(trainerID);

    // Get rating distribution
    const distribution = db.prepare(`
      SELECT rating, COUNT(*) as count
      FROM TrainerReviews 
      WHERE trainerID = ? AND status = 'visible'
      GROUP BY rating
      ORDER BY rating DESC
    `).all(trainerID);

    res.json({ 
      success: true, 
      data: {
        reviews,
        averageRating: stats.averageRating || 0,
        totalReviews: stats.totalReviews || 0,
        distribution
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Get All Reviews (includes hidden/flagged) ────────────────────────
const getAllReviewsAdmin = (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);

    const reviews = db.prepare(`
      SELECT r.reviewID, r.rating, r.comment, r.createdAt, r.status,
             r.memberID, r.bookingID, r.trainerID
      FROM TrainerReviews r
      WHERE r.trainerID = ?
      ORDER BY r.createdAt DESC
    `).all(trainerID);

    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Delete Review (soft delete — set status to hidden) ───────────────
const deleteReview = (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = db.prepare('SELECT * FROM TrainerReviews WHERE reviewID = ?').get(reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    db.prepare("UPDATE TrainerReviews SET status = 'hidden' WHERE reviewID = ?").run(reviewId);
    res.json({ success: true, message: 'Review hidden successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Flag Review ──────────────────────────────────────────────────────
const flagReview = (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = db.prepare('SELECT * FROM TrainerReviews WHERE reviewID = ?').get(reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    db.prepare("UPDATE TrainerReviews SET status = 'flagged' WHERE reviewID = ?").run(reviewId);
    res.json({ success: true, message: 'Review flagged for moderation' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Check if already reviewed ───────────────────────────────────────
const getMyReview = (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);
    const memberID = req.user.id;

    const review = db.prepare(
      'SELECT * FROM TrainerReviews WHERE memberID = ? AND trainerID = ?'
    ).get(memberID, trainerID);

    res.json({ success: true, data: review || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  submitReview, getTrainerReviews, getAllReviewsAdmin,
  deleteReview, flagReview, getMyReview
};
