# Deliverable D1: Design Models and Design Rationale

## 1. Introduction
The **Fitness Management System** is designed to provide a robust foundation for managing gym memberships, class enrollments, and facility reservations. This document details the architectural decisions made for the **v1.0 release**, focusing on construction quality, automation, and long-term maintainability.

---

## 2. C4 Container Diagram (Level 2)
The system is decomposed into four primary containers to ensure a clear separation of concerns, supporting both modular development and future system evolution.

### 2.1 Container Descriptions and Responsibilities
* **Web Application (React.js)**:
    * **Responsibility**: Provides the primary interface for **Customers** to manage accounts and for **Administrators** to oversee gym operations, manage courses, and generate financial reports.
    * **Constraint Handling**: In compliance with **Constraint 2**, administrative access is restricted to the local fitness center network to ensure data security.
* **Mobile Application (Flutter)**:
    * **Responsibility**: Offers on-the-go access for members to book trainers, reserve badminton courts, and view promotional content.
    * **Privacy Feature**: Includes a **Digital Anonymous QR-Code** module for secure check-ins, protecting member identity while validating entrance through the physical gate system.
* **API Application (Node.js/Express)**:
    * **Responsibility**: The central logic hub processing business rules, membership renewals, payment flows, and reservation conflict detection.
    * **External Integration**: Manages secure communication with the **Payment Gateway System**, **TrueMoney Wallet API**, and the **Entrance Gate System**.
* **Database (MySQL)**:
    * **Responsibility**: Acts as the persistent data store for unique member IDs, membership statuses, transaction logs, and resource availability.
    * **Data Integrity**: Maintains ACID properties to prevent double-booking of the five badminton courts and ensures consistent financial record-keeping.

---

## 3. Design Rationale

### 3.1 Architectural Justification
* **Decoupled Architecture**: Separating the frontend (Web/Mobile) from the backend API allows for independent scaling and ensures that UI updates do not compromise core business stability.
* **Centralized Security & Logic**: All validation and **Role-Based Access Control (RBAC)** are centralized in the API layer, protecting the system against common web vulnerabilities and ensuring secure integration with third-party providers.
* **Protocol Standardization**: Communication between containers is strictly managed via **HTTPS** and **JSON**, providing a repeatable and secure way to build and release the service.

### 3.2 Support for Key Requirements
* **Attendance Tracking**: The design supports real-time entry and exit logging by directly processing member ID data transmitted from the **Entrance Gate System**.
* **Booking Conflict Detection**: The API and Database layers are optimized to detect and prevent schedule conflicts for both course enrollments and court reservations in real-time.
* **24/7 Availability**: The distributed container structure ensures high system uptime and supports real-time data updates required for a continuous fitness environment.

---

## 4. Relation to Future Evolution
This foundation is built to be maintainable as requirements evolve in Phase 2. The modularity of the containers allows for future expansion, such as integrating additional fitness branches or expanding the pool of trainers without significant architectural redesign.