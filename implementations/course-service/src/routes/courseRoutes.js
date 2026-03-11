const express = require('express');
const router  = express.Router();
const {
  createCourse, updateCourse, deleteCourse, publishCourse,
  cancelCourse, undoCancelCourse,
  getAllCourses, getAllCoursesAdmin, getCourseById,
  enrollCourse, cancelEnrollment, getMyEnrollments, getCourseAttendance
} = require('../controllers/courseController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── Public (Customer) ─────────────────────────────────────
router.get('/',     getAllCourses);   // GET /api/courses

// ── Member (authenticated) ────────────────────────────────
// NOTE: static paths (/enroll, /my/enrollments) MUST come before /:id
router.post('/enroll',         authenticate, enrollCourse);
router.post('/enroll/cancel',  authenticate, cancelEnrollment);
router.get('/my/enrollments',  authenticate, getMyEnrollments);

// ── Admin ─────────────────────────────────────────────────
router.get('/admin/all',          authenticate, requireAdmin, getAllCoursesAdmin);
router.post('/',                  authenticate, requireAdmin, createCourse);
router.put('/:id',                authenticate, requireAdmin, updateCourse);
router.delete('/:id',             authenticate, requireAdmin, deleteCourse);
router.patch('/:id/publish',      authenticate, requireAdmin, publishCourse);
router.patch('/:id/cancel',       authenticate, requireAdmin, cancelCourse);
router.patch('/:id/undo-cancel',  authenticate, requireAdmin, undoCancelCourse);
router.get('/:id/attendance',     authenticate, requireAdmin, getCourseAttendance);

// ── Public (single course) — keep AFTER static routes ─────
router.get('/:id', getCourseById);   // GET /api/courses/:id

module.exports = router;
