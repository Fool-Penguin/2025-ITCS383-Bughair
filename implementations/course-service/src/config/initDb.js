const db = require('./db');

const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Trainers (
      trainerID    INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      expertise    TEXT NOT NULL,
      bio          TEXT,
      phone        TEXT,
      email        TEXT,
      profileImage TEXT,
      status       TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
      createdAt    TEXT DEFAULT (datetime('now')),
      updatedAt    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS TrainerAvailability (
      availabilityID INTEGER PRIMARY KEY AUTOINCREMENT,
      trainerID      INTEGER NOT NULL,
      dayOfWeek      TEXT NOT NULL,
      startTime      TEXT NOT NULL,
      endTime        TEXT NOT NULL,
      FOREIGN KEY (trainerID) REFERENCES Trainers(trainerID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Courses (
      courseID        INTEGER PRIMARY KEY AUTOINCREMENT,
      courseName      TEXT NOT NULL,
      description     TEXT,
      schedule        TEXT NOT NULL,
      instructor      TEXT NOT NULL,
      maxAttendees    INTEGER NOT NULL DEFAULT 20,
      currentAttendees INTEGER DEFAULT 0,
      courseType      TEXT NOT NULL,
      fitnessLevel    TEXT NOT NULL CHECK(fitnessLevel IN ('beginner','intermediate','advanced')),
      status          TEXT DEFAULT 'unpublished' CHECK(status IN ('published','unpublished','cancelled')),
      cancelReason    TEXT,
      createdAt       TEXT DEFAULT (datetime('now')),
      updatedAt       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS CourseEnrollments (
      enrollmentID     INTEGER PRIMARY KEY AUTOINCREMENT,
      courseID         INTEGER NOT NULL,
      memberID         INTEGER NOT NULL,
      enrollDate       TEXT DEFAULT (datetime('now')),
      attendanceStatus TEXT DEFAULT 'enrolled' CHECK(attendanceStatus IN ('enrolled','attended','absent','cancelled')),
      FOREIGN KEY (courseID) REFERENCES Courses(courseID) ON DELETE CASCADE,
      UNIQUE(courseID, memberID)
    );

    CREATE TABLE IF NOT EXISTS TrainerBookings (
      bookingID       INTEGER PRIMARY KEY AUTOINCREMENT,
      trainerID       INTEGER NOT NULL,
      memberID        INTEGER NOT NULL,
      sessionDate     TEXT NOT NULL,
      sessionTime     TEXT NOT NULL,
      durationMinutes INTEGER DEFAULT 60,
      status          TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','completed')),
      notes           TEXT,
      createdAt       TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (trainerID) REFERENCES Trainers(trainerID) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS TrainerReviews (
      reviewID     INTEGER PRIMARY KEY AUTOINCREMENT,
      trainerID    INTEGER NOT NULL,
      memberID     INTEGER NOT NULL,
      bookingID    INTEGER,
      rating       INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment      TEXT,
      status       TEXT DEFAULT 'visible' CHECK(status IN ('visible','hidden','flagged')),
      createdAt    TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (trainerID) REFERENCES Trainers(trainerID) ON DELETE CASCADE,
      UNIQUE(memberID, trainerID)
    );
  `);

  // Seed sample data only if tables are empty
  const trainerCount = db.prepare('SELECT COUNT(*) as c FROM Trainers').get().c;
  if (trainerCount === 0) {
    const insertTrainer = db.prepare(
      'INSERT INTO Trainers (name, expertise, bio, phone, email) VALUES (?, ?, ?, ?, ?)'
    );
    const insertAvail = db.prepare(
      'INSERT INTO TrainerAvailability (trainerID, dayOfWeek, startTime, endTime) VALUES (?, ?, ?, ?)'
    );

    const t1 = insertTrainer.run('Alex Johnson', 'Yoga, Pilates',
      'Certified yoga instructor with 8 years experience', '081-000-0001', 'alex@gym.com');
    const t2 = insertTrainer.run('Maria Santos', 'CrossFit, Strength Training',
      'CrossFit Level 2 coach, former athlete', '081-000-0002', 'maria@gym.com');
    const t3 = insertTrainer.run('Tom Chen', 'Badminton, Cardio',
      'Professional badminton trainer', '081-000-0003', 'tom@gym.com');

    [['Monday','08:00','17:00'],['Wednesday','08:00','17:00'],['Friday','08:00','17:00']]
      .forEach(([d,s,e]) => insertAvail.run(t1.lastInsertRowid, d, s, e));
    [['Tuesday','09:00','18:00'],['Thursday','09:00','18:00'],['Saturday','09:00','14:00']]
      .forEach(([d,s,e]) => insertAvail.run(t2.lastInsertRowid, d, s, e));
    [['Monday','10:00','19:00'],['Wednesday','10:00','19:00'],['Saturday','08:00','16:00']]
      .forEach(([d,s,e]) => insertAvail.run(t3.lastInsertRowid, d, s, e));

    const insertCourse = db.prepare(
      `INSERT INTO Courses (courseName, description, schedule, instructor, maxAttendees, courseType, fitnessLevel, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`
    );
    insertCourse.run('Morning Yoga Flow', 'Energizing morning yoga for all levels',
      '2026-04-05 07:00:00', 'Alex Johnson', 15, 'Yoga', 'beginner');
    insertCourse.run('CrossFit HIIT', 'High-intensity interval training',
      '2026-04-06 18:00:00', 'Maria Santos', 12, 'CrossFit', 'advanced');
    insertCourse.run('Badminton Basics', 'Learn fundamental badminton techniques',
      '2026-04-07 10:00:00', 'Tom Chen', 10, 'Badminton', 'beginner');

    // Seed completed bookings for review testing (memberID 1 = first registered user)
    const insertBooking = db.prepare(
      `INSERT INTO TrainerBookings (trainerID, memberID, sessionDate, sessionTime, durationMinutes, status, notes)
       VALUES (?, ?, ?, ?, ?, 'completed', ?)`
    );
    insertBooking.run(t1.lastInsertRowid, 1, '2026-04-01', '09:00', 60, 'Great yoga session');
    insertBooking.run(t2.lastInsertRowid, 1, '2026-04-02', '14:00', 90, 'CrossFit intro');
    insertBooking.run(t3.lastInsertRowid, 1, '2026-04-03', '10:00', 60, 'Badminton practice');
    insertBooking.run(t1.lastInsertRowid, 1, '2026-04-10', '09:00', 60, 'Follow-up yoga');
    insertBooking.run(t2.lastInsertRowid, 1, '2026-04-12', '15:00', 90, 'Strength training');

    // Seed sample reviews
    const insertReview = db.prepare(
      `INSERT INTO TrainerReviews (trainerID, memberID, bookingID, rating, comment) VALUES (?, ?, ?, ?, ?)`
    );
    insertReview.run(t1.lastInsertRowid, 1, 1, 5, 'Alex is an amazing yoga instructor! Very patient and encouraging.');
    insertReview.run(t2.lastInsertRowid, 1, 2, 4, 'Intense CrossFit session, Maria pushes you to your limits. Loved it!');
  }

  console.log('✅ Database initialized (SQLite)');
};

module.exports = initSchema;
