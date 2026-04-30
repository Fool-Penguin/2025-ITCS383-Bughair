package edu.mahidol.bughair;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(13, 13, 13);
    private static final int BG_2 = Color.rgb(20, 20, 20);
    private static final int BG_3 = Color.rgb(28, 28, 28);
    private static final int BORDER = Color.rgb(42, 42, 42);
    private static final int LIME = Color.rgb(200, 245, 60);
    private static final int LIME_DIM = Color.rgb(168, 208, 32);
    private static final int TEXT = Color.rgb(242, 242, 240);
    private static final int MUTED = Color.rgb(136, 136, 136);
    private static final int DANGER = Color.rgb(255, 69, 69);
    private static final int WARN = Color.rgb(250, 204, 21);

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private SessionStore session;
    private LinearLayout content;
    private TextView status;
    private LinearLayout headerAvatar;
    private final Map<String, Button> navButtons = new HashMap<>();
    private String selectedRole = "member";
    private boolean loginMode = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        session = new SessionStore(this);
        buildShell();
        showHome();
    }

    private void buildShell() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        setContentView(root);

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(18), dp(12), dp(18), dp(10));
        header.setBackground(borderBox(BG, BORDER, 0, 0));
        root.addView(header, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(76)));

        LinearLayout logoBlock = new LinearLayout(this);
        logoBlock.setOrientation(LinearLayout.VERTICAL);
        header.addView(logoBlock, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        logoBlock.addView(text("FITNESS", 30, LIME, Typeface.BOLD));
        logoBlock.addView(label("BUGHAIR MOBILE"));

        headerAvatar = new LinearLayout(this);
        LinearLayout.LayoutParams headerAvatarParams = new LinearLayout.LayoutParams(dp(48), dp(48));
        headerAvatarParams.setMargins(0, 0, dp(12), 0);
        header.addView(headerAvatar, headerAvatarParams);

        Button web = miniButton("WEB");
        web.setOnClickListener(v -> openWeb("/home"));
        header.addView(web);

        status = text("", 13, TEXT, Typeface.BOLD);
        status.setPadding(dp(18), dp(10), dp(18), dp(8));
        root.addView(status);

        HorizontalScrollView navScroll = new HorizontalScrollView(this);
        navScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setPadding(dp(18), 0, dp(10), dp(8));
        navScroll.addView(nav);
        root.addView(navScroll);

        addNav(nav, "Dashboard", v -> showHome());
        addNav(nav, "Auth", v -> showAuth());
        addNav(nav, "Profile", v -> showProfile());
        addNav(nav, "Courses", v -> showCourses());
        addNav(nav, "Trainers", v -> showTrainers());
        addNav(nav, "Payments", v -> openWeb("/payments"));
        addNav(nav, "Courts", v -> openWeb("/courts"));

        ScrollView scroll = new ScrollView(this);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(18), dp(8), dp(18), dp(28));
        scroll.addView(content);
        root.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        refreshStatus("Ready");
    }

    private void refreshStatus(String message) {
        String prefix;
        if (session.isLoggedIn()) {
            prefix = safe(session.fullName(), "Member").toUpperCase(Locale.US) + " | " + safe(session.memberId(), "MEMBER");
        } else {
            prefix = "NO SESSION";
        }
        status.setText(prefix + " - " + message);
        refreshHeaderAvatar();
    }

    private void refreshHeaderAvatar() {
        if (headerAvatar == null) {
            return;
        }
        headerAvatar.removeAllViews();
        if (!session.isLoggedIn()) {
            return;
        }
        LinearLayout avatar = avatarView(session.fullName(), session.profilePicture(), 16, 24);
        headerAvatar.addView(avatar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void showHome() {
        setActiveNav("Dashboard");
        refreshStatus("Ready");
        clear();
        LinearLayout hero = card();
        hero.addView(text("WELCOME TO THE", 34, TEXT, Typeface.BOLD));
        hero.addView(text("ELITE COMMUNITY", 40, LIME, Typeface.BOLD));
        hero.addView(paragraph(session.isLoggedIn()
                ? "Your membership dashboard is connected to the live deployed system."
                : "Sign in to manage membership, profile, courses, trainers, payments, and courts."));
        hero.addView(statRow("CURRENT PLAN", session.isLoggedIn() ? "ELITE MEMBER" : "GUEST",
                "EXPIRY DATE", "DEC 2026",
                "DAYS LEFT", "248"));
        content.addView(hero);

        sectionTitle("Quick Access");
        LinearLayout grid = new LinearLayout(this);
        grid.setOrientation(LinearLayout.VERTICAL);
        content.addView(grid);
        grid.addView(menuCard("COURT BOOKING", "Reserve badminton courts through the deployed web flow.", v -> openWeb("/courts")));
        grid.addView(menuCard("FITNESS COURSES", "Browse classes natively and enroll after login.", v -> showCourses()));
        grid.addView(menuCard("PROFILE EDIT", "Update name, phone, and profile picture URL.", v -> showProfile()));
        grid.addView(menuCard("PAYMENTS", "Open membership payment and wallet pages.", v -> openWeb("/payments")));

        if (session.isLoggedIn()) {
            Button logout = outlineButton("LOGOUT");
            logout.setTextColor(DANGER);
            logout.setOnClickListener(v -> {
                session.clear();
                refreshStatus("Logged out");
                showHome();
            });
            content.addView(logout);
        }
    }

    private void showAuth() {
        setActiveNav("Auth");
        clear();
        LinearLayout auth = card();
        auth.addView(text(loginMode ? "BACK TO" : "JOIN THE", 34, TEXT, Typeface.BOLD));
        auth.addView(text(loginMode ? "GRIND AGAIN" : "ELITE COMMUNITY", 38, LIME, Typeface.BOLD));
        auth.addView(paragraph(loginMode
                ? "Welcome back. Sign in using the same deployed account as the web app."
                : "Create a member or staff account through the live API."));
        content.addView(auth);

        LinearLayout roleSelector = segmented();
        Button member = segment("MEMBER", selectedRole.equals("member"));
        Button admin = segment("ADMIN / STAFF", selectedRole.equals("admin"));
        member.setOnClickListener(v -> {
            selectedRole = "member";
            showAuth();
        });
        admin.setOnClickListener(v -> {
            selectedRole = "admin";
            showAuth();
        });
        roleSelector.addView(member, new LinearLayout.LayoutParams(0, dp(44), 1));
        roleSelector.addView(admin, new LinearLayout.LayoutParams(0, dp(44), 1));
        content.addView(roleSelector);

        EditText name = input("Full Name", false);
        EditText email = input("Email Address", false);
        EditText password = input("Password", true);
        if (!loginMode) {
            content.addView(field("FULL NAME", name));
        }
        content.addView(field("EMAIL ADDRESS", email));
        content.addView(field("PASSWORD", password));

        Button submit = primaryButton(loginMode ? "SIGN IN" : "REGISTER NOW");
        submit.setOnClickListener(v -> submitAuth(name, email, password));
        content.addView(submit);

        Button toggle = outlineButton(loginMode ? "CREATE ACCOUNT" : "BACK TO SIGN IN");
        toggle.setOnClickListener(v -> {
            loginMode = !loginMode;
            showAuth();
        });
        content.addView(toggle);

        Button forgot = textButton("FORGOT PASSWORD");
        forgot.setOnClickListener(v -> showForgotPassword());
        content.addView(forgot);
    }

    private void submitAuth(EditText name, EditText email, EditText password) {
        String emailValue = email.getText().toString().trim();
        String passwordValue = password.getText().toString();
        String nameValue = name.getText().toString().trim();
        if (emailValue.isEmpty() || passwordValue.isEmpty() || (!loginMode && nameValue.isEmpty())) {
            refreshStatus("Please fill in all required fields");
            return;
        }

        runTask(loginMode ? "Signing in..." : "Creating account...", () -> {
            JSONObject body = new JSONObject();
            body.put("email", emailValue);
            body.put("password", passwordValue);
            if (!loginMode) {
                body.put("full_name", nameValue);
                body.put("role", selectedRole);
            }

            String endpoint = loginMode ? "/api/auth/login" : "/api/auth/register";
            ApiClient.ApiResponse response = ApiClient.post(endpoint, body, "");
            JSONObject json = response.json();
            if (!response.ok() || !json.optBoolean("success")) {
                throw new Exception(json.optString("message", json.optString("error", "Authentication failed")));
            }

            if (loginMode) {
                session.saveLogin(
                        json.optString("token"),
                        json.optString("memberId"),
                        json.optString("full_name", "Member"),
                        json.optString("role", "member"),
                        json.optString("profile_picture"));
                main.post(() -> {
                    refreshStatus("Signed in");
                    showHome();
                });
            } else {
                main.post(() -> {
                    loginMode = true;
                    refreshStatus("Account created. Sign in now.");
                    showAuth();
                });
            }
        });
    }

    private void showForgotPassword() {
        setActiveNav("Auth");
        clear();
        pageHero("PASSWORD", "RECOVERY", "Request a reset email using the same SendGrid-backed endpoint as the web app.");
        EditText email = input("Email Address", false);
        content.addView(field("EMAIL ADDRESS", email));
        Button send = primaryButton("SEND RESET EMAIL");
        send.setOnClickListener(v -> {
            String value = email.getText().toString().trim();
            if (value.isEmpty()) {
                refreshStatus("Email is required");
                return;
            }
            runTask("Sending reset email...", () -> {
                JSONObject body = new JSONObject();
                body.put("email", value);
                ApiClient.ApiResponse response = ApiClient.post("/api/auth/forgot-password", body, "");
                JSONObject json = response.json();
                if (!response.ok() || !json.optBoolean("success")) {
                    throw new Exception(json.optString("message", "Could not send reset email"));
                }
                main.post(() -> refreshStatus(json.optString("message", "Reset email requested")));
            });
        });
        content.addView(send);
        Button web = outlineButton("OPEN WEB RECOVERY");
        web.setOnClickListener(v -> openWeb("/forgot-password"));
        content.addView(web);
    }

    private void showProfile() {
        setActiveNav("Profile");
        clear();
        pageHero("EDIT", "PROFILE", "Update your personal information and keep the Android session in sync.");
        if (!session.isLoggedIn()) {
            content.addView(menuCard("LOGIN REQUIRED", "Use native sign in or open the web profile page.", v -> showAuth()));
            Button web = outlineButton("OPEN WEB PROFILE");
            web.setOnClickListener(v -> openWeb("/profile"));
            content.addView(web);
            return;
        }
        Button load = outlineButton("REFRESH PROFILE");
        load.setOnClickListener(v -> loadProfile());
        content.addView(load);
        loadProfile();
    }

    private void loadProfile() {
        runTask("Loading profile...", () -> {
            ApiClient.ApiResponse response = ApiClient.get("/api/auth/profile", session.token());
            JSONObject json = response.json();
            if (!response.ok() || !json.optBoolean("success")) {
                throw new Exception(json.optString("message", "Profile load failed"));
            }
            JSONObject data = json.optJSONObject("data");
            if (data != null) {
                session.saveLogin(
                        session.token(),
                        data.optString("member_id", session.memberId()),
                        data.optString("full_name", session.fullName()),
                        data.optString("role", session.role()),
                        data.optString("profile_picture", session.profilePicture()));
            }
            main.post(() -> renderProfile(data == null ? new JSONObject() : data));
        });
    }

    private void renderProfile(JSONObject data) {
        refreshStatus("Profile loaded");
        clear();
        pageHero("EDIT", "PROFILE", "Update your personal information and profile picture URL.");

        LinearLayout profile = card();
        String profilePicture = data.optString("profile_picture", session.profilePicture());
        LinearLayout avatar = avatarView(data.optString("full_name", session.fullName()), profilePicture, 40, 64);
        LinearLayout.LayoutParams avatarParams = new LinearLayout.LayoutParams(dp(112), dp(112));
        avatarParams.gravity = Gravity.CENTER_HORIZONTAL;
        profile.addView(avatar, avatarParams);
        profile.addView(centerLabel(data.optString("member_id", session.memberId())));
        content.addView(profile);

        EditText email = input("Email Address", false);
        email.setText(data.optString("email"));
        email.setEnabled(false);
        EditText name = input("Full Name", false);
        name.setText(data.optString("full_name"));
        EditText phone = input("Phone Number", false);
        phone.setText(data.optString("phone"));
        EditText picture = input("Profile Picture URL", false);
        picture.setText(profilePicture);

        content.addView(field("EMAIL ADDRESS", email));
        content.addView(field("FULL NAME", name));
        content.addView(field("PHONE NUMBER", phone));
        content.addView(field("PROFILE PICTURE URL", picture));

        Button save = primaryButton("SAVE CHANGES");
        save.setOnClickListener(v -> {
            String nameValue = name.getText().toString().trim();
            if (nameValue.isEmpty()) {
                refreshStatus("Name is required");
                return;
            }
            runTask("Saving profile...", () -> {
                JSONObject body = new JSONObject();
                body.put("full_name", nameValue);
                body.put("phone", phone.getText().toString().trim());
                body.put("profile_picture", picture.getText().toString().trim());
                ApiClient.ApiResponse response = ApiClient.put("/api/auth/profile", body, session.token());
                JSONObject json = response.json();
                if (!response.ok() || !json.optBoolean("success")) {
                    throw new Exception(json.optString("message", "Profile save failed"));
                }
                session.saveLogin(session.token(), session.memberId(), nameValue, session.role(), picture.getText().toString().trim());
                main.post(() -> {
                    refreshStatus("Profile updated");
                    loadProfile();
                });
            });
        });
        content.addView(save);
    }

    private void showCourses() {
        setActiveNav("Courses");
        clear();
        pageHero("FITNESS", "COURSES", "Browse published classes from the deployed course service.");
        Button refresh = outlineButton("REFRESH COURSES");
        refresh.setOnClickListener(v -> loadCourses());
        content.addView(refresh);
        loadCourses();
    }

    private void loadCourses() {
        runTask("Loading courses...", () -> {
            ApiClient.ApiResponse response = ApiClient.get("/api/courses", "");
            JSONObject json = response.json();
            if (!response.ok() || !json.optBoolean("success")) {
                throw new Exception(json.optString("message", "Course load failed"));
            }
            JSONArray data = json.optJSONArray("data");
            main.post(() -> renderCourses(data == null ? new JSONArray() : data));
        });
    }

    private void renderCourses(JSONArray courses) {
        refreshStatus(courses.length() + " courses loaded");
        clear();
        pageHero("FITNESS", "COURSES", courses.length() + " published classes loaded.");
        Button web = outlineButton("OPEN FULL WEB COURSE PAGE");
        web.setOnClickListener(v -> openWeb("/courses"));
        content.addView(web);

        if (courses.length() == 0) {
            emptyState("No published courses returned from the deployed API.");
            return;
        }
        for (int i = 0; i < courses.length(); i++) {
            JSONObject course = courses.optJSONObject(i);
            if (course == null) {
                continue;
            }
            content.addView(courseCard(course));
        }
    }

    private View courseCard(JSONObject course) {
        LinearLayout card = card();
        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        TextView badge = chip(safe(course.optString("courseType"), "COURSE").toUpperCase(Locale.US), LIME);
        top.addView(badge);
        TextView level = text("  " + safe(course.optString("fitnessLevel"), "Level"), 12, MUTED, Typeface.BOLD);
        top.addView(level, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        card.addView(top);

        card.addView(text(safe(course.optString("courseName"), "Course").toUpperCase(Locale.US), 26, TEXT, Typeface.BOLD));
        card.addView(meta("TRAINER", safe(course.optString("instructor"), "-")));
        card.addView(meta("SCHEDULE", safe(course.optString("schedule"), "-")));

        int current = course.optInt("currentAttendees");
        int max = Math.max(1, course.optInt("maxAttendees", 1));
        card.addView(capacityBar(current, max));
        card.addView(meta("CAPACITY", current + "/" + max + " members"));

        int courseId = course.optInt("courseID");
        Button enroll = primaryButton(session.isLoggedIn() ? "ENROLL NOW" : "LOGIN TO ENROLL");
        enroll.setOnClickListener(v -> {
            if (!session.isLoggedIn()) {
                showAuth();
            } else {
                enrollCourse(courseId);
            }
        });
        card.addView(enroll);
        return card;
    }

    private void enrollCourse(int courseId) {
        runTask("Enrolling...", () -> {
            JSONObject body = new JSONObject();
            body.put("courseID", courseId);
            ApiClient.ApiResponse response = ApiClient.post("/api/courses/enroll", body, session.token());
            JSONObject json = response.json();
            if (!response.ok() || !json.optBoolean("success")) {
                throw new Exception(json.optString("message", "Enrollment failed"));
            }
            main.post(() -> {
                refreshStatus(json.optString("message", "Enrolled"));
                loadCourses();
            });
        });
    }

    private void showTrainers() {
        setActiveNav("Trainers");
        clear();
        pageHero("TRAINERS", "REVIEWS", "View trainer ratings and member review comments.");
        Button refresh = outlineButton("REFRESH TRAINERS");
        refresh.setOnClickListener(v -> loadTrainers());
        content.addView(refresh);
        loadTrainers();
    }

    private void loadTrainers() {
        runTask("Loading trainers...", () -> {
            ApiClient.ApiResponse response = ApiClient.get("/api/trainers", "");
            JSONObject json = response.json();
            if (!response.ok() || !json.optBoolean("success")) {
                throw new Exception(json.optString("message", "Trainer load failed"));
            }
            JSONArray data = json.optJSONArray("data");
            main.post(() -> renderTrainers(data == null ? new JSONArray() : data));
        });
    }

    private void renderTrainers(JSONArray trainers) {
        refreshStatus(trainers.length() + " trainers loaded");
        clear();
        pageHero("TRAINERS", "REVIEWS", trainers.length() + " active trainers loaded.");
        Button web = outlineButton("OPEN FULL WEB COURSE PAGE");
        web.setOnClickListener(v -> openWeb("/courses"));
        content.addView(web);
        if (trainers.length() == 0) {
            emptyState("No active trainers returned from the deployed API.");
            return;
        }
        for (int i = 0; i < trainers.length(); i++) {
            JSONObject trainer = trainers.optJSONObject(i);
            if (trainer == null) {
                continue;
            }
            content.addView(trainerCard(trainer));
        }
    }

    private View trainerCard(JSONObject trainer) {
        LinearLayout card = card();
        String name = safe(trainer.optString("name"), "Trainer");
        TextView initials = text(initials(name), 42, LIME, Typeface.BOLD);
        initials.setGravity(Gravity.CENTER);
        initials.setBackground(fillBox(BG_3, 8));
        card.addView(initials, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(112)));
        card.addView(text(name.toUpperCase(Locale.US), 24, TEXT, Typeface.BOLD));
        card.addView(chip(safe(trainer.optString("expertise"), "EXPERTISE"), LIME));
        card.addView(stars(trainer.optDouble("avgRating"), trainer.optInt("reviewCount")));
        card.addView(paragraph(safe(trainer.optString("bio"), "No trainer bio available.")));

        int trainerId = trainer.optInt("trainerID");
        Button reviews = outlineButton("LOAD REVIEWS");
        reviews.setTextColor(WARN);
        reviews.setOnClickListener(v -> loadReviews(trainerId, name));
        card.addView(reviews);
        return card;
    }

    private void loadReviews(int trainerId, String trainerName) {
        runTask("Loading reviews...", () -> {
            ApiClient.ApiResponse response = ApiClient.get("/api/trainers/" + trainerId + "/reviews", "");
            JSONObject json = response.json();
            if (!response.ok() || !json.optBoolean("success")) {
                throw new Exception(json.optString("message", "Review load failed"));
            }
            JSONArray data = json.optJSONArray("data");
            main.post(() -> renderReviews(trainerName, data == null ? new JSONArray() : data));
        });
    }

    private void renderReviews(String trainerName, JSONArray reviews) {
        refreshStatus(reviews.length() + " reviews loaded");
        clear();
        pageHero(trainerName.toUpperCase(Locale.US), "REVIEWS", reviews.length() + " visible reviews.");
        Button back = outlineButton("BACK TO TRAINERS");
        back.setOnClickListener(v -> showTrainers());
        content.addView(back);
        if (reviews.length() == 0) {
            emptyState("No visible reviews returned for this trainer.");
            return;
        }
        for (int i = 0; i < reviews.length(); i++) {
            JSONObject review = reviews.optJSONObject(i);
            if (review == null) {
                continue;
            }
            LinearLayout card = card();
            card.addView(stars(review.optDouble("rating"), 0));
            card.addView(paragraph(safe(review.optString("comment"), "No comment.")));
            content.addView(card);
        }
    }

    private void runTask(String message, Task task) {
        refreshStatus(message);
        executor.execute(() -> {
            try {
                task.run();
            } catch (Exception ex) {
                main.post(() -> refreshStatus(safe(ex.getMessage(), "Request failed")));
            }
        });
    }

    private void clear() {
        content.removeAllViews();
    }

    private void pageHero(String lineOne, String lineTwo, String desc) {
        LinearLayout hero = card();
        hero.addView(text(lineOne, 34, TEXT, Typeface.BOLD));
        hero.addView(text(lineTwo, 40, LIME, Typeface.BOLD));
        hero.addView(paragraph(desc));
        content.addView(hero);
    }

    private void sectionTitle(String value) {
        TextView title = text(value.toUpperCase(Locale.US), 18, TEXT, Typeface.BOLD);
        title.setPadding(0, dp(18), 0, dp(4));
        content.addView(title);
    }

    private View menuCard(String title, String desc, View.OnClickListener listener) {
        LinearLayout card = card();
        card.setOnClickListener(listener);
        card.addView(text(title, 22, LIME, Typeface.BOLD));
        card.addView(paragraph(desc));
        return card;
    }

    private LinearLayout statRow(String aLabel, String aValue, String bLabel, String bValue, String cLabel, String cValue) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, dp(16), 0, 0);
        row.addView(stat(aLabel, aValue), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        row.addView(stat(bLabel, bValue), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        row.addView(stat(cLabel, cValue), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        return row;
    }

    private LinearLayout stat(String label, String value) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(8), dp(10), dp(8), dp(10));
        box.setBackground(fillBox(Color.rgb(10, 10, 10), 10));
        TextView l = label(label);
        TextView v = text(value, 18, value.equals("ELITE MEMBER") ? LIME : TEXT, Typeface.BOLD);
        box.addView(l);
        box.addView(v);
        return box;
    }

    private LinearLayout card() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(18), dp(16), dp(18), dp(16));
        card.setBackground(borderBox(BG_2, BORDER, 12, 1));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, dp(10), 0, dp(8));
        card.setLayoutParams(params);
        return card;
    }

    private LinearLayout field(String label, EditText input) {
        LinearLayout wrapper = new LinearLayout(this);
        wrapper.setOrientation(LinearLayout.VERTICAL);
        wrapper.setPadding(0, dp(12), 0, 0);
        wrapper.addView(label(label));
        wrapper.addView(input);
        return wrapper;
    }

    private EditText input(String hint, boolean password) {
        EditText editText = new EditText(this);
        editText.setHint(hint);
        editText.setHintTextColor(MUTED);
        editText.setTextColor(TEXT);
        editText.setTextSize(15);
        editText.setSingleLine(true);
        editText.setInputType(password ? InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD : InputType.TYPE_CLASS_TEXT);
        editText.setBackground(borderBox(BG_3, BORDER, 4, 1));
        editText.setPadding(dp(14), 0, dp(14), 0);
        editText.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50)));
        return editText;
    }

    private Button primaryButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(BG);
        button.setTextSize(14);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setBackground(fillBox(LIME, 4));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48));
        params.setMargins(0, dp(14), 0, 0);
        button.setLayoutParams(params);
        return button;
    }

    private Button outlineButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(LIME);
        button.setTextSize(13);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setBackground(borderBox(Color.TRANSPARENT, LIME, 6, 1));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(46));
        params.setMargins(0, dp(12), 0, 0);
        button.setLayoutParams(params);
        return button;
    }

    private Button textButton(String label) {
        Button button = outlineButton(label);
        button.setBackgroundColor(Color.TRANSPARENT);
        button.setTextColor(MUTED);
        return button;
    }

    private Button miniButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(LIME);
        button.setTextSize(11);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setBackground(borderBox(Color.TRANSPARENT, LIME, 5, 1));
        button.setMinWidth(dp(64));
        return button;
    }

    private void addNav(LinearLayout nav, String label, View.OnClickListener listener) {
        Button button = miniButton(label);
        button.setOnClickListener(listener);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(42));
        params.setMargins(0, 0, dp(8), 0);
        nav.addView(button, params);
        navButtons.put(label, button);
        styleNavButton(button, false);
    }

    private void setActiveNav(String label) {
        for (Map.Entry<String, Button> entry : navButtons.entrySet()) {
            styleNavButton(entry.getValue(), entry.getKey().equals(label));
        }
    }

    private void styleNavButton(Button button, boolean active) {
        button.setTextColor(active ? BG : TEXT);
        button.setBackground(active ? fillBox(LIME, 100) : borderBox(Color.TRANSPARENT, BORDER, 100, 1));
    }

    private LinearLayout segmented() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(dp(5), dp(5), dp(5), dp(5));
        row.setBackground(borderBox(BG_3, BORDER, 4, 1));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(56));
        params.setMargins(0, dp(12), 0, dp(4));
        row.setLayoutParams(params);
        return row;
    }

    private Button segment(String label, boolean active) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextSize(12);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setTextColor(active ? BG : MUTED);
        button.setBackground(active ? fillBox(LIME, 2) : fillBox(Color.TRANSPARENT, 2));
        return button;
    }

    private TextView capacityBar(int current, int max) {
        TextView bar = new TextView(this);
        int pct = Math.max(4, Math.min(100, (int) ((current * 100f) / Math.max(1, max))));
        int color = pct >= 100 ? DANGER : pct >= 75 ? WARN : LIME;
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{color, color, BORDER, BORDER});
        bg.setCornerRadius(dp(2));
        bar.setBackground(bg);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(4));
        params.setMargins(0, dp(14), 0, dp(4));
        bar.setLayoutParams(params);
        bar.setText(String.valueOf(pct));
        bar.setTextColor(Color.TRANSPARENT);
        return bar;
    }

    private TextView stars(double rating, int count) {
        int rounded = (int) Math.round(rating);
        StringBuilder builder = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            builder.append(i <= rounded ? "*" : ".");
        }
        String suffix = count > 0 ? "  " + String.format(Locale.US, "%.1f", rating) + " (" + count + ")" : "  " + String.format(Locale.US, "%.1f", rating);
        TextView view = text(builder + suffix, 14, WARN, Typeface.BOLD);
        view.setPadding(0, dp(8), 0, dp(4));
        return view;
    }

    private TextView meta(String label, String value) {
        TextView view = text(label + ": " + value, 13, MUTED, Typeface.NORMAL);
        view.setPadding(0, dp(4), 0, 0);
        return view;
    }

    private TextView chip(String value, int color) {
        TextView chip = text(value, 11, color, Typeface.BOLD);
        chip.setPadding(dp(8), dp(4), dp(8), dp(4));
        chip.setBackground(borderBox(Color.argb(18, Color.red(color), Color.green(color), Color.blue(color)), color, 4, 1));
        return chip;
    }

    private TextView paragraph(String value) {
        TextView view = text(value, 14, MUTED, Typeface.NORMAL);
        view.setPadding(0, dp(8), 0, dp(4));
        return view;
    }

    private TextView label(String value) {
        return text(value, 10, MUTED, Typeface.BOLD);
    }

    private TextView centerLabel(String value) {
        TextView view = chip(value == null || value.isEmpty() ? "MEMBER" : value, LIME);
        view.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.gravity = Gravity.CENTER_HORIZONTAL;
        params.setMargins(0, dp(12), 0, 0);
        view.setLayoutParams(params);
        return view;
    }

    private LinearLayout avatarView(String name, String profilePicture, int textSize, int radius) {
        LinearLayout holder = new LinearLayout(this);
        holder.setGravity(Gravity.CENTER);
        holder.setPadding(dp(3), dp(3), dp(3), dp(3));
        holder.setBackground(borderBox(BG_3, LIME, radius, 2));

        TextView fallback = text(initials(name), textSize, LIME, Typeface.BOLD);
        fallback.setGravity(Gravity.CENTER);
        holder.addView(fallback, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        if (profilePicture != null && !profilePicture.trim().isEmpty() && !"null".equals(profilePicture)) {
            loadProfilePicture(profilePicture.trim(), holder);
        }
        return holder;
    }

    private void loadProfilePicture(String profilePicture, LinearLayout holder) {
        executor.execute(() -> {
            try {
                Bitmap bitmap = decodeProfilePicture(profilePicture);
                if (bitmap == null) {
                    return;
                }
                main.post(() -> {
                    holder.removeAllViews();
                    ImageView image = new ImageView(this);
                    image.setImageBitmap(bitmap);
                    image.setScaleType(ImageView.ScaleType.CENTER_CROP);
                    image.setAdjustViewBounds(false);
                    image.setBackground(fillBox(BG_3, 58));
                    holder.addView(image, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                });
            } catch (Exception ignored) {
                main.post(() -> refreshStatus("Profile loaded; image preview unavailable"));
            }
        });
    }

    private Bitmap decodeProfilePicture(String profilePicture) throws Exception {
        if (profilePicture.startsWith("data:image")) {
            int comma = profilePicture.indexOf(',');
            if (comma < 0 || comma == profilePicture.length() - 1) {
                return null;
            }
            byte[] bytes = Base64.decode(profilePicture.substring(comma + 1), Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        }

        if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
            try (InputStream stream = new URL(profilePicture).openStream()) {
                return BitmapFactory.decodeStream(stream);
            }
        }
        return null;
    }

    private TextView text(String value, int sp, int color, int style) {
        TextView textView = new TextView(this);
        textView.setText(value == null ? "" : value);
        textView.setTextSize(sp);
        textView.setTextColor(color);
        textView.setTypeface(Typeface.DEFAULT, style);
        textView.setIncludeFontPadding(true);
        return textView;
    }

    private void emptyState(String message) {
        LinearLayout empty = card();
        empty.setBackground(borderBox(Color.TRANSPARENT, BORDER, 10, 1));
        empty.addView(paragraph(message));
        content.addView(empty);
    }

    private GradientDrawable fillBox(int fill, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fill);
        drawable.setCornerRadius(dp(radius));
        return drawable;
    }

    private GradientDrawable borderBox(int fill, int stroke, int radius, int width) {
        GradientDrawable drawable = fillBox(fill, radius);
        drawable.setStroke(dp(width), stroke);
        return drawable;
    }

    private void openWeb(String path) {
        Intent intent = new Intent(this, WebFallbackActivity.class);
        intent.putExtra(WebFallbackActivity.EXTRA_PATH, path);
        startActivity(intent);
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private String safe(String value, String fallback) {
        return value == null || value.trim().isEmpty() || "null".equals(value) ? fallback : value;
    }

    private String initials(String value) {
        String clean = safe(value, "?").trim();
        String[] parts = clean.split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                builder.append(part.charAt(0));
            }
            if (builder.length() == 2) {
                break;
            }
        }
        return builder.length() == 0 ? "?" : builder.toString().toUpperCase(Locale.US);
    }

    interface Task {
        void run() throws Exception;
    }
}
