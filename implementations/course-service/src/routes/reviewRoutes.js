const express = require('express');
const router  = express.Router();
const {
  submitReview, getTrainerReviews, getAllReviewsAdmin,
  deleteReview, flagReview, getMyReview
} = require('../controllers/reviewController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── Public — get reviews for a trainer ────────────────────
router.get('/:id/reviews', getTrainerReviews);

// ── Member — submit/update review (must be authenticated) ─
router.post('/:id/reviews', authenticate, submitReview);

// ── Member — check own review for a trainer ───────────────
router.get('/:id/my-review', authenticate, getMyReview);

// ── Admin — get all reviews including hidden/flagged ──────
router.get('/:id/reviews/admin', authenticate, requireAdmin, getAllReviewsAdmin);

// ── Admin — moderate reviews ──────────────────────────────
router.delete('/reviews/:reviewId', authenticate, requireAdmin, deleteReview);
router.patch('/reviews/:reviewId/flag', authenticate, requireAdmin, flagReview);

module.exports = router;
