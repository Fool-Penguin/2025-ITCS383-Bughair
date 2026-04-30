# Project Overview and Workspace Requirements

This document summarizes the project for teammates, maintainers, and future coding agents. Use it as the first handoff document before editing the repository.

## Project Summary

**Project:** Bughair Fitness Management System  
**Course:** ITCS383 Software Construction and Evolution  
**Current phase:** Phase 2 Part 2 - Maintenance  
**Main goal:** Maintain and extend an existing web-based fitness center management system, deploy it, improve quality, and prepare the final demonstration.

The system supports member registration/login, membership management, payment flows, course and trainer management, private training bookings, badminton court reservations, attendance tracking, admin management, reports, and promotions.

## Current Maintenance Features

The Phase 2 maintenance work is centered on three major feature areas:

1. **Native Android mobile app**
   - Must provide the same main features as the web version.
   - May live in a separate GitHub repository.
   - The main repo `README.md` must link to the Android repository.

2. **Member Profile Edit and Password Recovery**
   - Members can update name, phone number, and profile picture.
   - Members can request a password reset email.
   - Reset flow uses a secure token and a reset-password page.

3. **Trainer Rating and Review System**
   - Members can rate trainers from 1 to 5 stars.
   - Members can leave comments.
   - Trainer profiles display average rating and review count.
   - Admins can moderate inappropriate reviews.

## Final Deliverables

| Deliverable | Expected Output |
|---|---|
| D1 | Working web/mobile prototype, deployed backend, CI/CD, SonarCloud |
| D2 | `D2_CODE_QUALITY.md` with before/after SonarCloud results and new-code coverage evidence |
| D3 | `D3_CHANGE_REQUESTS.md` with at least 8 CRs: 2 corrective, 2 adaptive, 2 perfective, 2 preventive |
| D4 | `D4_IMPACT_ANALYSIS.md` with traceability graph, affected graph, SLO graph, connectivity matrix, and analysis |
| D5 | `D5_AI-USAGE.md` documenting AI usage |

Key deadline from the project docs:

| Item | Date |
|---|---|
| Final GitHub commit | 30 April 2026, 23:55 |
| Presentation / live demo | 1 May 2026 |

## Runtime Architecture

The repository is a hybrid multi-service Node.js system. The main deployed web entry point is the AuthMembership backend, which also acts as a gateway and imports some other services directly.

| Area | Path | Purpose |
|---|---|---|
| AuthMembership gateway | `implementations/AuthMembership/backend-api_Module1` | Main Express app, auth, profile, password reset, static frontend hosting |
| AuthMembership frontend | `implementations/AuthMembership/frontend` | Login, signup, home, profile, forgot/reset password pages |
| Course service | `implementations/course-service` | Courses, enrollments, trainers, bookings, trainer reviews |
| Payment service | `implementations/payment-service` | Payment plans, transactions, refunds, payment method stubs |
| Reservation service | `implementations/reservation-service` | Court reservations, attendance, reports |
| Admin service | `implementations/Admin` | Admin dashboard, customers, promotions, admin reporting |
| Migration scripts | `_migration` | Supabase/Postgres schema and data migration helpers |

## Database and Deployment

The current codebase has been moved toward Postgres/Supabase-backed schemas. Render hosts the backend as a Docker web service.

Important files:

| File | Purpose |
|---|---|
| `render.yaml` | Render Blueprint configuration |
| `Dockerfile` | Render Docker build and startup |
| `sonar-project.properties` | SonarCloud project and coverage configuration |
| `_migration/schemas/*.sql` | Postgres schema definitions |
| `.github/workflows/build.yml` | CI build/test/SonarCloud workflow |

Required deployment/environment values:

| Variable | Used By | Purpose |
|---|---|---|
| `DATABASE_URL` | All Postgres-backed services | Supabase/Postgres connection string |
| `JWT_SECRET` | Auth/course auth | JWT signing and verification |
| `PORT` | Render/local server | Server port, usually `8080` for the gateway |
| `APP_BASE_URL` | Password reset | Public app URL for reset email links |
| `SMTP_HOST` | Password reset email | SMTP server |
| `SMTP_PORT` | Password reset email | SMTP port, commonly `587` |
| `SMTP_USER` | Password reset email | SMTP username or provider key user |
| `SMTP_PASS` | Password reset email | SMTP password or API key |
| `SMTP_FROM` | Password reset email | Sender shown in reset emails |
| `SONAR_TOKEN` | GitHub Actions | SonarCloud scan token |

Never commit real `.env` files or secrets.

## Local Development

Main app:

```powershell
cd implementations/AuthMembership/backend-api_Module1
npm install
npm start
```

Open:

```text
http://localhost:8080
```

Course service tests:

```powershell
cd implementations/course-service
npm install
npm test
```

Coverage-focused test command:

```powershell
npm test -- --coverageReporters=json-summary --coverageReporters=text --runInBand
```

## Quality and Coverage

SonarCloud project:

| Setting | Value |
|---|---|
| Project key | `Fool-Penguin_2025-ITCS383-Bughair` |
| Organization | `fool-penguin` |

Current coverage setup:

- Static analysis scans the service source directories listed in `sonar-project.properties`.
- Coverage currently imports `implementations/course-service/coverage/lcov.info`.
- Coverage enforcement excludes services that do not yet generate reliable LCOV.
- Latest local course-service coverage: 90.95% line coverage.

If adding coverage for another service, add real tests first, generate `lcov.info`, upload/download the artifact in GitHub Actions, then remove that service from `sonar.coverage.exclusions`.

## Known Risks and Constraints

| Risk | Impact |
|---|---|
| Hybrid gateway imports other services with relative `require()` paths | Changes in one service can break the deployed gateway |
| Mixed Express versions and raw Node HTTP service | Middleware and routing behavior differs by service |
| Some older docs mention SQLite while current deployment uses Postgres/Supabase | Always verify current code before following older notes |
| Admin and some service endpoints have inconsistent auth patterns | Security work should verify each route, not assume shared middleware |
| Frontend is vanilla HTML/JS with duplicated scripts/styles | Small changes may need to be repeated across pages |
| Render free plan may sleep | First request after inactivity can be slow |

## Required Team Workflow

1. Read this file before starting work.
2. Check `docs/WORK_LOG.md` for the latest completed work and open next steps.
3. Inspect the current code before editing; do not rely only on older documentation.
4. Make focused changes and avoid touching unrelated service areas.
5. Run the relevant local test or syntax check.
6. Add a new entry to the top of `docs/WORK_LOG.md` after every task.
7. If AI helped, also update `D5_AI-USAGE.md` when preparing deliverables.

## Recommended Ownership

| Role | Main Responsibility |
|---|---|
| Mobile lead | Android app and mobile parity with web features |
| Web/backend lead | Render deployment, API stability, web feature completion |
| QA/code quality | Tests, SonarCloud, D2 evidence |
| Systems analyst | D3, D4, traceability, impact analysis |
| Project manager / PO liaison | Requirements, demo flow, final integration |

## Quick Continuation Checklist

Use this checklist when picking up work:

- Pull latest changes and check `git status`.
- Read `docs/WORK_LOG.md`.
- Confirm `.env` values exist locally but are not committed.
- Run the service-specific test before and after edits.
- For Render issues, check `render.yaml`, `Dockerfile`, and gateway `server.js`.
- For Sonar issues, check `sonar-project.properties` and `.github/workflows/build.yml`.
- For password reset issues, check AuthMembership controller, frontend reset pages, and SMTP env vars.
- For course/trainer/review issues, run `implementations/course-service` tests.
