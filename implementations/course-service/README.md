# Course & Trainer Management Service
**Member 3 — ITCS383 Fitness Management System**

## Stack
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: SQLite (via better-sqlite3) — file: `fitness.db`
- **Auth**: JWT (shared with other services)

## Setup
```bash
cd implementations/backend/course-service
npm install
cp .env.example .env
npm start        # → http://localhost:3003
```
> No database setup needed — `fitness.db` is created automatically on first run.

## Run & Test
```bash
npm start        # production
npm run dev      # hot reload
npm test         # Jest unit tests
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/courses | — | List published courses |
| GET | /api/courses/:id | — | Get course detail |
| POST | /api/courses | Admin | Create course |
| PUT | /api/courses/:id | Admin | Edit course |
| DELETE | /api/courses/:id | Admin | Delete course |
| PATCH | /api/courses/:id/publish | Admin | Publish / unpublish |
| PATCH | /api/courses/:id/cancel | Admin | Cancel (reason required) |
| POST | /api/courses/enroll | Member | Enroll in course |
| GET | /api/courses/my/enrollments | Member | My enrollments |
| GET | /api/courses/:id/attendance | Admin | Attendance report |
| GET | /api/trainers | — | List trainers (filter: ?expertise=) |
| GET | /api/trainers/:id | — | Trainer profile + availability |
| POST | /api/trainers | Admin | Add trainer |
| PUT | /api/trainers/:id | Admin | Edit trainer |
| DELETE | /api/trainers/:id | Admin | Delete trainer |
| PUT | /api/trainers/:id/schedule | Admin | Update availability |
| POST | /api/trainers/book | Member | Book private session |
| GET | /api/trainers/my/bookings | Member | My bookings |

## Example Requests

```bash
# Get courses
GET http://localhost:3003/api/courses
GET http://localhost:3003/api/courses?fitnessLevel=beginner

# Enroll (requires JWT token)
POST http://localhost:3003/api/courses/enroll
Authorization: Bearer <token>
{ "courseID": 1 }

# Book trainer (requires JWT token)
POST http://localhost:3003/api/trainers/book
Authorization: Bearer <token>
{ "trainerID": 1, "sessionDate": "2026-04-10", "sessionTime": "09:00", "durationMinutes": 60 }
```

## Requirements Coverage (from Fitness_management_system1.pdf)
| Req | Description | Status |
|-----|-------------|--------|
| 1.1.6–1.5.6 | Admin course CRUD | ✅ |
| 1.6.6 | Cancel course requires reason | ✅ |
| 2.1.6–2.2.6 | Member view & enroll | ✅ |
| 2.3.6 | Prevent enrollment when full | ✅ |
| 2.4.6 | Detect schedule conflicts | ✅ |
| 2.5.6–2.6.6 | Attendance recording & report | ✅ |
| 1.8–2.8 | Trainer CRUD by admin | ✅ |
| 3.8–5.8 | Trainer profiles, filter by expertise | ✅ |
| 6.8–7.8 | Book session, prevent conflicts | ✅ |
| 8.8 | Admin manage trainer schedules | ✅ |
