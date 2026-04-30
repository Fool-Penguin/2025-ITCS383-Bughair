-- course-service tables. Identifiers preserve original camelCase from
-- the SQLite schema so JSON returned to the frontend stays unchanged.
-- All names must therefore be double-quoted in queries.

SET search_path TO course_svc;

CREATE TABLE IF NOT EXISTS "Trainers" (
  "trainerID"    BIGSERIAL PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "expertise"    TEXT NOT NULL,
  "bio"          TEXT,
  "phone"        TEXT,
  "email"        TEXT,
  "profileImage" TEXT,
  "status"       TEXT DEFAULT 'active' CHECK ("status" IN ('active','inactive')),
  "createdAt"    TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TrainerAvailability" (
  "availabilityID" BIGSERIAL PRIMARY KEY,
  "trainerID"      BIGINT NOT NULL REFERENCES "Trainers"("trainerID") ON DELETE CASCADE,
  "dayOfWeek"      TEXT NOT NULL,
  "startTime"      TEXT NOT NULL,
  "endTime"        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Courses" (
  "courseID"        BIGSERIAL PRIMARY KEY,
  "courseName"      TEXT NOT NULL,
  "description"     TEXT,
  "schedule"        TEXT NOT NULL,
  "instructor"      TEXT NOT NULL,
  "maxAttendees"    INTEGER NOT NULL DEFAULT 20,
  "currentAttendees" INTEGER DEFAULT 0,
  "courseType"      TEXT NOT NULL,
  "fitnessLevel"    TEXT NOT NULL CHECK ("fitnessLevel" IN ('beginner','intermediate','advanced')),
  "status"          TEXT DEFAULT 'unpublished' CHECK ("status" IN ('published','unpublished','cancelled')),
  "cancelReason"    TEXT,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CourseEnrollments" (
  "enrollmentID"     BIGSERIAL PRIMARY KEY,
  "courseID"         BIGINT NOT NULL REFERENCES "Courses"("courseID") ON DELETE CASCADE,
  "memberID"         BIGINT NOT NULL,
  "enrollDate"       TIMESTAMPTZ DEFAULT NOW(),
  "attendanceStatus" TEXT DEFAULT 'enrolled' CHECK ("attendanceStatus" IN ('enrolled','attended','absent','cancelled')),
  UNIQUE ("courseID", "memberID")
);

CREATE TABLE IF NOT EXISTS "TrainerBookings" (
  "bookingID"       BIGSERIAL PRIMARY KEY,
  "trainerID"       BIGINT NOT NULL REFERENCES "Trainers"("trainerID") ON DELETE CASCADE,
  "memberID"        BIGINT NOT NULL,
  "sessionDate"     TEXT NOT NULL,
  "sessionTime"     TEXT NOT NULL,
  "durationMinutes" INTEGER DEFAULT 60,
  "status"          TEXT DEFAULT 'pending' CHECK ("status" IN ('pending','confirmed','cancelled','completed')),
  "notes"           TEXT,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TrainerReviews" (
  "reviewID"   BIGSERIAL PRIMARY KEY,
  "trainerID"  BIGINT NOT NULL REFERENCES "Trainers"("trainerID") ON DELETE CASCADE,
  "memberID"   BIGINT NOT NULL,
  "bookingID"  BIGINT,
  "rating"     INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment"    TEXT,
  "status"     TEXT DEFAULT 'visible' CHECK ("status" IN ('visible','hidden','flagged')),
  "createdAt"  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("memberID", "trainerID")
);
