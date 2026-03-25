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
- Password reset and profile management
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

### Implementation Analysis

#### Architectural Consistency
**Consistent Aspects:**
- The system uses Node.js/Express for backend API development as specified
- SQLite database is used for data persistence
- RESTful API design with JSON responses
- JWT-based authentication and RBAC
- Real-time features using Socket.io (mentioned in design)

**Inconsistencies:**
- **Microservices vs Monolithic**: The design specifies a single API Application container, but the implementation is split into 5 separate services:
  - Admin service
  - AuthMembership service
  - course-service
  - payment-service
  - reservation-service
- **Service Integration**: The AuthMembership service attempts to import and integrate other services, creating tight coupling rather than loose microservice architecture
- **Database Distribution**: Each service maintains its own database logic, contrary to the single Database container in the design

#### Component-Level Verification

**Web Application Components:**
- **Admin Dashboard**: Partially implemented in Admin/front/ with HTML files for course, customer, promotion, and report management
- **Course Editor**: Basic HTML forms in Admin/front/course.html
- **Report Generator**: Admin/front/report.html for basic reporting
- **Public Content Manager**: Limited implementation across various HTML files

**API Application Components:**
- **Membership & Subscription Engine**: Implemented in AuthMembership service with user registration, login, and membership management
- **Resource Conflict Checker**: Partially implemented in course-service and reservation-service for enrollment/course conflicts
- **Attendance & Monitoring Service**: Implemented in reservation-service with basic attendance tracking
- **Security & Encryption Module**: JWT and bcrypt implemented across services

#### Technology Stack Verification
**Design Specifications:**
- Node.js/Express for API
- SQLite with better-sqlite3
- HTML/JavaScript for frontend
- JWT for authentication
- bcrypt for password hashing

**Implementation Reality:**
- Node.js/Express: ✓ Used
- better-sqlite3: ✓ Used but compilation issues on Windows
- HTML/JS frontend: ✓ Used
- JWT/bcrypt: ✓ Implemented
- Additional libraries: express-validator, helmet, cors, morgan for security and validation

#### Updated C4 Diagram
Based on implementation analysis, the C4 Level 2 Container diagram should be updated as follows:

```
[Customer] --> [Web Application (HTML/JS)]
[Administrator] --> [Web Application (HTML/JS)]

[Web Application] --> [AuthMembership Service (Node.js)]
[Web Application] --> [Course Service (Node.js)]
[Web Application] --> [Payment Service (Node.js)]
[Web Application] --> [Reservation Service (Node.js)]
[Web Application] --> [Admin Service (Node.js)]

[AuthMembership Service] --> [SQLite Database]
[Course Service] --> [SQLite Database]
[Payment Service] --> [SQLite Database]
[Reservation Service] --> [SQLite Database]
[Admin Service] --> [SQLite Database]

[Payment Service] --> [Payment Gateway System]
[Payment Service] --> [TrueMoney Wallet API]
[Reservation Service] --> [Entrance Gate System]
```

This reflects the actual microservice architecture rather than the monolithic design.

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
Based on the SonarQube analysis provided in Bughair_D4_QualityReport.md:

**Quality Metrics:**
- The project has undergone static code analysis with SonarQube
- Code coverage and quality metrics have been measured
- Security vulnerabilities and code smells have been identified

**Key Findings:**
- The implementation shows reasonable code quality.
- Some areas for improvement in code maintainability and security
- Test coverage exists but may need expansion
- The microservice architecture introduces complexity that wasn't in the original design

<!-- **Recommendations for Future Development:**
- Resolve the better-sqlite3 compilation issues (consider using a pure JavaScript SQLite implementation)
- Implement proper service discovery and inter-service communication
- Add comprehensive API documentation
- Improve error handling and logging consistency
- Consider containerization (Docker) for easier deployment -->

<!-- Overall, the project demonstrates good understanding of modern web development practices and provides a solid foundation for a fitness management system, though the shift from monolithic to microservice architecture during implementation created some architectural inconsistencies. -->