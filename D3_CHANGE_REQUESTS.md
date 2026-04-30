# D3: Change Request Analysis

This document breaks down the required new features (Native Android App, Member Profile Edit & Password Recovery, and Trainer Rating and Review System) into specific Change Requests (CRs). The CRs are categorized logically by maintenance type: Adaptive, Perfective, Corrective, and Preventive.

## 1. Adaptive Maintenance

### CR-01: Backend API Authentication Adaptation
| Attribute | Description |
|---|---|
| **Associated Feature** | Mobile AppBackend API Authentication Adaptation |
| **Description** | "Backend authentication logic must be updated to support mobile clients securely (e.g., transitioning to JWT or adding mobile-friendly token auth)." |
| **Maintenance Type** | Adaptive |
| **Priority** | High |
| **Severity** | Major |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Run backend unit tests asserting JWT generation and validation, followed by mobile integration tests ensuring the client can successfully authenticate and securely access protected routes. |

### CR-02: Automated Testing & Deployment to Cloud
| Attribute | Description |
|---|---|
| **Associated Feature** | Automated Testing & Deployment to Cloud |
| **Description** | Establish a CI/CD pipeline using GitHub Actions to automate testing, perform SonarQube quality analysis, and deploy the application to a cloud provider |
| **Maintenance Type** | Adaptive |
| **Priority** | High |
| **Severity** | Major |
| **Time to Implement** | 1.5 person-weeks |
| **Verification Method** | Push a sample commit to the repository and monitor the GitHub Actions runner to ensure unit tests execute, SonarQube gates pass, and the build successfully deploys to the staging cloud environment |

### CR-03: Android Mobile Application Development
| Attribute | Description |
|---|---|
| **Associated Feature** | Android Mobile Application Development |
| **Description** | Develop and integrate a new native Android mobile application that connects to the existing backend services and replicates core system functionality for mobile users |
| **Maintenance Type** | Adaptive |
| **Priority** | High |
| **Severity** | Major |
| **Time to Implement** | 4.0 person-weeks |
| **Verification Method** | Manually testing the Android version to ensure that registration, booking, and profile with sync with the code |

## 2. Perfective Maintenance

### CR-04: Member Profile Edit Interface and API
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password Recovery System |
| **Description** | "Add functionality for users to edit their profile information (name, phone number, and profile picture). Includes frontend form and backend API changes." |
| **Maintenance Type** | Perfective |
| **Priority** | Medium |
| **Severity** | Major |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Execute automated backend tests to verify input validation and database updates, and perform manual UI testing to confirm the profile edit form accurately reflects and saves changes. |

### CR-05: Password Recovery Mechanism
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password Recovery System |
| **Description** | "Implement 'Forgot Password' feature, including generating secure reset tokens, sending recovery emails, and updating the password via a secure link." |
| **Maintenance Type** | Perfective |
| **Priority** | High |
| **Severity** | Major |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Run automated integration tests to confirm password reset tokens are securely generated, and perform end-to-end manual testing from email dispatch to successful password update. |

### CR-06: Trainer Rating and Review Submission
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Develop the database schema, backend API, and frontend interface to allow members to submit a 1-5 star rating and text feedback for trainers." |
| **Maintenance Type** | Perfective |
| **Priority** | Medium |
| **Severity** | Medium |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Perform API testing to ensure ratings and feedback text are properly validated, securely inserted into the database, and correctly mapped to the target trainer ID. |

### CR-07: Trainer Profile Rating Display
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Update the trainer profile UI to display the calculated average rating and a list of previous member reviews." |
| **Maintenance Type** | Perfective |
| **Priority** | Medium |
| **Severity** | Minor |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Verify through frontend component tests that the UI retrieves the latest reviews, correctly calculates and displays the aggregate average rating, and renders individual feedback strings. |

## 3. Corrective Maintenance

### CR-08: Fix Unmodifiable Static Profile Data
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password reset System |
| **Description** | "User profiles are currently static and missing parts of the User Management system, leading to inaccurate real-life data in the system." |
| **Maintenance Type** | Corrective |
| **Priority** | Medium |
| **Severity** | Major |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Execute end-to-end data flow tests asserting that modifying profile fields on the frontend accurately persists the updated state to the central database table. |

### CR-09: Prevent Duplicate Trainer Reviews
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "The rating system must not allow duplicate reviews from the same member for the same session, which would skew the average rating." |
| **Maintenance Type** | Corrective |
| **Priority** | Medium |
| **Severity** | Major |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Write automated API tests simulating duplicate review submissions from the same member ID for the same trainer session, asserting that the backend properly rejects the duplicates with a 4xx error. |

### CR-10: Fix Review UI
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "The user must be able to give review to the trainer." |
| **Maintenance Type** | Corrective |
| **Priority** | Medium |
| **Severity** | Minor |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Conduct manual UI testing to confirm the review submission button is accessible, the form allows 1-5 star selection, and successfully submits the payload to the backend without errors. |

### CR-11: Secure Server-Side Session Management
| Attribute | Description |
|---|---|
| **Associated Feature** | Secure Server-Side Session Management |
| **Description** | Implement a server-side token blocklist mechanism to ensure JWTs are invalidated immediately upon user logout |
| **Maintenance Type** | Corrective |
| **Priority** | High |
| **Severity** | High |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Write automated security tests that capture a valid JWT, invoke the server-side logout endpoint, and then assert that subsequent API requests using the invalidated JWT are strictly rejected with a 401 Unauthorized status |

### CR-12: Centralized Course Data Management
| Attribute | Description |
|---|---|
| **Associated Feature** | Centralized Course Data Management |
| **Description** | Resolve a data type mismatch between the Admin panel and course-service microservice where a course ID is transmitted as a String but expected as an Integer, causing the 'Enroll Now' functionality to fail |
| **Maintenance Type** | Corrective |
| **Priority** | High |
| **Severity** | Major |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Conduct integration testing by triggering the 'Enroll Now' function in the Admin panel, inspecting the network payload to ensure the Course ID is an Integer, and verifying successful enrollment in the database |

### CR-13: Centralized System Authentication
| Attribute | Description |
|---|---|
| **Associated Feature** | Centralized System Authentication |
| **Description** | Standardize and enforce authentication across all microservices by implementing a centralized JWT validation mechanism |
| **Maintenance Type** | Corrective |
| **Priority** | High |
| **Severity** | Major |
| **Time to Implement** | 1.5 person-weeks |
| **Verification Method** | Run a comprehensive suite of API endpoint tests across Admin, Payment, and Reservation services without a valid JWT, asserting that every protected route correctly enforces authentication and returns a 401 error |

## 4. Preventive Maintenance

### CR-14: Review Submission Session Validation
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Implement validation to ensure only members who have booked and completed a private session can submit a review for that trainer." |
| **Maintenance Type** | Preventive |
| **Priority** | Medium |
| **Severity** | Medium |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Run automated integration tests asserting that review submission requests are strictly rejected (403 Forbidden) if the authenticated user has not actively completed a booked session with the target trainer. |

### CR-15: Administrative Content Moderation Tools
| Attribute | Description |
|---|---|
| **Associated Feature** | Trainer Rating and Review System |
| **Description** | "Add an administrative interface to manage, edit, or delete inappropriate review content submitted by users." |
| **Maintenance Type** | Preventive |
| **Priority** | Low |
| **Severity** | Minor |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Perform role-based access control (RBAC) testing to confirm only admin-level accounts can access the moderation interface and successfully execute DELETE commands on inappropriate reviews. |

### CR-16: Rate Limiting on Password Recovery
| Attribute | Description |
|---|---|
| **Associated Feature** | Member Profile Edit & Password Recovery System |
| **Description** | "Implement rate limiting on the 'Forgot Password' endpoint to prevent abuse." |
| **Maintenance Type** | Preventive |
| **Priority** | Medium |
| **Severity** | Major |
| **Time to Implement** | 0.5 person-weeks |
| **Verification Method** | Execute load testing scripts that fire multiple rapid password reset requests to the endpoint, asserting that the server correctly responds with a 429 Too Many Requests status after the defined limit. |

### CR-17: Comprehensive Code Testing System
| Attribute | Description |
|---|---|
| **Associated Feature** | Comprehensive Code Testing System |
| **Description** | Develop and implement unit and integration tests for all backend services to achieve a minimum of 90% code coverage |
| **Maintenance Type** | Preventive |
| **Priority** | High |
| **Severity** | High |
| **Time to Implement** | 2.0 person-weeks |
| **Verification Method** | Execute the test suite locally and review the generated SonarQube dashboard report to explicitly verify that the overall code coverage metric has reached or exceeded the 90% threshold |

### CR-18: Code Readability and Maintainability Overhaul
| Attribute | Description |
|---|---|
| **Associated Feature** | Code Readability and Maintainability Overhaul |
| **Description** | Refactor high cognitive complexity code modules such as Courts.js and index.html to improve readability, reduce complexity, and enhance long-term maintainability |
| **Maintenance Type** | Preventive |
| **Priority** | Medium |
| **Severity** | Minor |
| **Time to Implement** | 1.0 person-weeks |
| **Verification Method** | Trigger a fresh SonarQube static analysis scan and explicitly verify the maintainability report to ensure that refactored files report a cognitive complexity score strictly below 15 |
