# Bughair Android App

Native Android demo app for the Bughair Fitness Management System.

## Stack

- Java Android app with built-in Android views.
- Gradle wrapper with Android Gradle Plugin 8.3.0.
- `HttpURLConnection` for API calls.
- `SharedPreferences` for JWT session storage.
- Native screens for auth, profile, courses, trainers/reviews, payments, and courts using the existing backend APIs.

## Backend

The app uses the deployed Render backend:

```text
https://two025-itcs383-bughair-1.onrender.com
```

## Build

From PowerShell:

```powershell
$env:ANDROID_HOME="C:\Users\markz\AppData\Local\Android\Sdk"
.\gradlew.bat assembleDebug
```

APK output:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Demo Flow

1. Launch the app on an Android Studio emulator.
2. Use Login for member authentication.
3. Use Forgot to request a password reset email.
4. Use Profile to load and update member details.
5. Use Courses to load deployed courses and enroll after login.
6. Use Trainers to show trainer ratings and reviews.
7. Use Payments to view membership plans and member payment history.
8. Use Courts to view court availability and member reservations.

Local emulator screenshots can be captured with:

```powershell
C:\Users\markz\AppData\Local\Android\Sdk\platform-tools\adb.exe shell screencap -p /sdcard/bughair-android-home.png
C:\Users\markz\AppData\Local\Android\Sdk\platform-tools\adb.exe pull /sdcard/bughair-android-home.png android-app\bughair-android-home.png
```

Screenshot PNG files under `android-app/` are ignored by Git because they may contain live demo member details.
