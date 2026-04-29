const db = require('../config/db');

// ─── ADMIN: Create Course ─────────────────────────────────────────────────────
const createCourse = (req, res) => {
  try {
    const { courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel } = req.body;
    if (!courseName || !schedule || !instructor || !maxAttendees || !courseType || !fitnessLevel) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const stmt = db.prepare(
      `INSERT INTO Courses (courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'unpublished')`
    );
    const result = stmt.run(courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel);
    res.status(201).json({ success: true, message: 'Course created', data: { courseID: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Update Course ─────────────────────────────────────────────────────
const updateCourse = (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel } = req.body;
    const course = db.prepare('SELECT * FROM Courses WHERE courseID = ?').get(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    db.prepare(
      `UPDATE Courses SET courseName=?, description=?, schedule=?, instructor=?,
       maxAttendees=?, courseType=?, fitnessLevel=?, updatedAt=datetime('now') WHERE courseID=?`
    ).run(courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel, id);

    res.json({ success: true, message: 'Course updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Delete Course ─────────────────────────────────────────────────────
const deleteCourse = (req, res) => {
  try {
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM Courses WHERE courseID = ?').get(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    db.prepare('DELETE FROM Courses WHERE courseID = ?').run(id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Publish / Unpublish ───────────────────────────────────────────────
const publishCourse = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['published', 'unpublished'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be published or unpublished' });
    }
    const course = db.prepare('SELECT * FROM Courses WHERE courseID = ?').get(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    db.prepare("UPDATE Courses SET status=?, updatedAt=datetime('now') WHERE courseID=?").run(status, id);
    res.json({ success: true, message: `Course ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Cancel Course (reason required — req 1.6.6) ──────────────────────
const cancelCourse = (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    if (!cancelReason || cancelReason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Cancel reason is required' });
    }
    const course = db.prepare('SELECT * FROM Courses WHERE courseID = ?').get(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    db.prepare("UPDATE Courses SET status='cancelled', cancelReason=?, updatedAt=datetime('now') WHERE courseID=?")
      .run(cancelReason, id);
    res.json({ success: true, message: 'Course cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Undo Cancel Course ───────────────────────────────────────────────
const undoCancelCourse = (req, res) => {
  try {
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM Courses WHERE courseID = ?').get(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    db.prepare("UPDATE Courses SET status='published', cancelReason=NULL, updatedAt=datetime('now') WHERE courseID=?").run(id);
    res.json({ success: true, message: 'Course restored' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get All Published Courses ───────────────────────────────────────
const getAllCourses = (req, res) => {
  try {
    const { fitnessLevel, courseType } = req.query;
    let query = "SELECT * FROM Courses WHERE status = 'published'";
    const params = [];
    if (fitnessLevel) { query += ' AND fitnessLevel = ?'; params.push(fitnessLevel); }
    if (courseType)   { query += ' AND courseType = ?';   params.push(courseType); }
    query += ' ORDER BY schedule ASC';
    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Get All Courses ──────────────────────────────────────────────────
const getAllCoursesAdmin = (req, res) => {
  try {
    const { fitnessLevel, courseType, status } = req.query;
    let query = 'SELECT * FROM Courses WHERE 1=1';
    const params = [];

    if (fitnessLevel) { query += ' AND fitnessLevel = ?'; params.push(fitnessLevel); }
    if (courseType) { query += ' AND courseType = ?'; params.push(courseType); }
    if (status) { query += ' AND status = ?'; params.push(status); }

    query += ' ORDER BY schedule ASC';
    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get Single Course ────────────────────────────────────────────────
const getCourseById = (req, res) => {
  try {
    const course = db.prepare('SELECT * FROM Courses WHERE courseID = ?').get(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Enroll in Course ─────────────────────────────────────────────────
// req 2.3.6 capacity check, req 2.4.6 schedule conflict check
const enrollCourse = (req, res) => {
  try {
    const { courseID } = req.body;
    const memberID = req.user.id;

    const course = db.prepare("SELECT * FROM Courses WHERE courseID = ? AND status = 'published'").get(courseID);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found or not available' });

    // Capacity check (req 2.3.6)
    if (course.currentAttendees >= course.maxAttendees) {
      return res.status(409).json({ success: false, message: 'Course is full' });
    }

    // Already enrolled?
    const existing = db.prepare(
      "SELECT * FROM CourseEnrollments WHERE courseID=? AND memberID=? AND attendanceStatus != 'cancelled'"
    ).get(courseID, memberID);
    if (existing) return res.status(409).json({ success: false, message: 'Already enrolled in this course' });

    // Schedule conflict (req 2.4.6) — within 60 min window
    const conflict = db.prepare(`
      SELECT ce.enrollmentID FROM CourseEnrollments ce
      JOIN Courses c ON ce.courseID = c.courseID
      WHERE ce.memberID = ? AND ce.attendanceStatus != 'cancelled'
        AND c.status = 'published'
        AND ABS((strftime('%s', c.schedule) - strftime('%s', ?)) / 60) < 60
    `).get(memberID, course.schedule);
    if (conflict) {
      return res.status(409).json({ success: false, message: 'Schedule conflict: you have another course at this time' });
    }

    // Enroll using transaction
    const enroll = db.transaction(() => {
      db.prepare('INSERT INTO CourseEnrollments (courseID, memberID) VALUES (?, ?)').run(courseID, memberID);
      db.prepare('UPDATE Courses SET currentAttendees = currentAttendees + 1 WHERE courseID = ?').run(courseID);
    });
    enroll();

    res.status(201).json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Cancel Enrollment ───────────────────────────────────────────────
const cancelEnrollment = (req, res) => {
  try {
    const { courseID } = req.body;
    const memberID = req.user.id;

    if (!courseID) {
      return res.status(400).json({ success: false, message: 'courseID is required' });
    }

    const enrollment = db.prepare(
      "SELECT * FROM CourseEnrollments WHERE courseID = ? AND memberID = ? AND attendanceStatus != 'cancelled'"
    ).get(courseID, memberID);

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    const cancel = db.transaction(() => {
      db.prepare("UPDATE CourseEnrollments SET attendanceStatus = 'cancelled' WHERE enrollmentID = ?").run(enrollment.enrollmentID);
      db.prepare('UPDATE Courses SET currentAttendees = CASE WHEN currentAttendees > 0 THEN currentAttendees - 1 ELSE 0 END WHERE courseID = ?').run(courseID);
    });
    cancel();

    res.json({ success: true, message: 'Enrollment cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: My Enrollments ───────────────────────────────────────────────────
const getMyEnrollments = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT ce.*, c.courseName, c.schedule, c.instructor, c.courseType, c.fitnessLevel
      FROM CourseEnrollments ce
      JOIN Courses c ON ce.courseID = c.courseID
      WHERE ce.memberID = ?
      ORDER BY c.schedule DESC
    `).all(req.user.id);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Attendance Report (req 2.6.6) ────────────────────────────────────
const getCourseAttendance = (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT enrollmentID, memberID, enrollDate, attendanceStatus FROM CourseEnrollments WHERE courseID = ?'
    ).all(req.params.id);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  createCourse, updateCourse, deleteCourse, publishCourse, cancelCourse,
  getAllCoursesAdmin,
  getAllCourses, getCourseById, enrollCourse, cancelEnrollment, getMyEnrollments, getCourseAttendance
  , undoCancelCourse
};
