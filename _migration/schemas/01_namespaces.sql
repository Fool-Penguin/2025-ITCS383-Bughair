-- One Postgres database, one schema per service.
-- Names mirror folder names. Drop-and-recreate is safe — each service
-- migration script repopulates its own schema.

CREATE SCHEMA IF NOT EXISTS course_svc;
CREATE SCHEMA IF NOT EXISTS payment_svc;
CREATE SCHEMA IF NOT EXISTS admin_svc;
CREATE SCHEMA IF NOT EXISTS reservation_svc;
