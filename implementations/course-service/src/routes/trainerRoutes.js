const express = require('express');
const router  = express.Router();
const {
  createTrainer, updateTrainer, deleteTrainer,
  getAllTrainers, getAllTrainersAdmin, getTrainerById,
  bookTrainer, getMyBookings, completeMyBooking
} = require('../controllers/trainerController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── Public (Customer) — active trainers only ──────────────
// NOTE: static paths MUST come before /:id
router.get('/my/bookings',  authenticate, getMyBookings);
router.get('/admin/all',    authenticate, requireAdmin, getAllTrainersAdmin);
router.patch('/bookings/:bookingId/complete', authenticate, completeMyBooking);

// ── Member ────────────────────────────────────────────────
router.post('/book', authenticate, bookTrainer);

// ── Admin ─────────────────────────────────────────────────
router.post('/',     authenticate, requireAdmin, createTrainer);
router.put('/:id',   authenticate, requireAdmin, updateTrainer);
router.delete('/:id',authenticate, requireAdmin, deleteTrainer);

// ── Public (single trainer) — keep AFTER static routes ────
router.get('/',    getAllTrainers);       // GET /api/trainers
router.get('/:id', getTrainerById);      // GET /api/trainers/:id

module.exports = router;
