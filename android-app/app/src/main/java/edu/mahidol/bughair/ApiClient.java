package edu.mahidol.bughair;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

final class ApiClient {
    private ApiClient() {
    }

    static ApiResponse get(String path, String token) throws Exception {
        return request("GET", path, null, token);
    }

    static ApiResponse post(String path, JSONObject body, String token) throws Exception {
        return request("POST", path, body, token);
    }

    static ApiResponse put(String path, JSONObject body, String token) throws Exception {
        return request("PUT", path, body, token);
    }

    static ApiResponse patch(String path, JSONObject body, String token) throws Exception {
        return request("PATCH", path, body, token);
    }

    static ApiResponse delete(String path, String token) throws Exception {
        return request("DELETE", path, null, token);
    }

    private static ApiResponse request(String method, String path, JSONObject body, String token) throws Exception {
        URL url = new URL(BughairConfig.webUrl(path));
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(20000);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Content-Type", "application/json");
        if (token != null && !token.isEmpty()) {
            connection.setRequestProperty("Authorization", "Bearer " + token);
        }

        if (body != null) {
            connection.setDoOutput(true);
            try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(connection.getOutputStream(), StandardCharsets.UTF_8))) {
                writer.write(body.toString());
            }
        }

        int status = connection.getResponseCode();
        InputStream stream = status >= 200 && status < 400 ? connection.getInputStream() : connection.getErrorStream();
        String responseBody = readAll(stream);
        connection.disconnect();
        return new ApiResponse(status, responseBody);
    }

    private static String readAll(InputStream stream) throws Exception {
        if (stream == null) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        }
        return builder.toString();
    }

    static final class ApiResponse {
        final int status;
        final String body;

        ApiResponse(int status, String body) {
            this.status = status;
            this.body = body;
        }

        JSONObject json() throws Exception {
            return body == null || body.isEmpty() ? new JSONObject() : new JSONObject(body);
        }

        boolean ok() {
            return status >= 200 && status < 300;
        }
    }
}
