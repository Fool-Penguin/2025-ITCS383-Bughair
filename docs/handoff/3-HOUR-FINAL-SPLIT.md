# 3-Hour Final Team Split - Practical Coding Plan

Use this split when everyone must code at the same time and the deadline is close. The goal is to get the closest practical Android parity without creating merge chaos.

**Working, buildable, and pushed beats unfinished full-native parity.**

Build native/API-backed screens for the most important flows. For large or risky modules, use a polished WebView/custom-tab fallback to the deployed web page so the feature still works during the demo.

## Shared Rules

- No large refactors.
- No secrets, `.env` files, database files, coverage folders, or dependency folders in commits.
- Every screen must either work or be removed from the demo path.
- If a native screen is not stable after 30 minutes, switch it to WebView fallback.
- Only Person 5 updates shared coordination files like `docs/WORK_LOG.md`, README, and final handoff docs.
- Keep screenshots or short screen recordings as proof.
- **Must do before any direct push to `master`: announce first, then pull/rebase before pushing.**

## AI-Agent Usage Rules

This split is designed so each team member can give one section to an AI coding agent such as GPT-5.5.

- Give the AI agent only the role section assigned to that person, plus the Shared Rules, Prerequisites, File Ownership, Branch/Push Rules, and Final 30-Minute Freeze sections.
- Tell the AI agent exactly which files/folders it owns.
- Tell the AI agent not to edit files owned by other people.
- Tell the AI agent to make small commits.
- Tell the AI agent to run the verification listed in its section.
- Person 5 or the human integration lead should review and merge AI-generated changes.
- Do not paste secrets into any AI chat. Use placeholder names for env vars.

## Recommended Tech Stack

Use one consistent Android stack so the five AI agents do not produce incompatible code.

### Android

- **Language:** Kotlin.
- **UI:** Jetpack Compose.
- **Architecture:** simple MVVM-style screens with ViewModels only where useful.
- **Navigation:** Jetpack Navigation Compose.
- **Networking:** Retrofit + OkHttp if dependencies are already easy to add; otherwise use Java/Kotlin standard HTTP client for speed.
- **JSON:** kotlinx.serialization or Gson, whichever is already configured fastest.
- **Session storage:** SharedPreferences or DataStore; choose SharedPreferences if time is short.
- **Fallback:** Android WebView or Chrome Custom Tabs for payments, courts, admin, or any unstable native screen.
- **Build:** Gradle debug build with `.\gradlew assembleDebug`.
- **Minimum target:** emulator demo, not Play Store release.

### Web / Backend

- Existing deployed backend stays Node.js/Express on Render.
- Existing database stays Supabase/Postgres.
- Existing reset-password email stays SendGrid over HTTPS API.
- Do not rewrite backend APIs unless there is a critical demo blocker.

### Visual Style

- Match the web app:
  - dark background
  - lime accent
  - bold fitness branding
  - compact dashboard cards
  - clear loading/error states
- Avoid spending time on decorative polish until all demo flows work.

### Do Not Use

- Do not introduce React Native, Flutter, Ionic, or another framework.
- Do not build a second backend.
- Do not add a complex local database/offline mode.
- Do not switch email providers again.

## File Ownership To Prevent Conflicts

Everyone codes in a separate area. Do not edit another person's files unless they approve it in chat.

### Person 1 Owns

Android app shell/navigation/theme files only.

Suggested files/folders:

```text
android-app/app/src/main/AndroidManifest.xml
android-app/app/src/main/java/.../MainActivity.*
android-app/app/src/main/java/.../ui/theme/**
android-app/app/src/main/java/.../navigation/**
```

### Person 2 Owns

Android auth/profile/API client files only.

Suggested files/folders:

```text
android-app/app/src/main/java/.../data/auth/**
android-app/app/src/main/java/.../data/profile/**
android-app/app/src/main/java/.../network/**
android-app/app/src/main/java/.../screens/auth/**
android-app/app/src/main/java/.../screens/profile/**
```

### Person 3 Owns

Android course/trainer/review/payment/court feature screens only.

Suggested files/folders:

```text
android-app/app/src/main/java/.../data/courses/**
android-app/app/src/main/java/.../data/trainers/**
android-app/app/src/main/java/.../screens/courses/**
android-app/app/src/main/java/.../screens/trainers/**
android-app/app/src/main/java/.../screens/webfallback/**
```

### Person 4 Owns

Web production QA fixes only if absolutely needed, plus deliverable docs.

Suggested files/folders:

```text
docs/deliverables/**
D2_CODE_QUALITY.md
D4_IMPACT_ANALYSIS.md
D5_AI-USAGE.md
implementations/AuthMembership/frontend/**
implementations/course-service/frontend/**
```

Only touch frontend web code for critical demo blockers.

### Person 5 Owns

Integration code, app build glue, final docs, logs, README, and pushes.

Suggested files/folders:

```text
README.md
docs/WORK_LOG.md
docs/handoff/**
render.yaml
android-app/settings.gradle*
android-app/build.gradle*
android-app/app/build.gradle*
android-app/app/src/main/java/.../integration/**
android-app/app/src/main/java/.../common/**
```

Person 5 is the only person who should resolve merge conflicts in shared docs. Person 5 can also code integration helpers, app configuration, shared models, and route wiring, but should not take ownership of feature screen internals from Persons 1-3.

## Branch / Push Rules

Best practical setup:

```text
person1-android-shell
person2-android-auth
person3-android-features
person4-docs-webqa
master
```

Each person works on their branch. Person 5 merges into `master` one branch at a time.

If the team cannot use branches and must push to `master`, then:

1. Announce before pushing.
2. Push small commits.
3. Do not edit shared files except Person 5.
4. Run this before push:

```powershell
git pull --rebase origin master
git status --short
git diff --check
```

If conflict happens, stop and ask Person 5.

## Must-Do Before Any Direct Push To `master`

Anyone pushing directly to `master` must do this exact checklist:

1. Announce in the team chat:

```text
I am about to push to master.
Owned files:
Commit summary:
```

2. Pull/rebase first:

```powershell
git pull --rebase origin master
```

3. Check status:

```powershell
git status --short
```

4. Check whitespace/conflict markers:

```powershell
git diff --check
```

5. If there are conflicts, stop and ask Person 5.
6. If clean, push:

```powershell
git push origin master
```

7. Post the commit hash in team chat.

Skipping this checklist can overwrite or block another teammate's work.

## Prerequisites

Before splitting work, confirm these are ready:

### Everyone

- Latest `master` pulled.
- GitHub account has repo access.
- Communication channel open for fast status updates.
- Deployed web app URL available:

```text
https://two025-itcs383-bughair-1.onrender.com
```

- Demo member/admin credentials available privately. Do not paste real passwords in docs or chat logs.
- Screenshots/video capture ready.

### Web / Backend

- Render dashboard access for deployment/log checks.
- Render env vars already configured for working password reset:

```text
APP_BASE_URL
DATABASE_URL
SENDGRID_API_KEY
SENDGRID_FROM
JWT_SECRET
```

- Old email-provider env vars removed or ignored:

```text
RESEND_API_KEY
RESEND_FROM
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
```

### Android

- Android Studio installed.
- Android emulator available and starts successfully.
- Android SDK/Gradle sync works.
- Internet access from the emulator.
- API base URL known:

```text
https://two025-itcs383-bughair-1.onrender.com
```

- If using WebView, Android app has internet permission:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

- If the Android app is in a separate repo, its URL is known and will be linked from the main project docs/README.

### Documentation

- D2, D3, D4, and D5 file locations agreed by the team.
- SonarCloud/GitHub Actions access available to whoever owns D2/code quality.
- Existing docs read:
  - `docs/README.md`
  - `docs/handoff/PROJECT_OVERVIEW_AND_REQUIREMENTS.md`
  - `docs/WORK_LOG.md`

## Final Target

By the final push, the team should have:

- Working deployed web app.
- Working password reset email through SendGrid.
- Android emulator demo that covers the core web flows as closely as possible.
- Debug APK build or clear Android run evidence.
- D2, D3, D4, and D5 deliverables present.
- README or handoff docs pointing to Android repo/app location and deployed web URL.
- Final GitHub commit pushed before deadline.

## Android Feature Priority

Build in this order:

1. App shell and bottom navigation.
2. Login/register.
3. Forgot password.
4. Home/dashboard.
5. Profile edit.
6. Courses/enrollment.
7. Trainers/reviews.
8. Payments as WebView fallback.
9. Courts/reservations as WebView fallback.
10. Admin/reporting only if already available or as web fallback.

## Working Order

Use this order so people are not blocked by each other.

### First 15 Minutes - Setup And Assignment

1. Person 5 confirms latest `master`, Render status, and branch strategy.
2. Person 1 starts emulator and Android app shell.
3. Person 2 confirms deployed auth endpoints with the web app or API.
4. Person 3 confirms courses/trainers pages/API availability.
5. Person 4 opens D2-D5 docs and lists missing sections.
6. Everyone posts file ownership in chat.

### 15-60 Minutes - Core Parallel Work

1. Person 1 builds the Android navigation shell and visual theme.
2. Person 2 implements Android login/forgot-password/profile.
3. Person 3 implements Android courses/trainers/reviews or prepares web fallbacks.
4. Person 4 fills D2-D5 with current facts and screenshots.
5. Person 5 codes build/integration glue, app config, shared helpers, README/handoff links, and watches GitHub/Render.

### 60-120 Minutes - Integration

1. Person 1 exposes navigation slots for Person 2 and Person 3 screens.
2. Person 2 gives Person 1 the auth/profile screen route names.
3. Person 3 gives Person 1 the feature screen route names.
4. Person 4 finishes D2-D5 and asks for missing evidence.
5. Person 5 connects feature routes, resolves integration errors, merges branches one at a time, and runs Android build.
6. Web QA confirms deployed flows still work.

### 120-150 Minutes - Demo Evidence

1. Record Android emulator screenshots/video.
2. Record web screenshots/video.
3. Save final Sonar/Actions/Render evidence.
4. Write known issues honestly.
5. Finalize demo script.

### Final 30 Minutes - Freeze

1. Stop feature work.
2. Commit only safe, tested changes.
3. Push final code/docs.
4. Verify GitHub shows final commit.
5. Verify Render is still live.
6. Everyone prepares for presentation/demo.

## Person 1 - Android Shell / UI Lead

**Main goal:** Make the app look and navigate like Bughair.

**Conflict boundary:** Owns app shell, navigation, theme, and entry point. Do not implement API details here; use placeholder routes/screens from Person 2 and Person 3.

### AI Agent Prompt

```text
You are Person 1: Android Shell / UI Lead.
Your goal is to make the Android app visually match the Bughair web app and provide stable navigation.
Only edit Android shell/navigation/theme/entry-point files.
Do not implement API/auth/course internals.
Expose route slots for Person 2 auth/profile screens and Person 3 course/trainer screens.
Run the app on emulator or provide build/compile verification.
Do not edit docs/WORK_LOG.md, README.md, backend files, or other people's feature folders.
```

### Checklist

- Open Android Studio and start the emulator.
- Create or stabilize the Android app shell.
- Match web branding:
  - dark background
  - lime accent
  - Bughair/Fitness title
  - clear buttons/cards
- Add navigation:
  - Home
  - Profile
  - Courses
  - Trainers
  - Payments
  - Courts
  - Forgot Password / Logout
- Add loading and error states.
- Make sure every visible button does something.
- Run the app on emulator.

### Proof Of Done

- Emulator screenshot of main navigation.
- Emulator screenshot of at least 3 screens.
- App does not crash when moving between screens.

### Stop Condition

If a screen is empty or unstable, replace it with a WebView/custom-tab button to the matching deployed web page.

## Person 2 - Android Auth / Profile API Lead

**Main goal:** Make member auth and profile work natively.

**Conflict boundary:** Owns auth/profile/network files. Do not edit the main navigation except to tell Person 1 which route/screen to connect.

### AI Agent Prompt

```text
You are Person 2: Android Auth / Profile API Lead.
Your goal is to implement login, forgot password, and profile API flows for the Android app.
Only edit Android auth/profile/network files.
Use the deployed API base URL: https://two025-itcs383-bughair-1.onrender.com
Do not edit main navigation except by documenting route names for Person 1.
Do not edit course/trainer feature files, docs/WORK_LOG.md, README.md, or backend files.
Verify login/forgot-password/profile behavior on emulator if possible.
```

### Checklist

- Wire API base URL:

```text
https://two025-itcs383-bughair-1.onrender.com
```

- Implement login with `/api/auth/login`.
- Store JWT token locally.
- Show member name/member ID after login.
- Implement register if time allows.
- Implement forgot password with `/api/auth/forgot-password`.
- Implement profile fetch/update with `/api/auth/profile`.
- Show clear success/error messages.

### Proof Of Done

- Login works in emulator.
- Forgot password request works from emulator.
- Profile screen displays user data.
- Profile edit saves or clearly falls back to web profile page.

### Stop Condition

If token/profile handling blocks for more than 30 minutes, keep login native and make profile a WebView fallback.

## Person 3 - Android Courses / Trainers / Reviews Lead

**Main goal:** Cover the main requested maintenance feature on Android.

**Conflict boundary:** Owns course/trainer/review feature files and web fallback feature files. Do not edit auth/profile or main navigation except through agreed route names.

### AI Agent Prompt

```text
You are Person 3: Android Courses / Trainers / Reviews Lead.
Your goal is to implement Android course, trainer, and review screens, with WebView fallback for unstable actions.
Only edit Android courses/trainers/reviews/webfallback feature files.
Do not edit auth/profile files or main navigation except by documenting route names for Person 1.
Use the deployed API base URL: https://two025-itcs383-bughair-1.onrender.com
Verify that course/trainer screens load or that fallback links work.
Do not edit docs/WORK_LOG.md, README.md, or backend files.
```

### Checklist

- Add courses screen.
- Fetch course list from deployed API.
- Show course title, trainer, schedule, capacity/status.
- Add enroll button if the API/token flow works.
- Add trainers screen.
- Show trainer rating/review count if available.
- Add review display/submission if stable.
- Use WebView fallback for any unstable course/trainer action.

### Proof Of Done

- Courses screen loads data.
- Trainer/review screen loads or opens the working web page.
- At least one maintenance feature is visible in Android demo.

### Stop Condition

If enroll/review submission is risky, demo read-only native list plus web fallback for the actual action.

## Person 4 - Web QA / Deliverables Lead

**Main goal:** Protect the final submission while Android work happens.

**Conflict boundary:** Owns D2-D5 and emergency web QA notes. Do not edit Android files. Do not edit `docs/WORK_LOG.md`; send work-log notes to Person 5.

### AI Agent Prompt

```text
You are Person 4: Web QA / Deliverables Lead.
Your goal is to verify the deployed web demo and complete/check D2-D5 deliverables.
Only edit deliverable docs and emergency web QA notes.
Do not edit Android files, docs/WORK_LOG.md, README.md, or backend code unless explicitly assigned a critical web demo blocker.
Record honest evidence, known issues, and verification steps.
Make D2-D5 readable and submission-ready.
```

### Web QA Checklist

- Test deployed web login/register.
- Test profile edit.
- Test forgot password email through SendGrid.
- Test course/trainer page enough for demo.
- Test courts/payment navigation enough for demo.
- Capture screenshots or short recording.
- Check Render logs for errors.

### Docs Checklist

- D2 exists and includes latest code-quality/coverage status.
- D3 has 8 CRs:
  - 2 corrective
  - 2 adaptive
  - 2 perfective
  - 2 preventive
- D4 exists with traceability/impact/matrix content.
- D5 exists and includes AI-assisted work.

### Proof Of Done

- Web demo checklist result posted.
- D2-D5 status posted.
- Screenshots/evidence saved or linked.

## Person 5 - Integration Code / Build / Final Push Lead

**Main goal:** Help code the Android integration layer while making sure everything builds, links, and gets pushed.

**Conflict boundary:** Owns final merges, Gradle/build config, shared integration helpers, app route wiring, `docs/WORK_LOG.md`, README/handoff docs, and final push. Do not rewrite other people's feature screen internals unless needed to resolve build conflicts.

### AI Agent Prompt

```text
You are Person 5: Integration Code / Build / Final Push Lead.
Your goal is to code Android integration/build glue and safely merge/push final work.
You own Gradle/build config, shared integration helpers, common app config, route wiring, docs/WORK_LOG.md, README/handoff docs, and final pushes.
Do not rewrite feature screen internals from Persons 1-3 unless needed to fix compile/build conflicts.
Before pushing directly to master, announce first, run git pull --rebase origin master, check git status --short, run git diff --check, then push.
Record final commit hashes and update docs/WORK_LOG.md.
```

### Checklist

- Maintain the shared API base URL/config.
- Add shared helper utilities if needed:
  - token/session helper
  - WebView fallback helper
  - common loading/error components
- Connect Person 1 navigation to Person 2 and Person 3 routes.
- Fix compile errors caused by integration boundaries.
- Run Android build:

```powershell
.\gradlew assembleDebug
```

- Save APK path or build result:

```text
app/build/outputs/apk/debug/app-debug.apk
```

- Confirm Android repo/app path is documented.
- Confirm README or docs link to:
  - deployed web app
  - Android repo/app location
  - D2-D5 deliverables
- Run:

```powershell
git status --short
git log --oneline -5
```

- Confirm no secrets are staged.
- Push final commits.
- Check GitHub Actions and Render deploy.
- Prepare demo script.

### Proof Of Done

- Final commit hash posted.
- APK/emulator evidence posted.
- Android build/integration errors resolved or clearly documented.
- Demo script ready.

## Demo Script

Use this exact order:

1. Open deployed web app.
2. Login/register.
3. Show SendGrid forgot-password email working.
4. Show profile edit.
5. Show courses/trainers/reviews.
6. Show payments/courts navigation.
7. Open Android emulator.
8. Show Android app launch.
9. Show Android login/home/profile.
10. Show Android courses/trainers or WebView fallback.
11. Show D2-D5 deliverables.

## Final 30-Minute Freeze

At 30 minutes remaining:

- Stop native feature building.
- Only fix crashes, broken links, or missing docs.
- Push all safe changes.
- Record known issues honestly.
- Do not merge large untested code.

## Communication Template

Post updates in this format:

```text
Owner:
Task:
Status: not started / in progress / done / blocked
Proof:
Blocker:
Need from team:
```

## Definition Of Good Enough

The Android app is good enough if:

- It launches on emulator.
- It visually matches the Bughair web app.
- It supports login or opens the login flow reliably.
- It demonstrates profile/password reset/course/trainer flows either natively or through stable in-app web fallback.
- It has screenshots/video proof.
- It has a build/run result.

The web app is good enough if:

- The deployed demo works for the key flows.
- Password reset email works through SendGrid.
- Any broken flow is documented before the final push.
