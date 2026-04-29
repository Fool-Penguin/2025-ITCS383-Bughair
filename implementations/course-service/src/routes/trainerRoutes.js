const express = require('express');
const router  = express.Router();
const {
  createTrainer, updateTrainer, deleteTrainer,
  getAllTrainers, getAllTrainersAdmin, getTrainerById,
  bookTrainer, getMyBookings, completeTrainerBooking,
  submitTrainerReview, getTrainerReviewList, moderateTrainerReview,
  deleteTrainerReview
} = require('../controllers/trainerController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── Public (Customer) — active trainers only ──────────────
// NOTE: static paths MUST come before /:id
router.get('/my/bookings',  authenticate, getMyBookings);
router.get('/admin/all',    authenticate, requireAdmin, getAllTrainersAdmin);

// ── Member ────────────────────────────────────────────────
router.post('/book', authenticate, bookTrainer);
router.patch('/bookings/:bookingID/complete', authenticate, requireAdmin, completeTrainerBooking);

// ── Reviews ───────────────────────────────────────────────
router.get('/:id/reviews', getTrainerReviewList);
router.post('/:id/reviews', authenticate, submitTrainerReview);
router.patch('/reviews/:reviewID/moderate', authenticate, requireAdmin, moderateTrainerReview);
router.delete('/reviews/:reviewID', authenticate, requireAdmin, deleteTrainerReview);

// ── Admin ─────────────────────────────────────────────────
router.post('/',     authenticate, requireAdmin, createTrainer);
router.put('/:id',   authenticate, requireAdmin, updateTrainer);
router.delete('/:id',authenticate, requireAdmin, deleteTrainer);

// ── Public (single trainer) — keep AFTER static routes ────
router.get('/',    getAllTrainers);       // GET /api/trainers
router.get('/:id', getTrainerById);      // GET /api/trainers/:id

module.exports = router;
