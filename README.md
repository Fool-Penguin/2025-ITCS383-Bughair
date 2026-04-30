# Bughair Fitness Management System

ITCS383 Software Construction and Evolution
Phase 2 Part 2 - Maintenance
Faculty of ICT, Mahidol University

## Overview

Bughair is a web and Android fitness center management system. The project supports member authentication, profile management, password recovery, memberships and payments, course enrollment, trainer booking and reviews, badminton court reservations, attendance, admin management, reports, and promotions.

The Phase 2 maintenance work focuses on:

- Native Android mobile app
- Member profile edit and password recovery
- Trainer rating and review system
- Deployment, CI/CD, SonarCloud evidence, and final maintenance deliverables

## Live Backend

The deployed backend/gateway is hosted on Render:

```text
https://two025-itcs383-bughair-1.onrender.com
```

Render free services may sleep, so the first request after inactivity can be slow.

## Repository Structure

```text
2025-ITCS383-Bughair/
|-- android-app/                         Native Android app
|-- docs/                                Project docs, handoff notes, work log
|-- implementations/
|   |-- AuthMembership/
|   |   |-- backend-api_Module1/          Main Express gateway/backend
|   |   `-- frontend/                     Auth, home, profile, reset pages
|   |-- course-service/                   Courses, trainers, bookings, reviews
|   |-- payment-service/                  Membership plans and payments
|   |-- reservation-service/              Courts, reservations, attendance
|   `-- Admin/                            Admin dashboard and management
|-- _migration/                           Supabase/Postgres schema helpers
|-- .github/workflows/                    CI and SonarCloud workflow
|-- D2_CODE_QUALITY.md                    Code quality report
|-- D3_CHANGE_REQUESTS.md                 Change request analysis
|-- D4_IMPACT_ANALYSIS.md                 Impact analysis
|-- D5_AI-USAGE.md                        AI usage report
|-- Dockerfile                            Render Docker build
|-- render.yaml                           Render Blueprint config
`-- sonar-project.properties              SonarCloud config
```

## Current Maintenance Features

### 1. Native Android App

The Android app lives in:

```text
android-app/
```

It is a native Java Android app using built-in Android views, the Gradle wrapper, `HttpURLConnection`, and `SharedPreferences` for JWT session storage.

Current native coverage includes:

- Login and registration
- Forgot-password request
- Profile view/edit with native profile picture picker and upload
- Courses and enrollment
- Trainers with rating/review display
- Membership payment plans and payment history views
- Court availability and reservation views

See [android-app/README.md](android-app/README.md) for Android build and demo details.

### 2. Member Profile Edit and Password Recovery

Members can update their name, phone number, and profile picture. The forgot-password flow sends a secure reset link by email and lets members set a new password through the reset page.

Password reset email delivery currently uses SendGrid in production.

### 3. Trainer Rating and Review System

Members can rate trainers from 1 to 5 stars and leave comments after completed private training sessions. Trainer profiles display ratings and reviews. The backend enforces completed-booking review eligibility and duplicate-review prevention.

## Local Web Development

Prerequisites:

- Node.js 18 or higher
- npm
- A configured local `.env` or environment variables for database-backed flows

Start the main gateway:

```powershell
cd implementations/AuthMembership/backend-api_Module1
npm install
npm start
```

Open:

```text
http://localhost:8080
```

Some local environments may use a different `PORT` if loaded from an `.env` file.

## Android Build

From PowerShell:

```powershell
cd android-app
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat assembleDebug
```

Debug APK output:

```text
android-app/app/build/outputs/apk/debug/app-debug.apk
```

Open `android-app/` in Android Studio to run the app on an emulator.

## Tests

Course service tests:

```powershell
cd implementations/course-service
npm install
npm test
```

Coverage-focused command:

```powershell
npm test -- --coverageReporters=json-summary --coverageReporters=text --runInBand
```

Reservation service tests:

```powershell
cd implementations/reservation-service/backend
npm install
npm test
```

## Database and Environment

The current deployment uses Supabase/Postgres-backed schemas. Important environment variables include:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase/Postgres connection string |
| `JWT_SECRET` | JWT signing and verification |
| `PORT` | Local/deployed server port |
| `APP_BASE_URL` | Public base URL for password reset links |
| `SENDGRID_API_KEY` | SendGrid email API key |
| `SENDGRID_FROM` | Verified sender address for reset emails |
| `SONAR_TOKEN` | GitHub Actions SonarCloud scan token |

Do not commit `.env` files, real credentials, database dumps, coverage output, dependency folders, APKs, or other generated artifacts.

## CI/CD and Quality

GitHub Actions runs build/test/SonarCloud checks on pushes to `master`.

See [D2_CODE_QUALITY.md](D2_CODE_QUALITY.md) for code quality evidence.

## Final Deliverables

| Deliverable | File |
|---|---|
| D1 Working prototype and CI/CD | Web app, Android app, Render, GitHub Actions, SonarCloud |
| D2 Code quality report | [D2_CODE_QUALITY.md](D2_CODE_QUALITY.md) |
| D3 Change request analysis | [D3_CHANGE_REQUESTS.md](D3_CHANGE_REQUESTS.md) |
| D4 Impact analysis | [D4_IMPACT_ANALYSIS.md](D4_IMPACT_ANALYSIS.md) |
| D5 AI usage report | [D5_AI-USAGE.md](D5_AI-USAGE.md) |

## Documentation

Start with [docs/README.md](docs/README.md) for the documentation index.

Important project docs:

- [docs/WORK_LOG.md](docs/WORK_LOG.md) - mandatory shared work log
- [docs/handoff/PROJECT_OVERVIEW_AND_REQUIREMENTS.md](docs/handoff/PROJECT_OVERVIEW_AND_REQUIREMENTS.md) - architecture, setup, risks, and workflow
- [docs/handoff/CURRENT_SESSION_HANDOFF.md](docs/handoff/CURRENT_SESSION_HANDOFF.md) - latest continuation notes

## Team

Group: Bughair
Course: ITCS383 Software Construction and Evolution
Institution: Faculty of ICT, Mahidol University
