# Deliverable D3: AI Usage Log

## 1. AI Usage for Architecture and Design
This log documents the interaction with AI tools to assist in the architectural design, C4 modeling, and documentation of the **Fitness Management System** for Phase 1.

| Key Activity/Prompt | AI Tool Usage Summary | Verification Method |
| :--- | :--- | :--- |
| **Context Diagram Creation** | Requested precise English labels for Actors (Customer, Admin) and Systems (Payment, Gate) based on the provided Context Diagram. | Compared AI-generated labels with the project's Functional Requirements. |
| **Container Diagram Structure** | Asked for the specific technical structure (Apps/Stores) and technologies (React, Node, MySQL) needed for the Fitness System's Container Diagram. | Validated that the design covers all required services: Web, Mobile, API, and Database. |
| **IcePanel UI Assistance** | Requested help navigating the IcePanel interface, specifically for "Drill Down" functions and handling "Technology" label warnings. | Manually tested the UI instructions within the IcePanel tool to ensure successful navigation. |
| **Constraint Integration** | Asked for the correct placement and phrasing for "Constraint 2" (Local Admin Access) within the diagram's metadata. | Verified the presence of the note in the Web Application description against the project's constraints list. |
| **Diagram Verification** | Submitted screenshots of the Context and Container diagrams for AI review to ensure compliance with C4 Model Level 2 standards. | Confirmed all external system connections and actor interactions match the initial design rationale. |
| **Privacy Design (QR Code)** | Consulted on integrating a "Digital Anonymous QR-Code" feature for check-ins to address data privacy requirements. | Verified logic against the "Entrance and Attendance Tracking" requirements. |
| **Web Application Component Breakdown** | Requested identification of the four frontend component responsibilities (Admin Dashboard, Course Editor, Report Generator, Public Content Manager) and their mapping to functional requirements (FR 1.2, FR 5.1, FR 8, FR 9). | Cross-referenced each component's role against the Web Application requirements in the project specification to confirm complete FR coverage. |
| **API Application Component Identification** | Asked for the correct decomposition of the API layer into internal service components (Membership & Subscription Engine, Resource Conflict Checker, Attendance & Monitoring Service, Security & Encryption Module) and their individual responsibilities. | Verified that each component maps to at least one functional requirement and one NFR, and that no functional area was left unaddressed. |
| **Component Interaction Mapping** | Consulted AI to clarify the interaction patterns between components — specifically how the Resource Conflict Checker is invoked by both court reservation and course enrollment workflows, and how the Attendance Service emits real-time updates via Socket.io. | Manually traced each interaction against the corresponding use case flows (FR 5.2, FR 7, FR 4) to confirm correctness. |
| **Security Module Scope** | Asked for guidance on defining the Security & Encryption Module's responsibilities at the component level, covering bcrypt password hashing, JWT issuance, and RBAC middleware enforcement across protected routes. | Validated against NFR-01, NFR-02, NFR-03, and Constraint 2 (local-only admin access) to ensure all security requirements were addressed at this layer. |
| **Component Diagram C4 Compliance** | Submitted the component diagram for AI review to confirm adherence to C4 Model Level 3 conventions, including correct depiction of component boundaries, internal interactions, and external dependencies. | Compared the reviewed diagram against the official C4 Model notation guidelines and confirmed alignment with the Container Diagram's defined boundaries. |
| **Single Responsibility Validation** | Asked AI to verify that no two components shared overlapping responsibilities, particularly between the Membership Engine and the Resource Conflict Checker. | Reviewed the responsibility descriptions for all four API components to confirm non-overlapping domains and independent testability. |

## 2. Verification Summary
All AI-generated suggestions, labels, and architectural patterns were manually reviewed and cross-referenced with the official **ITCS383 Project Phase 1 Description** and the **Fitness Management System requirements**. Changes were made to ensure full compliance with the local network constraints (Constraint 2) and professional design standards.



## Overview

This document records the use of AI tools during Phase 1 development of the Bughair project — a Fitness Course Management System built with a Node.js/Express backend and HTML/JavaScript frontend.

AI tools were used as development assistants for selected tasks. All AI-generated outputs were reviewed and verified by team members before being committed to the repository.

| Tool | Purpose |
|------|---------|
| Claude (Anthropic) | Architecture design, backend logic, test generation, documentation |
| ChatGPT (OpenAI) | Frontend UI suggestions, debugging assistance |

---

## Log Entry 1 — Project Architecture and Service Structure

**Task:** Define the overall architecture and folder structure for the Fitness Course Management System  
**AI Tool:** Claude  
**Date:** Week 1  

**Prompt Used:**
```
We are building a Fitness Course Management System for ITCS383 Phase 1.
The system needs to allow members to browse courses, enroll/unenroll,
and allow admins to manage courses and schedules.
What folder structure and service architecture would you recommend?
Suggest a Node.js + Express backend with an HTML/JavaScript frontend.
```

**AI Suggestion Summary:**  
Claude suggested separating the project into `implementations/course-service/` with subdirectories for `backend/`, `frontend/`, and `tests/`. It recommended using Express for routing and serving the frontend as static HTML.

**Accepted:**  
- Overall folder structure (`backend/`, `frontend/`, `tests/` under `course-service/`)
- Express-based backend with separate route files
- Static HTML frontend pattern

**Rejected:**  
- Suggestion to use a class-based service layer — team kept plain function-based modules for simplicity

**Verification:**  
- Structure reviewed against project requirements by all team members
- Repository scaffolded and confirmed buildable before further development

---

## Log Entry 2 — Backend Route Implementation

**Task:** Implement backend API routes for course listing, enrollment, and admin operations  
**AI Tool:** Claude  
**Date:** Week 2–3  

**Prompt Used:**
```
Write Express.js route handlers for a Fitness Course Management System.
Required endpoints:
- GET /courses — list all courses
- GET /courses/:id — get course detail
- POST /enroll — enroll a member in a course (require JWT auth)
- DELETE /enroll/:courseId — unenroll a member (require JWT auth)
- POST /admin/courses — create a new course (admin only)
- PUT /admin/courses/:id — update course info (admin only)
- DELETE /admin/courses/:id — delete a course (admin only)
Use JWT middleware for authentication. Respond with JSON.
```

**AI Suggestion Summary:**  
Claude generated route handler skeletons with JWT middleware (`verifyToken`, `requireAdmin`), basic input validation, and structured JSON responses.

**Accepted:**  
- Route handler structure and HTTP method conventions
- JWT middleware pattern (`Authorization: Bearer <token>`)
- Consistent JSON response format

**Rejected / Modified:**  
- AI placed all routes in one file — team split into `courseRoutes.js` and `adminRoutes.js` for clarity
- Added null-checks that AI omitted on `req.user.id`

**Verification:**  
- Routes tested manually using curl and browser fetch calls
- Confirmed correct HTTP status codes for valid and invalid requests
- Verified JWT validation correctly rejects requests without a valid token

---

## Log Entry 3 — Frontend UI (index.html)

**Task:** Build the main course browsing and enrollment UI in a single HTML file  
**AI Tool:** Claude + ChatGPT  
**Date:** Week 3–4  

**Prompt Used:**
```
Create a single-page HTML/JavaScript frontend for a Fitness Course Management System.
Features needed:
- Display a list of fitness courses (name, schedule, instructor, capacity)
- Show enrollment status per course for the logged-in member
- Enroll / Unenroll buttons that call the backend API
- Filter by day or time
- Show a conflict warning if the member is already enrolled in an overlapping time slot
```

**AI Suggestion Summary:**  
Claude generated a complete `index.html` with inline CSS and JavaScript, a `renderCourses()` function handling enrollment state, schedule formatting, and conflict detection.

**Accepted:**  
- HTML structure and layout
- `renderCourses()` function pattern
- Schedule formatting using `toLocaleDateString` / `toLocaleTimeString`

**Rejected / Modified:**  
- The AI-generated `renderCourses()` function had a cognitive complexity of 19, exceeding the SonarQube threshold of 15 — later flagged as a **High** maintainability issue at L532. Noted for remediation in Phase 2.
- Inline styles were partially reorganised into a `<style>` block

**Verification:**  
- Frontend loaded and rendered correctly in the browser
- Enrollment and unenroll actions tested with mock data
- Conflict detection verified manually with overlapping schedules

---

## Log Entry 4 — Frontend with API Integration (index_with_api.html)

**Task:** Create a version of the frontend that connects to the live backend API  
**AI Tool:** Claude  
**Date:** Week 4  

**Prompt Used:**
```
Adapt the existing index.html to connect to the backend Express API.
Replace mock data with fetch() calls to:
- GET /courses to load course list
- POST /enroll and DELETE /enroll/:id for enrollment actions
Include JWT token handling (store token in memory, attach as Bearer header).
```

**AI Suggestion Summary:**  
Claude produced `index_with_api.html` with `fetch()` calls, Bearer token injection, and error handling for failed API calls.

**Accepted:**  
- `fetch()` pattern with Authorization header
- Error display on failed requests

**Rejected / Modified:**  
- AI suggested storing JWT in `localStorage` — team kept it in a JavaScript variable (in-memory) to avoid browser storage issues in the deployment environment
- Rendering function retained from the static version, also flagged by SonarQube at L569 for the same cognitive complexity issue

**Verification:**  
- Tested end-to-end: login → fetch courses → enroll → verify updated state
- Confirmed token attached correctly on each request
- Checked that unauthenticated requests return 401

---

## Log Entry 5 — Unit Tests (course.test.js)

**Task:** Write Jest unit tests for the course service backend  
**AI Tool:** Claude  
**Date:** Week 5  

**Prompt Used:**
```
Write Jest unit tests for a Node.js Express course service.
Test the following:
- GET /courses returns a list of courses
- POST /enroll succeeds for a valid member JWT
- POST /enroll fails with 401 for no token
- POST /admin/courses succeeds for an admin JWT
- POST /admin/courses fails with 403 for a member JWT
Mock the database using jest.fn(). Use supertest for HTTP testing.
```

**AI Suggestion Summary:**  
Claude generated test scaffolding with `supertest`, `jest.fn()` mocks for `db.prepare()`, and sample JWT tokens for member and admin roles.

**Accepted:**  
- Overall test structure and supertest pattern
- `mockPrepare` helper function
- Test coverage for authentication and authorisation scenarios

**Rejected / Modified:**  
- AI hard-coded the JWT secret as `'fitness_secret_key'` in `memberToken` (L20) and `adminToken` (L21). This was flagged by SonarQube as two **Blocker** security issues (rule `javascript:S6437`). Documented in D4 with a remediation plan to replace with `process.env.JWT_SECRET`.

**Verification:**  
- Tests executed using `npm test`
- All test cases reviewed and results confirmed manually
- SonarQube flagged the hard-coded secret — documented in D4

---

## Log Entry 6 — GitHub Actions CI Pipeline

**Task:** Set up GitHub Actions workflow to build, test, and run SonarQube analysis on each push  
**AI Tool:** Claude  
**Date:** Week 6  

**Prompt Used:**
```
Write a GitHub Actions workflow YAML for a Node.js project that:
1. Runs on push to master
2. Installs dependencies with npm install
3. Runs tests with npm test
4. Runs SonarQube scan using sonar-scanner
The SonarQube server URL and token will be stored as GitHub Secrets.
```

**AI Suggestion Summary:**  
Claude generated a `.github/workflows/ci.yml` with `actions/checkout`, `actions/setup-node`, npm install/test steps, and a SonarQube scan step.

**Accepted:**  
- Workflow structure
- Node.js setup and npm test steps
- SonarQube scan step referencing GitHub Secrets

**Rejected / Modified:**  
- Removed AI-suggested coverage step as `lcov` output was not configured in Phase 1
- Changed branch trigger from `main` to `master` to match the repository default branch

**Verification:**  
- Workflow triggered on commit to master
- GitHub Actions logs reviewed to confirm build and test steps passed
- SonarQube analysis confirmed to report to the hosted SonarQube instance

---

## Log Entry 7 — README Documentation

**Task:** Write the root `README.md` with setup, build, and run instructions  
**AI Tool:** Claude  
**Date:** Week 7  

**Prompt Used:**
```
Write a README.md for a Fitness Course Management System built with Node.js/Express
backend and HTML/JavaScript frontend. Include:
- Project overview
- Setup requirements (Node.js version, npm)
- Installation steps (npm install)
- How to run the backend server
- How to access the frontend
- Example usage
- Default port and local URL
```

**AI Suggestion Summary:**  
Claude generated a structured README with sections for Overview, Prerequisites, Installation, Running, and Usage.

**Accepted:**  
- Overall structure and section headings
- Command examples (`npm install`, `npm start`, `npm test`)

**Modified:**  
- Updated port number and URL to match the actual implementation
- Added SonarQube setup section specific to the team's hosted instance

**Verification:**  
- README reviewed by all team members
- Build and run commands verified by following the README steps on a clean environment

---

## Summary

| # | Task | Tool | Accepted | Rejected / Modified | Verified By |
|---|------|------|----------|---------------------|-------------|
| 1 | Architecture & folder structure | Claude | Structure, routing pattern | Class-based layer | Manual review |
| 2 | Backend routes | Claude | Route handlers, JWT middleware | Null-checks, file split | REST client testing |
| 3 | Frontend UI (index.html) | Claude + ChatGPT | HTML layout, renderCourses() | High complexity, inline styles | Browser testing |
| 4 | Frontend with API (index_with_api.html) | Claude | fetch() pattern, auth headers | localStorage → in-memory | End-to-end testing |
| 5 | Unit tests (course.test.js) | Claude | Test structure, mock pattern | Hard-coded JWT secret (→ D4) | npm test + SonarQube |
| 6 | GitHub Actions CI | Claude | Workflow structure, scan step | Coverage step, branch name | Actions logs |
| 7 | README | Claude | Structure, commands | Port/URL, SonarQube section | Manual walkthrough |

All AI-generated outputs were reviewed by at least one team member before being committed to the repository. Where AI suggestions introduced issues (hard-coded secrets, excessive cognitive complexity), these were identified via SonarQube and documented in D4 with remediation plans.
