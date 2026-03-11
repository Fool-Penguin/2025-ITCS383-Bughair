# Fitness Management System
## Deliverable D1: Design Models and Design Rationale

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Use Case Diagram](#4-use-case-diagram)
5. [C4 Model — Level 1: System Context Diagram](#5-c4-model--level-1-system-context-diagram)
6. [C4 Model — Level 2: Container Diagram](#6-c4-model--level-2-container-diagram)
7. [C4 Model — Level 3: Component Diagrams](#7-c4-model--level-3-component-diagrams)
8. [UML Class Diagram](#8-uml-class-diagram)
9. [Integrated Design Rationale](#9-integrated-design-rationale)

---

## 1. Introduction

The **Fitness Management System (FMS)** is a comprehensive, web-based software solution designed to automate and streamline the daily operations of a fitness center. The system centralises membership lifecycle management, course scheduling, personal trainer bookings, badminton court reservations, attendance tracking, and financial reporting into a single, integrated platform.

> **Scope:** The v1.0 release targets a single fitness branch, operating 24/7. Implementation priorities are: **(1)** Membership & Payment, **(2)** Course Management, **(3)** Usage Monitoring. Administrative access is restricted to on-premises machines only.

---

## 2. Functional Requirements

### 2.1 User Management

#### 2.1.1 Customer Account

- The system shall allow a customer to register an account and select a membership type during registration.
- The system shall allow a customer to log in and log out securely.
- The system shall allow a customer to reset their password and update profile information.
- The system shall assign a unique **Member ID** to each registered customer.

#### 2.1.2 Administrator Account

- The system shall allow an administrator to log in to the backend system.
- The system shall restrict backend access to authorized administrators only.
- The system shall allow an administrator to manage customer data.
- The system shall log all administrative activities for auditing purposes.

---

### 2.2 Membership Management

- The system shall support two membership types: **Free Membership** and **Paid Membership**.
- Paid membership shall be available in **Monthly** and **Yearly** plans.
- The system shall automatically renew monthly memberships through recurring payments.
- The system shall record membership start and expiration dates.
- The system shall restrict features based on membership type, and allow customers to renew or upgrade.

---

### 2.3 Payment

- The system shall support payments via **Credit Card**, **PayPal**, and **TrueMoney Wallet**.
- The system shall securely process all online payments and record all transactions.

---

### 2.4 Entrance and Attendance Tracking

- The system shall record member **entry and exit times** when a valid Member ID is entered at the entrance keypad.
- The system shall maintain attendance logs and generate attendance reports for administrators.
- Entry and exit records shall be transmitted in real time to the backend system.

---

### 2.5 Course Management

#### 2.5.1 Course Administration

- The system shall allow administrators to create, edit, publish, unpublish, and delete courses.
- Course details shall include: name, schedule, instructor, maximum attendees, type, and fitness level.
- The system shall require a reason when a course is cancelled.

#### 2.5.2 Course Enrollment

- The system shall allow members to view available courses and enroll in them.
- The system shall prevent enrollment when a course is at full capacity.
- The system shall detect and prevent schedule conflicts for members.
- The system shall record attendance for enrolled courses and produce attendance reports.

---

### 2.6 Private Training Management

- The system shall maintain a directory of private trainers, including expertise and availability.
- Administrators shall be able to add, edit, and delete trainer profiles.
- Members shall be able to view and filter trainer profiles by expertise, and book private sessions.
- The system shall prevent booking time conflicts.

---

### 2.7 Badminton Court Reservation

- The system shall manage **five badminton courts** and allow only members to reserve them.
- The system shall prevent double-booking and member schedule conflicts.
- Administrators shall be able to set maintenance periods that block all reservations.

---

### 2.8 Content and Promotion Management

- Administrators shall be able to create, publish, and update promotional content.
- Customers shall be able to view promotions, general information, and event/course details.

---

### 2.9 Usage Monitoring and Reporting

- The system shall display the real-time number of members inside the fitness center.
- The system shall identify peak and low-peak usage periods and generate usage statistics.
- An administrator dashboard shall provide data visualisation and support financial and membership report generation.

---

## 3. Non-Functional Requirements

| ID | Requirement | Category |
|----|-------------|----------|
| NFR-01 | User passwords shall be encrypted using industry-standard hashing algorithms. | Security |
| NFR-02 | All communications shall use HTTPS with TLS encryption. | Security |
| NFR-03 | Role-based access control shall be enforced across all system endpoints. | Security |
| NFR-04 | The system shall protect against common web vulnerabilities (OWASP Top 10). | Security |
| NFR-05 | Third-party payment integrations shall use secure API tokens and HTTPS. | Security |
| NFR-06 | The system shall operate 24 hours per day, 7 days per week. | Availability |
| NFR-07 | The system shall support real-time data updates for attendance and court status. | Availability |
| NFR-08 | The system shall handle multiple concurrent users without significant performance degradation. | Performance |
| NFR-09 | Payment processing shall complete within an acceptable response time. | Performance |
| NFR-10 | Booking conflict detection shall operate in real time. | Performance |
| NFR-11 | The system shall provide a responsive, user-friendly interface accessible via browser and mobile. | Usability |
| NFR-12 | The system shall support future expansion to additional trainers, members, and branches. | Scalability |
| NFR-13 | The system shall ensure data consistency (ACID) during all transactions. | Reliability |
| NFR-14 | The system shall prevent duplicate payments and double bookings. | Reliability |

### 3.1 Constraints

- The backend system shall operate on a maximum of **two machines** within the fitness center premises only.
- Administrators shall not be permitted to access the backend system from outside the fitness center.
- The system shall integrate with **TrueMoney Wallet** as a mandatory payment channel.
- The system shall operate continuously in a 24/7 environment with no planned downtime windows.
- Implementation priority shall follow: (1) Membership & Payment → (2) Course Management → (3) Usage Monitoring.

### 3.2 Assumptions

- Each member has a unique identification number that can be entered at the entrance keypad.
- The fitness center maintains a stable internet connection at all times.
- All third-party payment providers expose documented integration APIs.
- The entrance hardware system is capable of transmitting Member ID data to the software system.
- The system initially supports a single fitness branch.

---

## 4. Use Case Diagram

![Use Case Diagram](https://github.com/user-attachments/assets/91d3398d-f502-4cc1-b404-776e9ae99563)

The Use Case diagram defines the boundary of the Fitness Management System and identifies the interactions between external actors and the system's functional capabilities. It serves as the primary bridge between stakeholder expectations and the technical design, establishing the scope of what the system must accomplish for each user role.

### 4.1 Actors and Their Roles

**Customer** — General users and registered members who consume fitness services. Customers register accounts, manage memberships, enroll in courses, book trainers, and reserve badminton courts.

**Administrator** — Fitness staff responsible for system data management and operational oversight. Administrators manage all entity types (members, courses, trainers, courts, promotions) and generate reports.

**Payment Provider** — An external actor representing the integrated third-party payment processing services (Payment Gateway and TrueMoney Wallet). This actor processes all financial transactions initiated by the Customer.

### 4.2 Key Use Cases and Requirement Traceability

| Use Case | Actor(s) | Requirement |
|----------|----------|-------------|
| Register an Account | Customer | FR 1.1 |
| Select Membership Type `<<include>>` | Customer | FR 1.1, FR 2 |
| Log In / Log Out | Customer, Admin | FR 1.1, FR 1.2 |
| Update Profile | Customer | FR 1.1 |
| Renew / Upgrade Membership | Customer | FR 2 |
| Make Payment `<<include>>` | Payment Provider | FR 3 |
| View Courses and Contents | Customer | FR 5.2, FR 8 |
| Enroll in Courses | Customer | FR 5.2 |
| View Trainer Profiles | Customer | FR 6 |
| Filter Trainers by Expertise `<<extend>>` | Customer | FR 6 |
| Book Private Training Sessions | Customer | FR 6 |
| View and Reserve Courts / Time Slots | Customer | FR 7 |
| Reserve Badminton Courts `<<include>>` | Customer | FR 7 |
| Manage Customer Data | Administrator | FR 1.2 |
| Manage Courses | Administrator | FR 5.1 |
| Manage Trainers & Schedules | Administrator | FR 6 |
| Manage Badminton Courts | Administrator | FR 7 |
| Manage Contents | Administrator | FR 8 |
| Create Financial & Membership Reports | Administrator | FR 9 |

### 4.3 Relationship Notation and Design Rationale

The diagram employs UML use case relationships purposefully to capture dependency and optionality within workflows.

**`<<include>>` relationships** denote mandatory sub-steps that are always executed as part of the base use case:

- **Register an Account** includes **Select Membership Type** — membership selection is a mandatory step during registration (FR 1.1). Customers cannot complete account creation without choosing a plan.
- **Reserve Badminton Courts** includes **View and Reserve Courts and Time Slots** — availability must be verified before a reservation can be confirmed (FR 7), making this a non-optional step.
- **Renew / Upgrade Membership** includes **Make Payment** — a financial transaction is always required when changing membership plans (FR 3).

**`<<extend>>` relationships** denote optional enhancements that add behaviour to a base use case under specific conditions:

- **Filter Trainers by Expertise** extends **View Trainer Profiles** — this is an optional search refinement (FR 6) that activates only when a customer chooses to narrow results by specialisation. Correctly separating the optional filter from the mandatory base flow prevents over-constraining the core browsing experience.

#### 4.3.1 How the Use Case Model Supports Key Design Decisions

The use case model directly informed the decomposition of the system into functional components, establishing clear boundaries and responsibilities:

- **Component Boundaries:** Grouping use cases by domain (User Management, Membership & Payment, Course Management, Trainer Management, Court Reservation) maps directly to the API modules and database entities defined in the C4 diagrams, ensuring alignment between the behavioural specification and structural design.

- **Separation of Concerns:** The distinction between Customer and Administrator actors establishes the need for role-based access control (NFR-03), enforced at the API Application layer through JWT authentication and RBAC middleware.

- **External Integrations:** The Payment Provider actor establishes the integration boundary with the Payment Gateway System and TrueMoney Wallet API, informing the decision to classify these as external systems in the C4 Context Diagram.

- **API Endpoint Design:** Each customer-facing use case corresponds to a REST API endpoint (e.g., `POST /auth/register`, `GET /courses`, `GET /trainers`, `POST /courts/reserve`), while administrator use cases map to protected management routes — directly guiding the API Application's route structure.

---

## 5. C4 Model — Level 1: System Context Diagram

![Context Diagram](https://github.com/user-attachments/assets/ecf93758-990c-4469-8e58-bdb910b9097d)

The C4 Context Diagram provides the highest-level architectural view, defining the Fitness Management System as a black box and identifying all entities that interact with it. It establishes the system's external boundaries and clarifies the nature of each integration, forming the foundation for all lower-level design decisions.

### 5.1 External Actors

#### 5.1.1 Customer

Customers are external actors because they interact with the system's services without being part of its internal implementation. They access the system through the Web Application to register memberships, make payments, enroll in courses, reserve facilities, and view content. This actor's interactions collectively drive the customer-facing functional requirements (FR 1.1, FR 2–3, FR 5.2, FR 6–8).

#### 5.1.2 Administrator

The Administrator (Fitness Staff) is an external actor who interacts with the backend management interface to configure and monitor all operational data — courses, trainers, courts, promotions, and reports. The constraint that administrators can only access the backend from within the fitness center premises (**Constraint 2**) is reflected in the context diagram by the directional relationship to the system, and is enforced at the container level through network restrictions.

### 5.2 External Systems

#### 5.2.1 Payment Gateway System

The Payment Gateway System (supporting Credit Card and PayPal) is classified as external because it is a third-party service with its own internal logic, security infrastructure, and compliance obligations (PCI-DSS). The Fitness Management System sends payment requests and receives transaction confirmation responses (FR 3). Treating this as external reduces the system's security risk and compliance scope, as it does not need to implement or store raw card data.

#### 5.2.2 TrueMoney Wallet API

TrueMoney Wallet is a separate external system despite also being a payment method. It is architecturally distinct from the Payment Gateway because it operates through a dedicated wallet API with different authentication flows. Its explicit separation at the context level — as required by system constraints — signals that a dedicated integration path must be designed at the container level rather than routing it through a generic payment adapter.

#### 5.2.3 Entrance Gate System

The Entrance Gate System is a physical hardware-based access control system that lies outside the software boundary. It captures member identification at the entrance keypad and transmits Member ID data to the Fitness Management System for validation and attendance recording (FR 4). Its external classification is architecturally significant: the software system does not control the hardware's behaviour — it only consumes the data stream transmitted by the gate — a distinction that informs the design of the Attendance & Monitoring Service within the API Application.

### 5.3 Design Rationale: How the Context Diagram Supports Key Decisions

- **Integration Contracts:** By explicitly showing the data exchanged at each boundary — payment requests and confirmations, wallet transactions, and Member ID data streams — the diagram defines the inputs and outputs the API Application must handle, directly informing service and endpoint design.

- **Security Boundaries:** Identifying external systems as separate entities reinforces NFR-02 and NFR-05, requiring HTTPS communication and secure API token management at every integration point. All external communications cross a trust boundary and must be encrypted and authenticated.

- **Technology Constraints:** The separation of TrueMoney Wallet from the general Payment Gateway reflects a real architectural constraint that cannot be absorbed by a single generic payment adapter, justifying two distinct payment integration paths within the API Application.

- **Scope Control:** The context diagram explicitly excludes wallet balance management, payment provider authentication logic, and entrance hardware control from the system's scope, preventing scope creep and ensuring responsibilities remain clearly bounded.

---

## 6. C4 Model — Level 2: Container Diagram

![Container Diagram](https://github.com/user-attachments/assets/489be6d5-b295-4b65-bdfe-b2ea4e3d0b74)

The Container Diagram decomposes the Fitness Management System into its primary deployable units, showing how responsibilities are distributed and how containers communicate with one another and with external systems. This level is the primary architectural blueprint guiding technology choices and deployment configuration.

### 6.1 Container Descriptions and Responsibilities

#### 6.1.1 Web Application (HTML / JavaScript / CSS)

The Web Application is the unified browser-based interface serving both Customer and Administrator roles. It renders the user interface, manages client-side state, and communicates with the API Application exclusively through HTTPS API calls. It implements **no business logic** — all rules (e.g., membership validation before a court reservation) are enforced server-side at the API layer.

**Customer-facing capabilities:** account registration and profile management, membership plan selection, course browsing and enrollment, trainer discovery and booking, and badminton court reservation (Courts 1–5).

**Administrator-facing capabilities:** member data management, course and trainer administration, usage statistics dashboard, real-time court availability monitoring, and report generation.

> **Constraint Alignment:** In compliance with **Constraint 2**, administrative routes are accessible only when the client is connected to the fitness center's local network. This is enforced at the network and application level, not relying solely on UI restrictions.

#### 6.1.2 API Application (Node.js / Express)

The API Application is the system's central hub for all business logic, data processing, and external integrations. It exposes a RESTful API consumed by the Web Application and receives real-time data transmissions from the Entrance Gate System.

| Responsibility | Description |
|----------------|-------------|
| **Business Logic** | Validates membership status before granting access to paid features; processes payment flows for renewal and upgrade; manages recurring billing via scheduled cron jobs. |
| **Conflict Detection** | Real-time prevention of double-booking for badminton courts and enforcement of maximum course capacity (FR 5.2, FR 7). |
| **Attendance Processing** | Receives Member ID data from the Entrance Gate System, validates membership, and records entry/exit timestamps (FR 4). |
| **External Integration** | Manages secure HTTPS communication with the Payment Gateway System and TrueMoney Wallet API, including authentication tokens and response handling (FR 3, NFR-05). |

#### 6.1.3 Database (SQLite via better-sqlite3)

The Database is a lightweight, file-based relational store (`fitness.db`). It provides **ACID-compliant** transaction management, ensuring data consistency during concurrent membership renewals, court reservations, and course enrollments — directly satisfying NFR-13 and NFR-14.

**Key data domains:**

- User profiles, hashed authentication credentials, and role assignments
- Membership records: type, plan, start/expiry dates, renewal status
- Payment transaction logs: method, amount, timestamp, and status
- Attendance logs: Member ID, entry time, and exit time
- Course, trainer, training session, and court reservation data

> **Technology Justification:** SQLite was selected because the system operates on a maximum of two on-premises machines (**Constraint 1**), making a client-server database engine unnecessary. Its file-based nature reduces operational overhead, while `better-sqlite3`'s synchronous API ensures predictable transaction behaviour within a Node.js environment.

### 6.2 Design Rationale: How the Container Diagram Supports Key Decisions

- **Decoupled Architecture:** Separating the Web Application (presentation) from the API Application (business logic) ensures that UI changes do not affect core business rules or database integrity. This supports independent deployment and fulfils the NFR-12 scalability requirement by allowing individual containers to scale independently.

- **Centralised Security Enforcement:** Routing all requests through the API Application creates a single, auditable security perimeter. JWT-based authentication and RBAC (NFR-03) are enforced uniformly at the API layer, preventing unauthorised direct database access.

- **Standardised Communication:** All inter-container communication uses **HTTPS and JSON** (NFR-02), following industry standards for secure, interoperable service communication.

- **Real-Time Capability:** The Attendance & Monitoring Service uses **Socket.io** to push real-time updates (current member count, court status) to the administrator dashboard (NFR-07), eliminating the need for polling-based approaches.

- **Future Evolution:** The modular three-container architecture allows the SQLite database to be replaced with a client-server DBMS, or individual API components to be extracted into microservices in Phase 2, without requiring a system redesign.

---

## 7. C4 Model — Level 3: Component Diagrams

The Component Diagrams decompose each primary container into its constituent components, defining internal structure, individual responsibilities, and inter-component interactions. This level provides the architectural blueprint for developers implementing each module.

### 7.1 Web Application Components

![Web Application Component Diagram](https://github.com/user-attachments/assets/6c439710-9f6d-4952-aa18-48bbc616b00f)

The Web Application is structured into four specialised JavaScript components, each responsible for a distinct functional domain:

#### 7.1.1 Admin Dashboard

The central control panel for fitness staff. It provides a unified view of customer data, membership status, real-time facility occupancy, and key operational metrics. It retrieves member lists, usage statistics, and live attendance counts from the API Application via Socket.io. This component satisfies **FR 1.2** (Administrator Account) and **FR 9** (Usage Monitoring), and enforces **Constraint 2** by rendering administrative controls only within authenticated administrative sessions on the local network.

#### 7.1.2 Course Editor

The administrative interface for creating, modifying, publishing, and deleting fitness courses. Administrators configure course schedules, assign instructors, set maximum attendee counts, and specify course type and fitness level. Upon submission, the Course Editor sends requests to the API Application for validation and persistence. This component satisfies **FR 5.1** (Course Administration).

#### 7.1.3 Report Generator

Processes and visualises operational data retrieved from the API Application. It generates usage statistics, peak/low-peak hour analyses, financial summaries, and membership reports on demand, presented through charts and tabular exports. This component satisfies **FR 9** (Usage Monitoring and Reporting), enabling administrators to meet both operational and financial oversight requirements.

#### 7.1.4 Public Content Manager

Handles the display of promotions, general fitness center information, and event listings for all users — both registered members and unauthenticated visitors. Administrators publish and update promotional material through a content authoring interface within this component. This component satisfies **FR 8** (Content and Promotion Management).

---

### 7.2 API Application Components

![API Application Component Diagram](https://github.com/user-attachments/assets/5865cbc6-7e37-40f9-99b2-d6e85ebfa537)

The API Application is composed of four internal service components that collectively handle all business logic, data access, and external system communication:

#### 7.2.1 Membership & Subscription Engine

Manages the full membership lifecycle: plan creation and selection, upgrade processing, automatic monthly renewal via cron-scheduled recurring payments, and membership status validation. It integrates with both the Payment Gateway System and the TrueMoney Wallet API to process transactions. This component satisfies **FR 2** (Membership Management) and **FR 3** (Payment), and implements ACID transactions (NFR-13) to prevent duplicate charges during renewal processing.

#### 7.2.2 Resource Conflict Checker

A real-time validation service that prevents double-booking of badminton courts and over-enrollment in fitness courses. When a reservation or enrollment request arrives, this component queries the database for time-slot availability and capacity status before permitting the transaction. It satisfies **FR 5.2** (conflict prevention), **FR 7** (double-booking prevention), and **NFR-10** (real-time conflict detection). Its centralised position in the API layer ensures that conflict rules cannot be bypassed by any client.

#### 7.2.3 Attendance & Monitoring Service

Processes real-time data streams from the Entrance Gate System. Upon receiving a Member ID, this component validates the membership, records entry and exit timestamps in the database, and broadcasts the updated occupancy count to connected administrator dashboards via Socket.io. It satisfies **FR 4** (Attendance Tracking) and **NFR-07** (Real-time updates). The push-based Socket.io approach eliminates polling overhead, ensuring immediate dashboard updates as members enter and exit.

#### 7.2.4 Security & Encryption Module

Provides foundational security services to all other API components. It encrypts user passwords using **bcrypt** before storage, issues and validates **JWT tokens** for session management, and enforces **role-based access control** on every protected endpoint. Administrator-only routes are guarded by middleware that validates both the JWT signature and the user's role claim. This component satisfies **NFR-01** (password encryption), **NFR-02** (HTTPS), and **NFR-03** (RBAC), and aligns with **Constraint 2** by authorising only administrator sessions originating from the local network.

### 7.3 Design Rationale: How Component Diagrams Support Key Decisions

- **Single Responsibility:** Each component has a clearly defined, non-overlapping responsibility domain, supporting maintainability and independent testability. The Resource Conflict Checker's logic is isolated from the Membership Engine, meaning changes to conflict rules do not require touching payment processing code.

- **Centralised Rule Enforcement:** Placing the Resource Conflict Checker and Security & Encryption Module within the API Application ensures that business rules cannot be circumvented by manipulating the client-side Web Application, satisfying NFR-03 and NFR-14.

- **Component Interactions:** The Membership Engine calls the Security Module for token validation; the Conflict Checker is invoked by both the Court Reservation and Course Enrollment workflows; the Attendance Service receives external data and emits internal events to the Dashboard. These interaction patterns guided the design of internal service interfaces and event-driven communication.

- **Technology Justification:** Node.js (non-blocking I/O) with Socket.io for real-time push, cron jobs for scheduled renewals, and JWT for stateless authentication constitute a coherent technology selection aligned with the system's concurrency, real-time, and security requirements.

---

## 8. UML Class Diagram

![Class Diagram](https://github.com/user-attachments/assets/1c7c6382-5267-4134-82e4-af97bc0eba88)

The UML Class Diagram defines the static structure of the system's domain model, specifying entities, their attributes, methods, and the relationships between them. It serves as the authoritative blueprint for database schema design and object-oriented implementation.

### 8.1 Core Domain Entities

#### 8.1.1 Customer

The central entity of the domain model. It holds member identity data (`memberID`, `name`, `email`, `password`, `phone`, `address`) and exposes the full set of member-facing operations: `register()`, `login()`, `logout()`, `resetPassword()`, `updateProfile()`, `viewCourses()`, `enrollCourse()`, `bookTrainer()`, and `reserveCourt()`. The Customer aggregates Membership, Attendance, Payment, CourseEnrollment, TrainingSession, CourtReservation, and Promotion — reflecting that all transactional activities are member-centric (FR 1.1, FR 2–3, FR 5.2, FR 6–7).

#### 8.1.2 Administrator

Models system staff accounts with `adminID`, `username`, `password`, and `role`. Its methods cover the full administrative capability set: `manageCustomer()`, `createCourse()`, `editCourse()`, `deleteCourse()`, `publishCourse()`, `manageTrainer()`, `managePromotion()`, and `generateReports()`. Maintaining a separate Administrator class (rather than a shared User class with role flags) enforces the principle of least privilege at the domain model level, directly supporting **NFR-03**.

#### 8.1.3 Membership

Stores subscription state: `membershipID`, `type` (Free/Paid), `plan` (Monthly/Yearly), `startDate`, `expiryDate`, and `status`. The `renewMembership()`, `upgradeMembership()`, and `checkAccess()` methods implement the membership lifecycle and feature-gating logic (FR 2). The `checkAccess()` method is invoked by court reservation, course enrollment, and trainer booking workflows to ensure only eligible members can access paid features.

#### 8.1.4 Payment

Captures all financial transaction data: `paymentID`, `amount`, `paymentMethod`, `paymentDateTime`, and `status`. The `processPayment()` and `recordTransaction()` methods implement the transactional workflow (FR 3). The `paymentMethod` attribute accommodates all three supported channels (Credit Card, PayPal, TrueMoney), and the `status` attribute enables idempotency checks to prevent duplicate payment processing (**NFR-14**).

#### 8.1.5 Attendance

Records member access events: `attendanceID`, `entryTime`, `exitTime`, and `date`. The `recordEntry()` and `recordExit()` methods are invoked by the Attendance & Monitoring Service upon receiving validated signals from the Entrance Gate System (FR 4). The `generateReport()` method supports attendance analytics required by administrators (FR 9).

#### 8.1.6 Course and CourseEnrollment

The **Course** class captures all configurable attributes: `courseID`, `courseName`, `schedule`, `instructor`, `maxAttendees`, `courseType`, `fitnessLevel`, and `status`. Methods `updateCourse()`, `publishCourse()`, and `cancelCourse()` satisfy FR 5.1.

The **CourseEnrollment** association class resolves the many-to-many relationship between Customer and Course, storing `enrollDate` and `attendanceStatus`. Its `enroll()` and `recordAttendance()` methods enforce capacity checks (via the Resource Conflict Checker) and track course attendance (FR 5.2).

#### 8.1.7 Trainer and TrainingSession

The **Trainer** class stores `trainerID`, `name`, `expertise`, and `availabilitySchedule`. Methods `updateAvailability()` and `viewSchedule()` support administrator trainer management (FR 6).

The **TrainingSession** class is a composition of Trainer, capturing `sessionID`, `sessionDate`, `sessionTime`, and `status`. Its `bookSession()` and `cancelSession()` methods implement the private training booking workflow, with availability verified by the Resource Conflict Checker (FR 6).

#### 8.1.8 BadmintonCourt and CourtReservation

The **BadmintonCourt** class models each of the five courts with `courtID`, `courtNumber`, `status` (Available / Booked / Maintenance), and `maintenancePeriod`. Methods `setMaintenance()` and `checkAvailability()` support administrator court management (FR 7).

The **CourtReservation** class is a composition of BadmintonCourt, storing `reservationDate`, `timeSlot`, and `status`. Its `reserveCourt()` and `cancelReservation()` methods implement the member booking workflow, with double-booking prevention enforced by the Resource Conflict Checker (FR 7, **NFR-14**).

#### 8.1.9 Promotion

Stores promotional content with `promotionID`, `title`, `description`, `publishDate`, and `status`. Methods `createPromotion()`, `updatePromotion()`, and `publishPromotion()` satisfy **FR 8** (Content and Promotion Management), and the class is consumed by the Public Content Manager component in the Web Application.

### 8.2 Relationship Notation and Design Rationale

The class diagram employs three distinct relationship types, each carrying specific semantic meaning:

**Aggregation (hollow diamond)** on Customer and Administrator indicates that Membership, Attendance, Payment, Course, Promotion, Trainer, and BadmintonCourt can exist independently of a particular customer or administrator. For example, a Course persists after a Customer who enrolled in it has deleted their account.

**Composition (filled diamond)** on Trainer→TrainingSession and BadmintonCourt→CourtReservation indicates existential dependency. If a Trainer is removed, their associated TrainingSessions are also removed, preventing orphaned booking records. This is implemented as cascading deletes in the database schema.

**Association (plain lines)** between Customer and operational classes (CourseEnrollment, TrainingSession, CourtReservation) reflects the requirement to maintain a complete transactional history per member, supporting audit logging and reporting.

#### 8.2.1 How the Class Diagram Supports Key Design Decisions

- **Database Schema Derivation:** Each class maps directly to a database table. Attributes become columns, associations become foreign keys, and composition relationships enforce cascading delete constraints, ensuring referential integrity (**NFR-13**).

- **API Contract Definition:** Class methods define the operations that API endpoints must expose. For example, `Customer.reserveCourt()` maps to `POST /courts/reserve`; `Administrator.generateReports()` maps to `GET /reports`; `Membership.checkAccess()` is invoked as middleware on protected routes.

- **Business Rule Encoding:** The `maxAttendees` attribute on Course, the `status` attribute on BadmintonCourt, and the `checkAccess()` method on Membership encode business rules directly in the domain model, ensuring the implementation enforces these constraints rather than relying on ad-hoc validation.

- **Separation of Roles:** Distinct Customer and Administrator classes simplify security auditing and directly support **NFR-03** by making role boundaries explicit at the domain model level.

---

## 9. Integrated Design Rationale

This section synthesises how the complete set of design models collectively supports the system's architectural decisions and maintains traceability from requirements through to implementation.

### 9.1 Architectural Style Justification

The system adopts a **three-tier, decoupled architecture** (Presentation → API → Data) rather than a monolithic or microservices approach:

- **Operational Context:** With a maximum of two on-premises machines (**Constraint 1**) and a single fitness branch, a full microservices architecture would introduce unnecessary operational complexity. The three-tier approach provides modularity without distributed systems overhead.
- **Maintainability:** UI changes (Web Application) do not affect business logic (API Application), and schema changes (Database) are encapsulated behind the API layer, reducing coupling.
- **Security:** Centralising all business logic and security enforcement in the API Application creates a single, auditable security perimeter, simplifying compliance with NFR-01 through NFR-05.
- **Scalability Path:** The architecture can evolve incrementally — SQLite can be replaced with a client-server DBMS, and individual API components can be extracted into microservices in Phase 2 — without requiring a system redesign.

### 9.2 Model-to-Requirement Traceability Matrix

| Design Model | Requirements Addressed | Key Design Decision Supported |
|---|---|---|
| Use Case Diagram | FR 1–9 (all functional domains) | System scope, actor roles, component boundary identification, API endpoint design |
| C4 Context Diagram (L1) | FR 3, FR 4; NFR-02, NFR-05; Constraints 1–2 | External integration contracts, security boundaries, scope control |
| C4 Container Diagram (L2) | All FR; NFR-01–NFR-14; All Constraints | Three-tier decoupled architecture, technology selection, deployment configuration |
| Web App Component Diagram (L3) | FR 1.2, FR 5.1, FR 8, FR 9 | Frontend component separation, admin vs. customer UI boundaries |
| API App Component Diagram (L3) | FR 2–4, FR 5.2, FR 6–7; NFR-01–NFR-10, NFR-14 | Business logic centralisation, RBAC, real-time processing, conflict detection |
| UML Class Diagram | All FR; NFR-13, NFR-14 | Database schema design, API contract definition, business rule encoding |

### 9.3 Future Evolution

The v1.0 architecture is designed as a stable foundation for Phase 2 expansion. The modular container structure and domain-driven class model support the following evolutionary paths without requiring a complete redesign:

- **Multi-Branch Support:** The database schema can be extended with a `Branch` entity, and the API Application augmented with branch-scoped data access controls and routing.
- **Advanced Analytics:** A dedicated analytics service or data warehouse can be integrated at the container level, consuming data from the existing database without modifying the Web Application or API logic.
- **Mobile Application:** The API Application's RESTful interface can serve a native mobile client without modification, as all business logic is already decoupled from the Web Application's presentation layer.
- **Database Migration:** Transitioning from SQLite to a client-server database (e.g., PostgreSQL or MySQL) requires only changes to the database container and connection configuration within the API Application, with no impact on the Web Application or external integrations.

---

## Appendix A — Glossary

| Term | Definition |
|------|------------|
| ACID | Atomicity, Consistency, Isolation, Durability — properties of reliable database transactions. |
| API | Application Programming Interface — a defined contract for inter-service communication. |
| C4 Model | A hierarchical architectural notation (Context, Container, Component, Code) for describing software systems. |
| HTTPS | HyperText Transfer Protocol Secure — HTTP with TLS encryption. |
| JWT | JSON Web Token — a compact, self-contained token for stateless authentication. |
| RBAC | Role-Based Access Control — access rights granted based on user roles. |
| REST | Representational State Transfer — an architectural style for HTTP-based APIs. |
| Socket.io | A JavaScript library for real-time, bi-directional event-based communication. |
| SQLite | A lightweight, file-based, serverless relational database engine. |
| TrueMoney Wallet | A Thai digital wallet payment platform integrated as a mandatory payment channel. |
| UML | Unified Modelling Language — a standardised notation for software design models. |
