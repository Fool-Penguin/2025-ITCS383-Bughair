
# D5: AI Usage Report

## 1. Overview

This report documents the project activities where AI assistance was used for the Bughair Fitness Management System maintenance phase. The primary evidence source is `docs/WORK_LOG.md`, which records Codex activity after each task.

AI was used as a coding and documentation assistant for analysis, implementation support, test generation, debugging, deployment guidance, and deliverable preparation. The team remains responsible for reviewing, verifying, accepting, and presenting the final project work.

## 2. AI Tool Used

| Tool | Role in Project | Main Usage |
|---|---|---|
| Codex / AI coding assistant | Development and documentation assistant | Code inspection, bug fixing, test support, documentation drafting, handoff preparation, verification guidance, and final deliverable preparation |

## 3. Summary of AI-Assisted Activities

| Date / Time Range (ICT) | AI Tool Used | Prompt | Purpose | Verification Performed |
|---|---|---|---|---|
| 2026-04-30 12:30-13:20 | Codex / AI coding assistant | Help decide password reset architecture, create shared project docs, and set rules for future agents. | Implement and document password reset direction, start shared project documentation, and prepare agent workflow rules. | JavaScript syntax checks and targeted searches for production-breaking localhost references. |
| 2026-04-30 13:35-14:05 | Codex / AI coding assistant | Audit what should be pushed, organize documentation, and fix SonarCloud coverage configuration. | Audit push readiness, update ignore rules, restructure documentation, and adjust SonarCloud coverage configuration. | Git status checks, file tree review, and SonarCloud metric inspection. |
| 2026-04-30 14:20-14:50 | Codex / AI coding assistant | Fix CI/test failures and raise SonarCloud new-code coverage above the requirement. | Improve automated tests and SonarCloud new-code coverage; reduce false duplication noise. | Reservation tests passed; course-service tests passed with over 90% line coverage; SonarCloud hotspot review. |
| 2026-04-30 14:57-15:36 | Codex / AI coding assistant | Read the project docs, prepare handoff, make database startup safer, and smoke-test the gateway. | Review project requirements, prepare account-transfer handoff, make database setup safer, seed demo reservation data, and smoke-test gateway APIs. | Node syntax checks, reservation tests, migration schema checks, reservation seeding, gateway HTTP smoke tests. |
| 2026-04-30 16:14-17:08 | Codex / AI coding assistant | Fix demo-breaking web issues around routing, reservations, profile pictures, bookings, and trainer reviews. | Fix hardcoded routing, local/demo password reset behavior, reservation availability, check-in/check-out controls, profile picture propagation, booking panels, trainer review rules, and related tests. | JavaScript parsing, reservation tests, course-service Jest tests, database checks, diff checks, and readiness review. |
| 2026-04-30 17:32-18:33 | Codex / AI coding assistant | Fix course enrollment, trainer booking completion, review submission, navigation, and prepare a handoff for the remaining production issue. | Fix course enrollment reactivation, trainer booking completion, review submission from bookings, navigation consistency, course enrollment feedback, and handoff for remaining production issue. | Course-service tests passed, syntax parsing, route probes, rollback-only database probe, push verification, and production retest guidance. |
| 2026-04-30 18:37-19:06 | Codex / AI coding assistant | Review the current project state, explain SMTP setup, check Gmail app-password requirements, and fix forgot-password timeout behavior. | Review current docs, guide SMTP setup, explain Gmail app passwords, fix forgot-password timeout behavior, review Render SMTP environment variables, and push final password reset timeout fix. | Official Google app-password guidance checked, Nodemailer configuration reviewed, syntax checks, inline script parsing, diff check, and git push confirmation. |
| 2026-04-30 19:16-19:55 | Codex / AI coding assistant | Diagnose Render SMTP timeout, compare no-domain email providers, and add HTTP email-provider support for password reset. | Identify SMTP blocking risk, add Resend and SendGrid password-reset email paths, fix sender fallback behavior, and push email-provider commits. | Official/provider docs checked, backend syntax checks, diff checks, Render log review, and git push confirmations. |
| 2026-04-30 19:39-19:50 | Codex / AI coding assistant | Generate and refine the AI usage log in `D5_AI-USAGE.md` from `docs/WORK_LOG.md`. | Generate this D5 AI usage report from the project work log, add prompt-focused columns, trim section descriptions, and remove the academic integrity section. | Markdown content reviewed for coverage of visible AI-assisted activities and work-log traceability. |
| 2026-04-30 20:00-20:33 | Codex / AI coding assistant | Diagnose SendGrid/Resend provider switching, fix course enrollment ID type mismatch, verify production password-reset emails, and run local gateway tests. | Resolve email provider configuration, fix course enrollment click failure caused by string/number ID mismatch, confirm working password-reset email flow, and local gateway smoke testing. | Render log review, local gateway HTTP checks, course-service tests passed with 92.71% line coverage, diff checks. |
| 2026-04-30 20:47-21:03 | Codex / AI coding assistant | Create and iteratively refine a 3-hour final work split for a 5-person team. | Plan final team work distribution covering Android app, web QA, documentation, file ownership, branch/push rules, prerequisites, timed working order, AI-agent handoff prompts, and recommended tech stack. | Reviewed split for practical simultaneous coding, conflict avoidance, and AI-agent delegation readiness. |
| 2026-04-30 21:14-21:18 | Antigravity (Claude) | Read project docs to understand current situation and update D5 with missing recent activity. | Project orientation, D5 AI usage report completion with missing work log entries. | Read all project docs, work log, and deliverable files. |

## 4. Activity Categories

### 4.1 Project Orientation and Documentation

AI assistance was used to read and summarize project documentation, organize handoff material, and create or update shared team documents. This included the project overview, work log, documentation index, current-session handoff, and agent workflow instructions.

Main outputs included:

- `docs/WORK_LOG.md`
- `docs/README.md`
- `docs/handoff/CURRENT_SESSION_HANDOFF.md`
- `docs/handoff/PROJECT_OVERVIEW_AND_REQUIREMENTS.md`
- `AGENTS.md`

### 4.2 Code Quality, SonarCloud, and Test Coverage

AI assisted with raising SonarCloud new-code coverage above 90%, generating focused unit tests for uncovered controller branches, fixing CI test failures (reservation-service), adjusting SonarCloud configuration to exclude test files and backup files from analysis, and reviewing duplication hotspots.

### 4.3 Database Setup, Seeding, and Safety

AI assisted with creating migration helper scripts, adding a database connection preflight check, seeding demo reservation data idempotently, removing a hardcoded credential from a migration file, and running read-only data verification queries.

### 4.4 Feature Implementation and Bug Fixing

AI assisted with fixing course enrollment (re-enrollment after cancellation, ID type normalization, active capacity derivation), trainer booking completion and review submission, profile picture propagation across pages, gateway route wiring, court reservation availability, attendance check-in/check-out controls, and navigation consistency.

### 4.5 Password Reset and SMTP Support

AI assisted with password reset architecture decisions, SMTP timeout handling, Gmail app-password guidance, diagnosing Render free-service SMTP port blocking, adding Resend and SendGrid HTTP email provider support, fixing sender fallback behavior, and verifying successful production email delivery.

### 4.6 Deployment, CI/CD, and Production Testing Support

AI assisted with Render deployment configuration, gateway smoke testing, local gateway startup and API verification, Render log diagnosis, environment variable review, and commit/push support for multiple deployment-critical fixes.

### 4.7 Deliverable Preparation

AI assisted with generating this D5 AI usage report, reviewing D3 change request coverage, preparing the 3-hour final work split with file ownership and AI-agent handoff prompts, and creating account-transfer handoff documentation.

## 5. Chronological AI Usage Log

| Time (ICT) | AI-Assisted Activity | Output / Impact | Verification Recorded |
|---|---|---|---|
| 2026-04-30 12:30 | Password reset architecture decision and configuration support. | Updated reset-link generation, frontend API paths, and Render SMTP placeholders. | `node --check`; searched remaining AuthMembership localhost references. |
| 2026-04-30 12:55 | Course-service coverage improvement. | Reworked tests and coverage import configuration. | Course-service tests passed with 90.95% line coverage. |
| 2026-04-30 13:20 | Shared documentation and agent workflow setup. | Added mandatory work log, project overview, and agent instructions. | Reviewed existing docs and repo context. |
| 2026-04-30 13:35 | Workspace push audit. | Updated `.gitignore` for local/generated artifacts. | Git status and untracked-file checks. |
| 2026-04-30 13:50 | Documentation restructuring. | Added docs index and reorganized project, handoff, and deliverable docs. | Checked docs tree. |
| 2026-04-30 14:05 | SonarCloud coverage calculation fix. | Excluded course-service tests from Sonar source/coverage measurement. | Checked SonarCloud metrics and confirmed target scope. |
| 2026-04-30 14:20 | Reservation-service CI test fix. | Added test-mode in-memory Postgres fallback and rewrote async tests. | Reservation tests passed: 17 passed, 0 failed. |
| 2026-04-30 14:35 | SonarCloud new-code coverage improvement. | Added focused course and review controller tests. | Course-service tests passed with 93.08% line coverage. |
| 2026-04-30 14:50 | SonarCloud duplication review. | Excluded obvious backup/non-runtime frontend files. | Queried duplication hotspots and kept real production files in scope. |
| 2026-04-30 14:57 | Project documentation review. | Identified current requirements and priorities. | Read project docs and extracted assignment PDF text. |
| 2026-04-30 15:11 | Database safety and startup hardening. | Added migration helper scripts, removed hardcoded credential, seeded reservation data at startup. | Syntax checks, reservation tests, migration check, reservation seeding. |
| 2026-04-30 15:20 | Account-transfer handoff. | Added current-session handoff and docs index reference. | Checked repo status and reviewed docs. |
| 2026-04-30 15:22 | Gateway smoke test. | Confirmed key gateway pages and APIs returned HTTP 200 locally. | Temporary local gateway startup and HTTP checks. |
| 2026-04-30 15:36 | Manual browser test startup guidance. | Documented local gateway startup status. | Confirmed port listening initially; noted process did not remain active. |
| 2026-04-30 16:14 | Hardcoded/demo wiring fixes. | Added gateway routes, route/API rewiring, reset link demo behavior, live court availability, attendance controls, and trainer booking date/time inputs. | Searches, syntax checks, reservation tests, course-service tests, migration check, gateway smoke test. |
| 2026-04-30 16:25 | Database data check. | Confirmed current database contained seeded/demo data plus manual activity rows. | Migration check and read-only database summary queries. |
| 2026-04-30 16:42 | Interrupted feature fix handoff. | Documented partial profile, course, and trainer review edits. | No completed verification due to interruption. |
| 2026-04-30 16:52 | Full documentation review. | Confirmed partial work and remaining final-deliverable priorities. | Read every Markdown file under `docs/` and checked git status. |
| 2026-04-30 17:00 | Completed profile, booking, and review work. | Added profile picture propagation, booking panels, review submission rule, active attendee counts, and tests. | JavaScript parsing and course-service tests passed. |
| 2026-04-30 17:02 | Push readiness check. | Updated handoff and verified current changes. | Diff check, secret/conflict scan, reservation tests. |
| 2026-04-30 17:08 | Commit/push support. | Pushed profile, booking, and review changes. | Git push completed successfully. |
| 2026-04-30 17:32 | Course enrollment and trainer review fixes. | Reactivated cancelled enrollments, added booking completion endpoint/button, improved review modal behavior, updated navigation, and added tests. | Syntax parsing, course-service tests, diff check. |
| 2026-04-30 17:36 | Deployment push support. | Pushed course enrollment, trainer review, and navigation fixes. | Git push completed successfully. |
| 2026-04-30 17:51 | Course enrollment production follow-up. | Improved frontend feedback and active enrollment detection. | Database probe, route probe, syntax parsing, course-service tests, diff check. |
| 2026-04-30 17:52 | Deployment push support. | Pushed course enrollment hardening patch. | Git push completed successfully. |
| 2026-04-30 18:25 | Browser click issue fix attempt. | Replaced inline enrollment click handling with delegated document-level handling. | Parsed course-service frontend script. |
| 2026-04-30 18:33 | Handoff for unresolved production enrollment issue. | Updated handoff with exact commits, known facts, and DevTools next-check steps. | Checked git status and recent commits. |
| 2026-04-30 18:37 | Project orientation for next task. | Read current docs and summarized blockers/priorities. | Read docs and checked git status. |
| 2026-04-30 18:40 | Reset email configuration guidance. | Explained how real password reset emails work with existing Nodemailer setup. | Reviewed auth controller, package file, render config, routes, and frontend references. |
| 2026-04-30 18:46 | Gmail app-password guidance. | Explained app-password requirements and secret handling. | Checked current Google Account Help guidance. |
| 2026-04-30 19:01 | Forgot-password timeout fix. | Added SMTP/backend timeouts and frontend abort timeout/recovery toast. | Backend syntax check and inline script parsing. |
| 2026-04-30 19:03 | SMTP environment variable review. | Reviewed Render SMTP variable shape and warned about exposed secret rotation. | Checked screenshot values against Nodemailer requirements. |
| 2026-04-30 19:06 | Password reset timeout fix push. | Pushed commit `72e6dd5` for password reset email timeout. | Diff check, backend syntax check, inline script parsing, git push confirmation. |
| 2026-04-30 19:16 | Render SMTP timeout diagnosis. | Identified Render free-service SMTP port blocking as the likely cause and recommended HTTP email providers. | Reviewed Render log and current Render SMTP/free-service behavior. |
| 2026-04-30 19:24 | Resend password-reset email support. | Added Resend HTTPS email sending support and Render env placeholders. | Checked official Resend API docs, backend syntax check, and diff check. |
| 2026-04-30 19:26 | Resend email support push. | Pushed commit `cfbefd4` for Resend password-reset emails. | Git push completed successfully. |
| 2026-04-30 19:27 | Resend sender fallback fix. | Prevented Resend from accidentally using the old Gmail SMTP sender. | Reviewed sender fallback against current Render environment setup. |
| 2026-04-30 19:36 | Resend configuration diagnosis. | Diagnosed unverified `yourdomain.com` sender error and documented next steps. | Reviewed Render log and Resend sender/domain verification behavior. |
| 2026-04-30 19:39 | AI usage report generation. | Created this `D5_AI-USAGE.md` report. | Reviewed source work log and generated Markdown structure. |
| 2026-04-30 19:46 | AI usage report prompt-column update. | Replaced the affected-files column with `Prompt` and moved `Purpose` after it. | Checked the edited summary table structure. |
| 2026-04-30 19:47 | No-domain email provider comparison. | Compared practical email provider options for password-reset delivery without a domain. | Checked current official/provider docs for Resend, SendGrid, Mailgun, and Brevo. |
| 2026-04-30 19:50 | SendGrid password-reset email support. | Added SendGrid HTTPS email sending support and Render env placeholders. | Backend syntax check and diff check. |
| 2026-04-30 19:50 | AI usage report trimming. | Removed section descriptions from 4.2-4.7 and removed the academic integrity section. | Reviewed the affected D5 sections after editing. |
| 2026-04-30 19:55 | SendGrid email support push. | Pushed commit `544d452` for SendGrid password-reset emails. | Git push completed successfully. |
| 2026-04-30 20:00 | SendGrid environment cleanup guidance. | Identified which Render env vars to keep/remove after switching to SendGrid. | Reviewed auth controller provider priority and Render env screenshot. |
| 2026-04-30 20:06 | SendGrid/Resend provider switching diagnosis. | Identified that Render was still executing the Resend path; recommended deleting Resend env vars. | Reviewed Render log showing Resend execution path. |
| 2026-04-30 20:18 | Course enrollment click handler fix analysis. | Updated enroll button handler with shared `handleEnrollButtonClick` and delegated listener. | Parsed course-service frontend script; course-service tests passed with 92.71% line coverage. |
| 2026-04-30 20:23 | Successful production password-reset email verification. | Recorded that SendGrid password-reset email flow is working in production. | User confirmed working email delivery. |
| 2026-04-30 20:27 | Local gateway startup for course page testing. | Started AuthMembership gateway locally; confirmed HTTP 200 and API responses. | Gateway started, `/courses` returned 200, `/api/courses` returned 3 courses. |
| 2026-04-30 20:33 | Course enrollment ID type mismatch fix. | Normalized course IDs to numbers to fix strict equality failure in `toggleEnroll()`. | Confirmed API returns string IDs; verified normalized IDs pass strict equality; course-service tests passed. |
| 2026-04-30 20:47 | 3-hour final work split creation. | Created `docs/handoff/3-HOUR-FINAL-SPLIT.md` with owner checklists and final-freeze guidance. | Created markdown document in handoff folder. |
| 2026-04-30 20:50 | Final split Android parity revision. | Reworked split for closer Android feature parity with web app. | Reviewed for 5-person ownership and Android emulator proof rules. |
| 2026-04-30 20:52 | Final split prerequisites and timed working order. | Added prerequisites and timed working order covering setup, parallel work, integration, and freeze. | Reviewed prerequisites for Render/SendGrid/Android emulator context. |
| 2026-04-30 20:56 | Final split push readiness check. | Confirmed no conflict markers or whitespace errors in split documentation. | Ran git status, git diff --check, and conflict marker search. |
| 2026-04-30 20:59 | Final split conflict boundary refinement. | Added explicit file ownership, branch/push rules, and conflict boundaries. | Reviewed for realistic simultaneous coding and shared-file conflict avoidance. |
| 2026-04-30 21:00 | Final split Person 5 coding role revision. | Gave Person 5 ownership of Android integration code, Gradle/build config, and shared helpers. | Reviewed Person 5 role for coding ownership and conflict boundaries. |
| 2026-04-30 21:02 | Final split AI-agent handoff and push rules. | Added AI-agent usage rules and role-specific prompt blocks for all five team members. | Reviewed for explicit push safety and AI-agent delegation instructions. |
| 2026-04-30 21:03 | Final split recommended tech stack. | Added recommended Android, backend, email, visual, and do-not-use tech stack section. | Checked that the split names specific technologies consistently. |
| 2026-04-30 21:14 | Project orientation and D5 completion. | Read all project docs; updated D5 with missing recent activity and filled empty category sections. | Read all required project documentation and cross-referenced work log entries. |

## 6. Evidence Source

The detailed evidence for this report is the shared work log:

- `docs/WORK_LOG.md`

Supporting context was also taken from:

- `docs/project-description/Phase 2 Description.md`
- `docs/README.md`
- `AGENTS.md`
- `D2_CODE_QUALITY.md`
- `D3_CHANGE_REQUESTS.md`
