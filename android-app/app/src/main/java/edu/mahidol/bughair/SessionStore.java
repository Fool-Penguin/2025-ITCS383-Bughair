package edu.mahidol.bughair;

import android.content.Context;
import android.content.SharedPreferences;

final class SessionStore {
    private static final String PREFS = "bughair_session";
    private static final String TOKEN = "token";
    private static final String MEMBER_ID = "member_id";
    private static final String FULL_NAME = "full_name";
    private static final String ROLE = "role";
    private static final String PROFILE_PICTURE = "profile_picture";

    private final SharedPreferences prefs;

    SessionStore(Context context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    void saveLogin(String token, String memberId, String fullName, String role) {
        saveLogin(token, memberId, fullName, role, profilePicture());
    }

    void saveLogin(String token, String memberId, String fullName, String role, String profilePicture) {
        prefs.edit()
                .putString(TOKEN, token)
                .putString(MEMBER_ID, memberId)
                .putString(FULL_NAME, fullName)
                .putString(ROLE, role)
                .putString(PROFILE_PICTURE, profilePicture)
                .apply();
    }

    void clear() {
        prefs.edit().clear().apply();
    }

    String token() {
        return prefs.getString(TOKEN, "");
    }

    String memberId() {
        return prefs.getString(MEMBER_ID, "");
    }

    String fullName() {
        return prefs.getString(FULL_NAME, "");
    }

    String role() {
        return prefs.getString(ROLE, "");
    }

    String profilePicture() {
        return prefs.getString(PROFILE_PICTURE, "");
    }

    boolean isLoggedIn() {
        return !token().isEmpty();
    }
}
