const pool = require('../config/db');

const T = (t) => `course_svc."${t}"`;

// ─── MEMBER: Submit Review ───────────────────────────────────────────────────
const submitReview = async (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);
    const memberID = req.user.id;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating is required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const trainer = await pool.query(
      `SELECT 1 FROM ${T('Trainers')} WHERE "trainerID" = $1`,
      [trainerID]
    );
    if (trainer.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const existing = await pool.query(
      `SELECT "reviewID" FROM ${T('TrainerReviews')} WHERE "memberID" = $1 AND "trainerID" = $2`,
      [memberID, trainerID]
    );

    if (existing.rowCount > 0) {
      const reviewID = existing.rows[0].reviewID;
      await pool.query(
        `UPDATE ${T('TrainerReviews')}
           SET rating = $1, comment = $2, "createdAt" = NOW(), status = 'visible'
         WHERE "reviewID" = $3`,
        [rating, comment || null, reviewID]
      );
      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: { reviewID },
      });
    }

    const r = await pool.query(
      `INSERT INTO ${T('TrainerReviews')} ("trainerID","memberID","rating","comment")
       VALUES ($1,$2,$3,$4) RETURNING "reviewID"`,
      [trainerID, memberID, rating, comment || null]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { reviewID: r.rows[0].reviewID },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'You have already reviewed this trainer' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get Trainer Reviews ─────────────────────────────────────────────
const getTrainerReviews = async (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);

    const reviewsRes = await pool.query(
      `SELECT r."reviewID", r.rating, r.comment, r."createdAt", r.status,
              r."memberID", r."bookingID"
       FROM ${T('TrainerReviews')} r
       WHERE r."trainerID" = $1 AND r.status = 'visible'
       ORDER BY r."createdAt" DESC`,
      [trainerID]
    );

    const statsRes = await pool.query(
      `SELECT COUNT(*)::int AS "totalReviews",
              ROUND(AVG(rating)::numeric, 1) AS "averageRating"
       FROM ${T('TrainerReviews')} WHERE "trainerID" = $1 AND status = 'visible'`,
      [trainerID]
    );

    const distRes = await pool.query(
      `SELECT rating, COUNT(*)::int AS count
       FROM ${T('TrainerReviews')} WHERE "trainerID" = $1 AND status = 'visible'
       GROUP BY rating ORDER BY rating DESC`,
      [trainerID]
    );

    const stats = statsRes.rows[0];
    res.json({
      success: true,
      data: {
        reviews: reviewsRes.rows,
        averageRating: stats.averageRating !== null ? Number(stats.averageRating) : 0,
        totalReviews: stats.totalReviews || 0,
        distribution: distRes.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Get All Reviews (includes hidden/flagged) ────────────────────────
const getAllReviewsAdmin = async (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);
    const r = await pool.query(
      `SELECT r."reviewID", r.rating, r.comment, r."createdAt", r.status,
              r."memberID", r."bookingID", r."trainerID"
       FROM ${T('TrainerReviews')} r
       WHERE r."trainerID" = $1
       ORDER BY r."createdAt" DESC`,
      [trainerID]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Delete Review (soft delete — set status to hidden) ───────────────
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const r = await pool.query(
      `UPDATE ${T('TrainerReviews')} SET status = 'hidden' WHERE "reviewID" = $1`,
      [reviewId]
    );
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review hidden successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Flag Review ──────────────────────────────────────────────────────
const flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const r = await pool.query(
      `UPDATE ${T('TrainerReviews')} SET status = 'flagged' WHERE "reviewID" = $1`,
      [reviewId]
    );
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review flagged for moderation' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Check if already reviewed ───────────────────────────────────────
const getMyReview = async (req, res) => {
  try {
    const trainerID = parseInt(req.params.id);
    const memberID = req.user.id;

    const r = await pool.query(
      `SELECT * FROM ${T('TrainerReviews')} WHERE "memberID" = $1 AND "trainerID" = $2`,
      [memberID, trainerID]
    );
    res.json({ success: true, data: r.rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  submitReview, getTrainerReviews, getAllReviewsAdmin,
  deleteReview, flagReview, getMyReview
};
