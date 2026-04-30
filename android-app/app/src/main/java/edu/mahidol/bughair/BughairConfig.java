package edu.mahidol.bughair;

final class BughairConfig {
    static final String BASE_URL = "https://two025-itcs383-bughair-1.onrender.com";

    private BughairConfig() {
    }

    static String webUrl(String path) {
        if (path == null || path.isEmpty()) {
            return BASE_URL;
        }
        return path.startsWith("/") ? BASE_URL + path : BASE_URL + "/" + path;
    }
}
