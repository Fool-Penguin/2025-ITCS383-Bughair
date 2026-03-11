# 2025-ITCS383-Bughair

**Fitness Course Management System**  
ITCS383 Software Construction and Evolution — Phase 1  
Mahidol University ICT

---

## About

A web-based Fitness Management System consisting of multiple services: authentication & membership, course management, admin management, payment, and reservation. Built with Node.js/Express backends and HTML/JavaScript frontends.

---

## Repository Structure

```
2025-ITCS383-Bughair/
├── designs/                            # D1 — C4 diagrams and design rationale
├── implementations/
│   ├── AuthMembership/                 # ⭐ Main entry point
│   │   ├── backend-api_Module1/        # Express.js backend (run this)
│   │   └── frontend/                   # Auth/membership frontend
│   │
│   ├── Admin/                          # Admin management service
│   │   ├── backend/backend/            # Express.js backend
│   │   ├── front/                      # Admin frontend
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   ├── course-service/                 # Course management service
│   │   ├── frontend/                   # Course frontend
│   │   ├── src/                        # Backend source code
│   │   ├── tests/                      # Jest unit tests
│   │   ├── .env.example                # Environment variable template
│   │   └── package.json
│   │
│   ├── payment-service/                # Payment service
│   │   ├── data/
│   │   ├── src/
│   │   └── fitness-payment-frontend.html
│   │
│   └── reservation-service/            # Reservation service
│       ├── backend/
│       └── frontend/
│
├── .github/workflows/                  # GitHub Actions CI pipeline
├── Bughair_D3_AILog.md                 # D3 — AI Usage Log
├── Bughair_D4_QualityReport.md         # D4 — Quality Evidence Report
├── sonar-project.properties            # SonarQube configuration
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

Verify your installation:

```bash
node --version
npm --version
```

---

## Getting Started

The main application entry point is the **AuthMembership** service. Start here to access the full system.

### Step 1 — Install dependencies

```bash
cd implementations/AuthMembership/backend-api_Module1
npm install
```

### Step 2 — Run the server

```bash
node server.js
```

The server will start on **port 8080**.  
Open your browser and navigate to: `http://localhost:8080`

---

## Services Overview

| Service | Location | Responsibility |
|---------|----------|----------------|
| **AuthMembership** | `implementations/AuthMembership/` | User authentication, registration, and membership |
| **Course Service** | `implementations/course-service/` | Course listings, enrollment, and schedule management |
| **Admin** | `implementations/Admin/` | Admin dashboard and system management |
| **Payment Service** | `implementations/payment-service/` | Membership payment processing |
| **Reservation Service** | `implementations/reservation-service/` | Course slot reservations |

---

## Running Tests

Tests are located in `course-service`:

```bash
cd implementations/course-service
npm test
```

Tests are written with [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest), covering course listing, member enrollment/unenrollment, authentication, and admin authorisation.

---

## Environment Variables

The `course-service` uses a `.env` file. Copy the example file and configure it before running:

```bash
cp implementations/course-service/.env.example implementations/course-service/.env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the course service (default: `8080`) |
| `JWT_SECRET` | Secret key for JWT signing |

---

## CI/CD Pipeline

GitHub Actions automatically builds, tests, and analyses code on every push to `master`.

Pipeline steps:
1. Install dependencies (`npm install`)
2. Run unit tests (`npm test`)
3. Run SonarQube static analysis

See `.github/workflows/` for the workflow configuration.

---

## Code Quality

Static analysis is performed using [SonarQube Community](https://www.sonarsource.com/products/sonarqube/).

- Quality Gate: **Passed**
- See `Bughair_D4_QualityReport.md` for the full quality evidence report.

---

## Team

**Group:** Bughair  
**Course:** ITCS383 Software Construction and Evolution  
**Institution:** Faculty of ICT, Mahidol University  
