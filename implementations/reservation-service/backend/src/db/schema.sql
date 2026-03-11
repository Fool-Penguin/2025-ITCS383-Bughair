-- ============================================================
-- Fitness Management System
-- ============================================================
-- Run this file once to set up the database:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS fitness_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitness_db;

-- ============================================================
-- TABLE: Courts
-- Stores the 5 badminton courts and their maintenance windows.
-- Requirement: 1.7, 6.7, 7.7
-- ============================================================
CREATE TABLE IF NOT EXISTS Courts (
    court_id           INT           NOT NULL AUTO_INCREMENT,
    court_number       INT           NOT NULL UNIQUE,          -- 1 to 5
    status             ENUM('available', 'booked', 'maintenance')
                                     NOT NULL DEFAULT 'available',
    maintenance_start  DATETIME      DEFAULT NULL,
    maintenance_end    DATETIME      DEFAULT NULL,
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (court_id),

    -- Maintenance window must be a valid range
    CONSTRAINT chk_maintenance_range
        CHECK (
            maintenance_start IS NULL
            OR maintenance_end IS NULL
            OR maintenance_end > maintenance_start
        )
) ENGINE=InnoDB;


-- ============================================================
-- TABLE: CourtReservations
-- Records every court booking made by a member.
-- Requirement: 2.7, 3.7, 4.7, 5.7
-- ============================================================
CREATE TABLE IF NOT EXISTS CourtReservations (
    reservation_id  VARCHAR(20)   NOT NULL,                    -- e.g. RES-001
    court_id        INT           NOT NULL,
    member_id       VARCHAR(20)   NOT NULL,                    -- FK → Users (Member 1 service)
    member_name     VARCHAR(100)  NOT NULL,
    date            DATE          NOT NULL,
    time_slot       VARCHAR(20)   NOT NULL,                    -- e.g. "10:00–11:00"
    status          ENUM('active', 'cancelled')
                                  NOT NULL DEFAULT 'active',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (reservation_id),

    -- A court cannot be double-booked for the same date + slot
    UNIQUE KEY uq_court_date_slot (court_id, date, time_slot, status),

    CONSTRAINT fk_reservation_court
        FOREIGN KEY (court_id)
        REFERENCES Courts (court_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Index for fast lookup by member
CREATE INDEX idx_reservation_member ON CourtReservations (member_id, date);

-- Index for conflict detection queries
CREATE INDEX idx_reservation_slot   ON CourtReservations (court_id, date, time_slot);


-- ============================================================
-- TABLE: AttendanceLogs
-- Records entry and exit of every member at the facility gate.
-- Requirement: 1.5, 2.5, 3.5, 4.5, 5.5 (Attendance section)
-- ============================================================
CREATE TABLE IF NOT EXISTS AttendanceLogs (
    log_id       INT           NOT NULL AUTO_INCREMENT,
    member_id    VARCHAR(20)   NOT NULL,                       -- FK → Users (Member 1 service)
    member_name  VARCHAR(100)  NOT NULL,
    entry_time   DATETIME      NOT NULL,
    exit_time    DATETIME      DEFAULT NULL,                   -- NULL = still inside

    PRIMARY KEY (log_id),

    -- A member can only have one open (no exit) session at a time
    CONSTRAINT chk_exit_after_entry
        CHECK (exit_time IS NULL OR exit_time > entry_time)
) ENGINE=InnoDB;

-- Index for fast "currently inside" count query
CREATE INDEX idx_attendance_member ON AttendanceLogs (member_id, entry_time);
CREATE INDEX idx_attendance_open   ON AttendanceLogs (exit_time);
CREATE INDEX idx_attendance_date   ON AttendanceLogs (entry_time);


-- ============================================================
-- SEED DATA — Initial courts (5 badminton courts)
-- ============================================================
INSERT INTO Courts (court_number, status) VALUES
    (1, 'available'),
    (2, 'available'),
    (3, 'available'),
    (4, 'available'),
    (5, 'available');


-- ============================================================
-- SEED DATA — Sample reservations for development/testing
-- ============================================================
INSERT INTO CourtReservations
    (reservation_id, court_id, member_id, member_name, date, time_slot, status)
VALUES
    ('RES-001', 2, 'M001', 'John Doe',  CURDATE(), '10:00–11:00', 'active'),
    ('RES-002', 4, 'M002', 'Sara Kim',  CURDATE(), '13:00–14:00', 'active'),
    ('RES-003', 1, 'M002', 'Sara Kim',  CURDATE(), '15:00–16:00', 'active'),
    ('RES-004', 5, 'M001', 'John Doe',  DATE_SUB(CURDATE(), INTERVAL 1 DAY), '18:00–19:00', 'active'),
    ('RES-005', 3, 'M001', 'John Doe',  DATE_SUB(CURDATE(), INTERVAL 2 DAY), '09:00–10:00', 'cancelled');


-- ============================================================
-- SEED DATA — Sample attendance logs for development/testing
-- ============================================================
INSERT INTO AttendanceLogs
    (member_id, member_name, entry_time, exit_time)
VALUES
    ('M001', 'John Doe',  NOW() - INTERVAL 3 HOUR,  NULL),
    ('M002', 'Sara Kim',  NOW() - INTERVAL 5 HOUR,  NOW() - INTERVAL 3 HOUR),
    ('M003', 'Tom Lee',   NOW() - INTERVAL 4 HOUR,  NULL),
    ('M004', 'Amy Chen',  NOW() - INTERVAL 6 HOUR,  NOW() - INTERVAL 4 HOUR),
    ('M005', 'Pat Wong',  NOW() - INTERVAL 2 HOUR,  NULL),
    ('M006', 'Lisa Park', NOW() - INTERVAL 7 HOUR,  NOW() - INTERVAL 5 HOUR),
    ('M007', 'Mark Tan',  NOW() - INTERVAL 1 HOUR,  NULL);