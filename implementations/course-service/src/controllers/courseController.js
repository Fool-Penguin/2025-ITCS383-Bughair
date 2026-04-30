const pool = require('../config/db');

const T = (t) => `course_svc."${t}"`;

function withActiveEnrollmentCount(baseWhere = '1=1') {
  return `
    SELECT c.*,
           COALESCE(ec."activeCount", 0)::int AS "currentAttendees"
    FROM ${T('Courses')} c
    LEFT JOIN (
      SELECT "courseID", COUNT(*)::int AS "activeCount"
      FROM ${T('CourseEnrollments')}
      WHERE "attendanceStatus" != 'cancelled'
      GROUP BY "courseID"
    ) ec ON ec."courseID" = c."courseID"
    WHERE ${baseWhere}`;
}

// ─── ADMIN: Create Course ─────────────────────────────────────────────────────
const createCourse = async (req, res) => {
  try {
    const { courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel } = req.body;
    if (!courseName || !schedule || !instructor || !maxAttendees || !courseType || !fitnessLevel) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const r = await pool.query(
      `INSERT INTO ${T('Courses')}
         ("courseName","description","schedule","instructor","maxAttendees","courseType","fitnessLevel","status")
       VALUES ($1,$2,$3,$4,$5,$6,$7,'unpublished') RETURNING "courseID"`,
      [courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel]
    );
    res.status(201).json({ success: true, message: 'Course created', data: { courseID: r.rows[0].courseID } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Update Course ─────────────────────────────────────────────────────
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel } = req.body;
    const found = await pool.query(`SELECT 1 FROM ${T('Courses')} WHERE "courseID" = $1`, [id]);
    if (found.rowCount === 0) return res.status(404).json({ success: false, message: 'Course not found' });

    await pool.query(
      `UPDATE ${T('Courses')}
         SET "courseName"=$1, "description"=$2, "schedule"=$3, "instructor"=$4,
             "maxAttendees"=$5, "courseType"=$6, "fitnessLevel"=$7, "updatedAt"=NOW()
       WHERE "courseID"=$8`,
      [courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel, id]
    );
    res.json({ success: true, message: 'Course updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Delete Course ─────────────────────────────────────────────────────
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(`DELETE FROM ${T('Courses')} WHERE "courseID" = $1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Publish / Unpublish ───────────────────────────────────────────────
const publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['published', 'unpublished'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be published or unpublished' });
    }
    const r = await pool.query(
      `UPDATE ${T('Courses')} SET "status"=$1, "updatedAt"=NOW() WHERE "courseID"=$2`,
      [status, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: `Course ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Cancel Course (reason required — req 1.6.6) ──────────────────────
const cancelCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    if (!cancelReason || cancelReason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Cancel reason is required' });
    }
    const r = await pool.query(
      `UPDATE ${T('Courses')} SET "status"='cancelled', "cancelReason"=$1, "updatedAt"=NOW() WHERE "courseID"=$2`,
      [cancelReason, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get All Published Courses ───────────────────────────────────────
const getAllCourses = async (req, res) => {
  try {
    const { fitnessLevel, courseType } = req.query;
    let query = withActiveEnrollmentCount(`c."status" = 'published'`);
    const params = [];
    if (fitnessLevel) { params.push(fitnessLevel); query += ` AND c."fitnessLevel" = $${params.length}`; }
    if (courseType)   { params.push(courseType);   query += ` AND c."courseType" = $${params.length}`; }
    query += ' ORDER BY c."schedule" ASC';
    const r = await pool.query(query, params);
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Get All Courses (including unpublished/cancelled) ─────────────────
const getAllCoursesAdmin = async (req, res) => {
  try {
    const { fitnessLevel, courseType } = req.query;
    let query = withActiveEnrollmentCount();
    const params = [];
    if (fitnessLevel) { params.push(fitnessLevel); query += ` AND c."fitnessLevel" = $${params.length}`; }
    if (courseType)   { params.push(courseType);   query += ` AND c."courseType" = $${params.length}`; }
    query += ' ORDER BY c."schedule" ASC';
    const r = await pool.query(query, params);
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUBLIC: Get Single Course ────────────────────────────────────────────────
const getCourseById = async (req, res) => {
  try {
    const r = await pool.query(withActiveEnrollmentCount(`c."courseID" = $1`), [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── MEMBER: Enroll in Course ─────────────────────────────────────────────────
// req 2.3.6 capacity check, req 2.4.6 schedule conflict check
const enrollCourse = async (req, res) => {
  const client = await pool.connect();
  try {
    const { courseID } = req.body;
    const memberID = req.user.id;

    const courseRes = await client.query(
      withActiveEnrollmentCount(`c."courseID" = $1 AND c."status" = 'published'`),
      [courseID]
    );
    if (courseRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Course not found or not available' });
    }
    const course = courseRes.rows[0];

    if (course.currentAttendees >= course.maxAttendees) {
      return res.status(409).json({ success: false, message: 'Course is full' });
    }

    const existing = await client.query(
      `SELECT 1 FROM ${T('CourseEnrollments')}
       WHERE "courseID"=$1 AND "memberID"=$2 AND "attendanceStatus" IS DISTINCT FROM 'cancelled'`,
      [courseID, memberID]
    );
    if (existing.rowCount > 0) return res.status(409).json({ success: false, message: 'Already enrolled in this course' });

    const cancelled = await client.query(
      `SELECT "enrollmentID" FROM ${T('CourseEnrollments')}
       WHERE "courseID"=$1 AND "memberID"=$2 AND "attendanceStatus" = 'cancelled'
       ORDER BY "enrollDate" DESC LIMIT 1`,
      [courseID, memberID]
    );

    // Schedule conflict (req 2.4.6) — within 60 min window
    const conflict = await client.query(
      `SELECT ce."enrollmentID" FROM ${T('CourseEnrollments')} ce
         JOIN ${T('Courses')} c ON ce."courseID" = c."courseID"
         WHERE ce."memberID" = $1 AND ce."attendanceStatus" != 'cancelled'
           AND c."status" = 'published'
           AND ABS(EXTRACT(EPOCH FROM (c."schedule"::timestamp - $2::timestamp)) / 60) < 60`,
      [memberID, course.schedule]
    );
    if (conflict.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Schedule conflict: you have another course at this time' });
    }

    await client.query('BEGIN');
    if (cancelled.rowCount > 0) {
      await client.query(
        `UPDATE ${T('CourseEnrollments')}
         SET "attendanceStatus"='enrolled', "enrollDate"=NOW()
         WHERE "enrollmentID"=$1`,
        [cancelled.rows[0].enrollmentID]
      );
    } else {
      await client.query(
        `INSERT INTO ${T('CourseEnrollments')} ("courseID","memberID") VALUES ($1,$2)`,
        [courseID, memberID]
      );
    }
    await client.query(
      `UPDATE ${T('Courses')} SET "currentAttendees" = "currentAttendees" + 1 WHERE "courseID" = $1`,
      [courseID]
    );
    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};

// ─── MEMBER: Cancel Enrollment ────────────────────────────────────────────────
const cancelEnrollment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { courseID } = req.body;
    const memberID = req.user.id;

    const enrollRes = await client.query(
      `SELECT "enrollmentID" FROM ${T('CourseEnrollments')}
       WHERE "courseID"=$1 AND "memberID"=$2 AND "attendanceStatus" != 'cancelled'`,
      [courseID, memberID]
    );
    if (enrollRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    const enrollmentID = enrollRes.rows[0].enrollmentID;

    await client.query('BEGIN');
    await client.query(
      `UPDATE ${T('CourseEnrollments')} SET "attendanceStatus"='cancelled' WHERE "enrollmentID"=$1`,
      [enrollmentID]
    );
    await client.query(
      `UPDATE ${T('Courses')} SET "currentAttendees" = GREATEST(0, "currentAttendees" - 1) WHERE "courseID" = $1`,
      [courseID]
    );
    await client.query('COMMIT');

    res.json({ success: true, message: 'Enrollment cancelled' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
};

// ─── MEMBER: My Enrollments ───────────────────────────────────────────────────
const getMyEnrollments = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ce.*, c."courseName", c."schedule", c."instructor", c."courseType", c."fitnessLevel"
       FROM ${T('CourseEnrollments')} ce
       JOIN ${T('Courses')} c ON ce."courseID" = c."courseID"
       WHERE ce."memberID" = $1
       ORDER BY c."schedule" DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: r.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Undo Cancel Course ────────────────────────────────────────────────
const undoCancelCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const found = await pool.query(`SELECT "status" FROM ${T('Courses')} WHERE "courseID" = $1`, [id]);
    if (found.rowCount === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    if (found.rows[0].status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Course is not cancelled' });
    }
    await pool.query(
      `UPDATE ${T('Courses')} SET "status"='published', "cancelReason"=NULL, "updatedAt"=NOW() WHERE "courseID"=$1`,
      [id]
    );
    res.json({ success: true, message: 'Course cancellation reversed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── ADMIN: Attendance Report (req 2.6.6) ────────────────────────────────────
const getCourseAttendance = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT "enrollmentID", "memberID", "enrollDate", "attendanceStatus"
       FROM ${T('CourseEnrollments')} WHERE "courseID" = $1`,
      [req.params.id]
    );
    res.json({ success: true, data: r.rows, total: r.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  createCourse, updateCourse, deleteCourse, publishCourse, cancelCourse, undoCancelCourse,
  getAllCourses, getAllCoursesAdmin, getCourseById,
  enrollCourse, cancelEnrollment, getMyEnrollments, getCourseAttendance
};
