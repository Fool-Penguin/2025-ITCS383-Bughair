# HANDOVER.md

<!-- ## D1: Demonstration of Runnable System

The project has been successfully transferred to the local machine. The system consists of multiple Node.js services that can be run independently. However, there are compilation issues with the `better-sqlite3` package on Windows systems that require Visual Studio with C++ build tools.

### Services Identified:
1. **AuthMembership Service** (port 8080) - User authentication and membership management
2. **Course Service** (port 3003) - Course and trainer management
3. **Payment Service** (port 8080) - Payment processing
4. **Reservation Service** (port 8080) - Court reservation and attendance
5. **Admin Service** (port 8080) - Administrative functions

### Setup Steps Performed:
- Node.js v22.14.0 verified as installed
- Dependencies installed for AuthMembership and Course services
- Package.json created for Payment service
- Attempted dependency installation for all services

### Current Status:
- Services are structurally correct and follow the design specifications
- Code is well-organized with proper separation of concerns
- Compilation issues with better-sqlite3 prevent immediate execution on this Windows environment
- All source code and configuration files are present and intact

### Resolution for Full Runnability:
To make the system fully runnable, either:
1. Install Visual Studio with "Desktop development with C++" workload, or
2. Replace `better-sqlite3` with `sqlite3` package (requires code modifications for async API), or
3. Use a Linux environment where precompiled binaries are available

The system architecture and code quality demonstrate that the project is properly implemented and ready for deployment in appropriate environments. -->

## 1. Features of the Project

The Fitness Management System (FMS) is a comprehensive web-based application designed to automate operations of a fitness center. The system provides the following key features:

### User Management
- Customer registration with membership type selection
- Secure login/logout functionality
- Missing UI: There is no "Forgot Password" or "Reset Password" page on the frontend.
- Missing Backend: While there is a /profile endpoint to fetch user data, there is no logic for updating profiles or resetting passwords securely.
- Unique Member ID assignment

### Membership Management
- Support for Free and Paid membership types
- Paid memberships available in Monthly and Yearly plans
- Automatic renewal for monthly memberships
- Membership status tracking and upgrades

### Payment Processing
- Support for multiple payment methods: Credit Card, PayPal, and TrueMoney Wallet
- Secure online payment processing
- Transaction logging and idempotency

### Course Management
- Administrator course creation, editing, and publishing
- Course details including schedule, instructor, capacity, type, and fitness level
- Member course browsing and enrollment
- Schedule conflict detection
- Attendance tracking and reporting

### Private Training Management
- Trainer directory with expertise information
- Member trainer search and filtering
- Private session booking with conflict prevention

### Badminton Court Reservation
- Management of 5 badminton courts
- Member-only reservations with time slot management
- Double-booking prevention
- Maintenance period scheduling

### Content and Promotion Management
- Promotional content creation and publishing
- General fitness center information display
- Event and course details

### Usage Monitoring and Reporting
- Real-time member count tracking
- Peak/low-peak usage analysis
- Financial and membership reports
- Administrator dashboard with data visualization

### Attendance Tracking
- Member entry/exit recording via entrance keypad
- Real-time data transmission to backend
- Attendance logs and reports

## 2. Verification Results of the Design (C4 and Others) Compared to Actual Implementation

### Design Overview
The original design follows a three-tier C4 architecture:
- **Level 1 (Context)**: System context with Customer, Administrator, Payment Gateway, TrueMoney Wallet, and Entrance Gate System
- **Level 2 (Container)**: Web Application (HTML/JS), API Application (Node.js/Express), Database (SQLite)
- **Level 3 (Component)**: Web app components (Admin Dashboard, Course Editor, Report Generator, Public Content Manager) and API components (Membership Engine, Resource Conflict Checker, Attendance Service, Security Module)

### Consistency Summary

| Diagram | Score | Key Takeaway |
|---------|-------|--------------|
| Use Case Diagram | 🟢 ~75% | Core flows implemented; some features not built |
| C4 Level 1 (Context) | 🟢 ~80% | Actors and systems correct; external integrations are mocked |
| **C4 Level 2 (Container)** | 🔴 **~30%** | **Biggest issue** — architecture deviated significantly from design |
| C4 Level 3 (Components) | 🟡 ~55% | Components exist but are fragmented across services; auth is inconsistent |
| UML Class Diagram | 🟢 ~80% | Most entities match; some improvements over original design |

---

### Use Case Diagram Verification

**Implemented Use Cases:**
- Customer registration & login (`POST /api/auth/register`, `POST /api/auth/login`)
- Membership selection during registration (role selection in `auth.html`)
- Course browsing & enrollment (`GET /api/courses`, `POST /api/courses/:id/enroll`)
- Trainer viewing, filtering, and booking (`GET /api/trainers`, `TrainerBookings` table)
- Badminton court reservation with double-booking prevention (`POST /api/courts/book`)
- Admin: Manage courses, customers, promotions — across Admin + course-service
- Payment processing with 3 methods — Credit Card, PayPal, TrueMoney stubs

**Not Implemented / Partially Implemented:**

| Use Case | Status | Note |
|----------|--------|------|
| Password reset | Not implemented | Not built in backend or frontend |
| Profile update | GET-only | `GET /profile` exists but no `PUT/PATCH` to update |
| Secure logout | Client-side only | Clears localStorage; no server-side token invalidation |
| Auto-renewal via cron | Not implemented | No scheduled task or cron job exists |
| Admin: Manage trainers | Wrong service | Trainer CRUD is in course-service, not Admin service |
| Report generation/export | Basic stats only | Dashboard shows numbers but no charts or export |

---

### C4 Level 1 — System Context Verification

**Consistent:** Customer and Administrator actors interact with the web application correctly. Payment Gateway System and TrueMoney Wallet API have dedicated service modules (`creditCardService.js`, `paypalService.js`, `truemoneyService.js`).

**Deviations:**

| Element | Status | Note |
|---------|--------|------|
| Entrance Gate System | Simulated | Manual API calls instead of hardware integration |
| HTTPS | Not enforced | Plain HTTP on localhost |
| External payment APIs | Mock/stub only | Services simulate responses, no real API calls |

---

### C4 Level 2 — Container Diagram Verification

> **This level has the most significant deviation from the design.**

**Design:** 3 containers — single Web App, single API Application, single Database.

**Actual:** Hybrid monolith-gateway pattern with fragmented services and multiple databases.

| Container | Design | Actual | Severity |
|-----------|--------|--------|----------|
| Web Application | Single unified frontend | 13 separate HTML files across 5 directories, no shared framework | Medium |
| API Application | Single centralised backend | 5 separate services, but AuthMembership imports routes from payment-service and reservation-service via `require('../../...')` — creating a hybrid gateway | **High** |
| Database | Single SQLite file | **5+ separate DB files**: `fitness_payment.db` (Auth+Payment shared), `courses.db` (course-service), `fitcourt.db` (reservation), `promotion.db`, `course.db`, `admin_audit.db` (Admin) | **High** |
| Socket.io | Real-time push to dashboard | Not implemented — not in any `package.json` | Low |

**Additional Issues:**

| Issue | Details |
|-------|---------|
| Port conflict | AuthMembership, Admin, payment-service, and reservation-service all default to port 8080 |
| Duplicate course management | Admin's `/api/courses` writes to `course.db`, while course-service's `/api/courses` writes to a different DB |
| Cross-service code imports | AuthMembership directly `require()`s files from payment-service and reservation-service directories |

**Updated C4 Level 2 Diagram (reflecting actual architecture):**

```
[Customer] --> [Web Application (13 HTML files, no framework)]
[Administrator] --> [Web Application (13 HTML files, no framework)]

[Web Application] --> [AuthMembership Gateway (Express v5, port 8080)]
[Web Application] --> [Course Service (Express v4, port 3003)]
[Web Application] --> [Admin Service (Express v5, port 8080)]

[AuthMembership Gateway] --imports--> [Payment Service routes]
[AuthMembership Gateway] --imports--> [Reservation Service routes]

[AuthMembership Gateway] --> [fitness_payment.db (Users, Memberships, Payments, Plans)]
[AuthMembership Gateway] --> [fitcourt.db (Courts, Reservations, Attendance)]
[Course Service] --> [courses.db (Courses, Trainers, Enrollments, Bookings)]
[Admin Service] --> [promotion.db]
[Admin Service] --> [course.db]
[Admin Service] --> [admin_audit.db]

[Payment Service] --> [Payment Gateway System (mock)]
[Payment Service] --> [TrueMoney Wallet API (mock)]
[Reservation Service] --> [Entrance Gate System (simulated)]
```

---

### C4 Level 3 — Component Diagram Verification

**Web Application Components:**

| Component | Design | Actual |
|-----------|--------|--------|
| Admin Dashboard | Unified control panel with Socket.io | Basic stats via API; no real-time updates |
| Course Editor | Admin course CRUD | **Duplicated** in `Admin/front/course.html` AND `course-service/frontend/index.html` |
| Report Generator | Charts, export, analytics | `report.html` exists but minimal — no charts or export |
| Public Content Manager | Promotions + public info | `promotion.html` has admin CRUD but no public viewing page |

**API Application Components:**

| Component | Design | Actual |
|-----------|--------|--------|
| Membership & Subscription Engine | Full lifecycle + auto-renew | `subscribe` + `getStatus` only; no auto-renew or upgrade |
| Resource Conflict Checker | Centralised for courts + courses | Split — court checking in reservation-service, course capacity in course-service |
| Attendance & Monitoring | Real-time Socket.io push | Entry/exit API endpoints only; no real-time push |
| Security & Encryption Module | Centralised JWT + bcrypt + RBAC | **Fragmented** across services — see table below |

**Authentication Fragmentation:**

| Service | Auth Method | RBAC | Issue |
|---------|------------|------|-------|
| AuthMembership | JWT (jsonwebtoken) | Yes, role in payload | Issues tokens |
| course-service | JWT (jsonwebtoken) | Yes, `requireAdmin` | Verifies tokens properly |
| payment-service | **Mock base64** (not JWT) | Yes, `requireRole` | Different implementation from other services |
| Admin | **None** | No | All admin endpoints are unprotected |
| reservation-service | **Plaintext password** in data.js | No | No real auth middleware |

---

### UML Class Diagram Verification

**Matching Entities:**

| Design Class | Implemented As | Location |
|---|---|---|
| Customer → User | `Users` table | `payment-service/src/config/database.js` |
| Membership | `Memberships` table | `payment-service/src/config/database.js` |
| Payment | `payment_transactions` table | `payment-service/src/config/database.js` |
| Course | `Courses` table | `course-service/src/config/initDb.js` |
| CourseEnrollment | `CourseEnrollments` table | `course-service/src/config/initDb.js` |
| Trainer | `Trainers` table | `course-service/src/config/initDb.js` |
| TrainingSession | `TrainerBookings` table | `course-service/src/config/initDb.js` |
| BadmintonCourt | `courts` table | `reservation-service/src/db/database.js` |
| CourtReservation | `court_reservations` table | `reservation-service/src/db/database.js` |
| Attendance | `attendance_logs` table | `reservation-service/src/db/database.js` |
| Promotion | `promotions` table | `Admin/backend/backend/databaseSetup.js` |

**Real Inconsistencies:**

| Item | Design | Actual |
|------|--------|--------|
| Administrator class | Separate class | No separate table — stored in `Users` with `role = 'admin'` |
| Trainer.availabilitySchedule | Single attribute | Improved — normalised into separate `TrainerAvailability` table |
| Court to Reservation composition | Cascading deletes | `foreign_keys = OFF` in reservation-service |
| Cross-entity relationships | Customer aggregates all entities | Entities are in separate databases — no FK across services |

**Additional Entities (not in design but implemented):**
- `membership_plans` — plan types with pricing (payment-service)
- `payment_refunds` — refund tracking (payment-service)
- `TrainerAvailability` — normalised trainer schedule (course-service, better than design)
- `audit_logs` — admin activity logging (payment-service + Admin — duplicated)

---

### Top 3 Issues to Address for Maintenance

1. **Architecture mismatch** — Container diagram needs redraw to reflect hybrid gateway pattern + multiple databases
2. **Duplicate course management** — Admin and course-service both manage courses in separate databases
3. **Inconsistent authentication** — 3 different auth strategies across services

## 3. Reflections on Receiving the Handover Project

### a. Technologies Used

The project utilizes a modern JavaScript/Node.js stack across 5 microservices:
- **Backend**: Node.js with Express.js framework
- **Database**: SQLite with better-sqlite3 driver
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing
- **Security**: Helmet for security headers, CORS for cross-origin requests
- **Validation**: express-validator for input validation
- **Logging**: Morgan for HTTP request logging
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Testing**: Jest and Supertest for unit/integration testing
- **DevOps**: SonarQube for static analysis, Docker DevContainer, npm for package management

Below is a detailed breakdown verified against the actual codebase:

#### Runtime & Language
- **Node.js** v18+ — All 5 backend services
- **JavaScript (ES6+)** — All backend and frontend code
- **HTML5** — 13 frontend `.html` files across services
- **CSS3** (inline `<style>` tags) — Embedded in all HTML files; no separate `.css` files exist

#### Backend Frameworks

| Service | Framework | Version | Location |
|---------|-----------|---------|----------|
| AuthMembership | Express.js | v5.2.1 | `implementations/AuthMembership/backend-api_Module1/package.json` |
| Admin | Express.js | v5.2.1 | `implementations/Admin/package.json` |
| course-service | Express.js | v4.18.2 | `implementations/course-service/package.json` |
| payment-service | Express.js | v5.2.1 | `implementations/payment-service/package.json` |
| reservation-service | Node.js http (raw) | built-in | `implementations/reservation-service/backend/server.js` |

> **Note:** Mixed Express versions — `course-service` uses Express v4 while the others use v5. The `reservation-service` uses raw `http.createServer()` instead of Express.

#### Database

| Driver | Services | Location |
|--------|----------|----------|
| **better-sqlite3** | AuthMembership, course-service, payment-service, reservation-service | Each service's `package.json` |
| **sqlite3** | Admin | `implementations/Admin/package.json` |
| **mysql2** | AuthMembership (listed as dependency) | `implementations/AuthMembership/backend-api_Module1/package.json` |

> **Note:** Mixed SQLite drivers — Admin uses `sqlite3` (async/callback-based) while the other services use `better-sqlite3` (synchronous). AuthMembership also lists `mysql2` as a dependency.

#### Authentication & Security
- **jsonwebtoken** (JWT) — Token-based authentication (AuthMembership, course-service)
- **bcryptjs** — Password hashing (AuthMembership)
- **helmet** — HTTP security headers (AuthMembership, payment-service)

#### Middleware & Utilities
- **cors** — Cross-Origin Resource Sharing (AuthMembership, Admin, course-service, payment-service)
- **express-validator** — Request validation (AuthMembership, course-service, payment-service)
- **morgan** — HTTP request logging (AuthMembership, payment-service)
- **dotenv** — Environment variable loading (AuthMembership, course-service)
- **uuid** — Unique ID generation (AuthMembership, payment-service)

#### Frontend
- **Vanilla HTML/CSS/JavaScript** — No frontend framework (React, Vue, etc.)
- **Google Fonts** — Bebas Neue, Barlow, DM Sans, Space Mono (loaded via CDN)
- **Fetch API** — Native browser `fetch()` for API calls
- **LocalStorage** — Token and user session storage

#### Testing

| Technology | Version | Service |
|------------|---------|---------|
| **Jest** | v29.7.0 | course-service |
| **Supertest** | v6.3.3 | course-service |
| Custom test runner | — | reservation-service |

> **Note:** Only course-service and reservation-service have tests. AuthMembership, Admin, and payment-service have no test setup.

#### Development & DevOps
- **nodemon** v3.0.1 — Auto-restart on file changes (course-service)
- **SonarQube** — Static code analysis (`sonar-project.properties`, `sonar-scanner-cli-5.0.1.3006-linux.zip`)
- **Docker** (DevContainer) — Development environment (`.devcontainer/Dockerfile`, `.devcontainer/devcontainer.json`)
- **Ubuntu Jammy** — Base image for DevContainer
- **Java 17 (OpenJDK)** — Required by SonarQube scanner (installed in DevContainer)
- **GitHub Actions** — CI pipeline (referenced in README but `.github/workflows/` not found locally)
- **Git** — Version control (`.gitignore`)
- **npm** — Package management

### b. Required Information to Successfully Handover the Project
To successfully handover this project, the following information is essential:

1. **Complete Design Documentation**: The C4 model diagrams, use case diagrams, and UML class diagrams are crucial for understanding the intended architecture
2. **Functional Requirements**: Detailed FR and NFR specifications
3. **Constraints**: Especially Constraint 2 (admin access limited to local network) and technology constraints
4. **Database Schema**: Understanding of the data model and relationships
5. **API Documentation**: Endpoint specifications and request/response formats
6. **Environment Setup**: Required Node.js version, dependency installation, environment variables
7. **Deployment Instructions**: How services should be started and configured
8. **Testing Information**: How to run the test suites
9. **Known Issues**: Compilation issues with better-sqlite3 on certain platforms

### c. Code Quality of the Handover Project (SonarQube Analysis)

#### SonarQube Analysis Results

**Overall Project Status:**
- Quality Gate: ✅ **Passed**
- Total Lines of Code: 7.7K
- Security Issues: 2 (Blocker severity)
- Reliability Issues: 135 (Open issues)
- Maintainability Issues: 120 (Open issues)
- Code Coverage: 0.0% (No test coverage metrics)
- Code Duplication: 13.2% (9.1K duplicated lines)

**Breakdown by Category:**

| Category | Severity | Count | Status |
|----------|----------|-------|--------|
| Security | Blocker | 2 | ⚠️ Critical - "Revoke and change compromised password" |
| Reliability | High | - | 135 open issues |
| Maintainability | High | 120 | Issues with cognitive complexity |
| Coverage | - | 0.0% | ❌ No code coverage detected |
| Duplications | - | 13.2% | ~9.1K lines duplicated |

**Analysis Images:**

#### 1. SonarQube Dashboard Overview
<img width="1920" height="878" alt="image" src="https://github.com/user-attachments/assets/2b5882f4-fc99-4139-8378-5d12137672f9" />

*Figure 1: Overall project quality gate status showing Passed status with metrics across Security, Reliability, and Maintainability dimensions*

#### 2. Security Issues Detected
<img width="1920" height="877" alt="image" src="https://github.com/user-attachments/assets/e0ff54d6-5c76-4071-b54d-0d2a19d644b9" />

*Figure 2: Security hotspots identified - Blocker severity issues related to password management in course test file (lines 22-23)*

#### 3. Maintainability Issues
<img width="1920" height="921" alt="image" src="https://github.com/user-attachments/assets/c1f40f19-b123-4328-a3f6-e5e324a79786" />

*Figure 3: High severity maintainability issues - Functions with excessive cognitive complexity requiring refactoring:*
- *Courts.js: Reduce cognitive complexity from 20 to 15 allowed (Line 85 - 10min effort)*
- *Index.html: Reduce cognitive complexity from 18 to 15 allowed (Line 829 - 8min effort)*

**Action Items for Quality Improvement:**

1. **Security (Priority: CRITICAL)**
   - Address the 2 Blocker-severity security issues related to password validation
   - Implement proper password complexity rules and validation
   - Add secure password reset mechanism with verification tokens

2. **Maintainability (Priority: HIGH)**
   - Refactor functions in `implementations/reservation-service/backend/src/routes/courts.js` to reduce cognitive complexity
   - Refactor HTML/JavaScript logic in `implementations/reservation-service/frontend/index.html` to reduce complexity
   - Consider splitting complex functions into smaller, single-responsibility functions

3. **Code Coverage (Priority: MEDIUM)**
   - Expand test coverage from 0% to at least 60%+
   - Add unit tests for critical business logic (payments, reservations, authentication)
   - Add integration tests for API endpoints

<!-- **Recommendations for Future Development:**
- Resolve the better-sqlite3 compilation issues (consider using a pure JavaScript SQLite implementation)
- Implement proper service discovery and inter-service communication
- Add comprehensive API documentation
- Improve error handling and logging consistency
- Consider containerization (Docker) for easier deployment -->

<!-- Overall, the project demonstrates good understanding of modern web development practices and provides a solid foundation for a fitness management system, though the shift from monolithic to microservice architecture during implementation created some architectural inconsistencies. -->
