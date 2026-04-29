## Feature 1 — Mobile Client App (Android)
 
| CR ID | Description | Maintenance Type | Priority | Severity | Verification |
|-------|-------------|-----------------|----------|----------|--------------|
| CR-M1 | Create native Android app shell with navigation, auth, and API client. | Adaptive | High | High | Instrumented UI tests + API smoke tests |
| CR-M2 | Implement all member-facing web features in Android (auth, courses, payments, reservations, memberships, etc.). | Adaptive | High | High | Feature parity checklist + UI tests |
| CR-M3 | Add/adjust backend endpoints and auth flows to support mobile client needs (tokens, pagination, media upload, etc.). | Adaptive | Medium | Medium | API tests + regression tests |
 
---
 
## Feature 2 — Profile Edit & Password Reset
 
| CR ID | Description | Maintenance Type | Priority | Severity | Verification |
|-------|-------------|-----------------|----------|----------|--------------|
| CR-P1 | Add endpoints to update name, phone, and profile picture; update DB schema to store profile data. | Perfective | High | High | Unit + API tests |
| CR-P2 | Add forgot-password endpoints, secure token generation, email delivery, and password reset confirmation. | Perfective | High | Critical | Unit + integration tests + security checks |
| CR-P3 | Add profile edit screens and forgot-password UI on web client(s). | Adaptive | High | High | UI tests + end-to-end flow validation |
| CR-P4 | Add profile edit and forgot-password UI on Android. | Adaptive | High | High | Instrumented UI tests |
 
---
 
## Feature 3 — Trainer Rating & Review System
 
| CR ID | Description | Maintenance Type | Priority | Severity | Verification |
|-------|-------------|-----------------|----------|----------|--------------|
| CR-R1 | Add DB schema for ratings and reviews; enforce unique review per member–session pair at the database level. | Perfective | Medium | High | Unit + migration tests |
| CR-R2 | Enforce at the API layer that only members with a completed session may submit a review; reject duplicate submissions. | Perfective | High | High | API tests + access control tests |
| CR-R3 | Display average rating and review list on trainer profiles (web + mobile). | Adaptive | Medium | High | UI snapshot tests (web) + screenshot tests (Android) |
| CR-R4 | Add admin endpoints and UI to remove or flag inappropriate reviews. | Perfective | Medium | High | Role-based access tests |
 
---
 
## Feature 4 — Booking Flow & Data Integrity
 
| CR ID | Description | Maintenance Type | Priority | Severity | Verification |
|-------|-------------|-----------------|----------|----------|--------------|
| CR-C1 | Replace mock course enrollment in the web UI with API-backed calls to `/courses/enroll` and `/courses/enroll/cancel` so bookings persist correctly. | Corrective | High | High | UI tests + API integration tests |
| CR-C2 | Wire trainer booking UI to `/trainers/book` and `/trainers/my/bookings` so trainer bookings persist and display correctly. | Corrective | High | High | UI tests + API integration tests |
| CR-PR1 | Add automated API integration tests for course enrollment and trainer booking covering happy path, conflict, and duplicate cases to prevent regressions. | Preventive | High | High | CI test run + integration test report |
| CR-PR2 | Add DB constraints and input validation for booking records to prevent corrupt or orphaned data. | Preventive | High | Medium | DB constraint tests + invalid booking rejection tests |
