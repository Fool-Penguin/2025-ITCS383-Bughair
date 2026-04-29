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


# D3: Change Request Analysis

This document breaks down the required new features (Native Android App, Member Profile Edit & Password Recovery, and Trainer Rating and Review System) into specific Change Requests (CRs). The CRs are categorized logically by maintenance type: Adaptive, Perfective, Corrective, and Preventive.

## 1. Adaptive Maintenance

### CR-01: Native Android Client UI Development
| Attribute | Description |
|---|---|
| **Associated Feature** | Native Android Mobile App (Feature 1) |
| **Description** | "Existing web application features must be ported to a native Android application to expand platform availability. This covers the client-side UI and logic." |
| **Maintenance Type** | Adaptive |
| **Priority** | High |
| **Severity** | Critical |
| **Marketing Justification** | "Required to capture the mobile market share. Fitness members increasingly expect a mobile app to book and manage sessions." |
| **Time to Implement** | 2.0 person-weeks |
| **Verification Method** | End-to-end UI testing on Android emulators and physical devices. |

### CR-02: Backend API Authentication Adaptation
| Attribute | Description |
|---|---|
| **Associated Feature** | Native Android Mobile App (Feature 1) |
| **Description** | "Backend authentication logic must be updated to support mobile clients securely (e.g., transitioning to JWT or adding mobile-friendly token auth)." |
| **Maintenance Type** | Adaptive |
| **Priority** | High |
| **Severity** | Critical |
| **Marketing Justification** | "Essential architectural update to allow the new Android app to securely communicate with the existing backend without relying on browser cookies." |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | API unit testing for token generation and verification, and integration tests from the mobile client. |

## 2. Perfective Maintenance

### CR-03: Member Profile Edit Interface and API
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password Recovery System |
| **Description** | "Add functionality for users to edit their profile information (name, phone number, and profile picture). Includes frontend form and backend API changes." |
| **Maintenance Type** | Perfective |
| **Priority** | Medium |
| **Severity** | Major |
| **Marketing Justification** | "Allows users to keep their contact information up to date, improving personalization and ensuring the gym can contact them when necessary." |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Manual UI testing for data updates and automated backend validation tests. |

### CR-04: Password Recovery Mechanism
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password Recovery System |
| **Description** | "Implement 'Forgot Password' feature, including generating secure reset tokens, sending recovery emails, and updating the password via a secure link." |
| **Maintenance Type** | Perfective |
| **Priority** | High |
| **Severity** | Major |
| **Marketing Justification** | "Provides self-service recovery, reducing customer support tickets and preventing users from permanently losing access to their accounts." |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Automated integration testing for email dispatch and manual testing of the full reset flow. |

### CR-05: Trainer Rating and Review Submission
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Develop the database schema, backend API, and frontend interface to allow members to submit a 1-5 star rating and text feedback for trainers." |
| **Maintenance Type** | Perfective |
| **Priority** | High |
| **Severity** | Major |
| **Marketing Justification** | "Enhances community engagement and provides valuable feedback to management regarding trainer performance." |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Functional testing of review submission and database insertion verification. |

### CR-06: Trainer Profile Rating Display
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Update the trainer profile UI to display the calculated average rating and a list of previous member reviews." |
| **Maintenance Type** | Perfective |
| **Priority** | Medium |
| **Severity** | Minor |
| **Marketing Justification** | "Helps new members confidently select trainers based on peer feedback, increasing private session bookings." |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | UI testing to ensure average ratings calculate correctly and reviews display properly. |

## 3. Corrective Maintenance

### CR-07: Fix Unmodifiable Static Profile Data
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password Recovery System |
| **Description** | "User profiles are currently static and missing parts of the User Management system, leading to inaccurate real-life data in the system." |
| **Maintenance Type** | Corrective |
| **Priority** | Medium |
| **Severity** | Major |
| **Marketing Justification** | "Inaccurate user data causes missed communications and billing issues. Fixing this makes the User Management system functional for real life." |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Inspect database records before and after profile updates to confirm persistence. |

### CR-08: Prevent Duplicate Trainer Reviews
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "The rating system must not allow duplicate reviews from the same member for the same session, which would skew the average rating." |
| **Maintenance Type** | Corrective |
| **Priority** | Medium |
| **Severity** | Major |
| **Marketing Justification** | "Inaccurate trainer ratings degrade trust in the platform and cause complaints from trainers about unfair scores." |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Database constraint testing and API tests ensuring duplicate submissions are rejected. |

## 4. Preventive Maintenance

### CR-09: Review Submission Session Validation
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Implement validation to ensure only members who have booked and completed a private session can submit a review for that trainer." |
| **Maintenance Type** | Preventive |
| **Priority** | Medium |
| **Severity** | Major |
| **Marketing Justification** | "Prevents review spam from bots or non-clients, protecting the platform's reputation and ensuring fairness for trainers." |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Integration testing simulating review submissions from accounts with and without completed sessions. |

### CR-10: Administrative Content Moderation Tools
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Add an administrative interface to manage, edit, or delete inappropriate review content submitted by users." |
| **Maintenance Type** | Preventive |
| **Priority** | Low |
| **Severity** | Minor |
| **Marketing Justification** | "Prevents potential legal liability or platform toxicity by providing tools to quickly remove offensive or policy-violating content." |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Manual testing of admin dashboard privileges and content deletion functionality. |

### CR-11: Rate Limiting on Password Recovery
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password Recovery System |
| **Description** | "Implement rate limiting on the 'Forgot Password' endpoint to prevent abuse." |
| **Maintenance Type** | Preventive |
| **Priority** | Medium |
| **Severity** | Major |
| **Marketing Justification** | "Prevents malicious actors from using the endpoint for email spamming or brute-force user enumeration attacks." |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Automated tests simulating multiple rapid password reset requests to ensure rate limiting engages. |

