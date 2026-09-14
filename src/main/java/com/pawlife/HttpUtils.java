package com.pawlife;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.lang.reflect.Type;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class HttpUtils {
    public static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Type MAP_TYPE = new TypeToken<Map<String, Object>>() {}.getType();

    public static void sendJson(HttpExchange exchange, int statusCode, Object data) throws IOException {
        String json = GSON.toJson(data);
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    public static Map<String, Object> readJsonBody(HttpExchange exchange) {
        try (InputStream is = exchange.getRequestBody();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            String content = sb.toString().trim();
            if (content.isEmpty()) {
                return new HashMap<>();
            }
            return GSON.fromJson(content, MAP_TYPE);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public static Map<String, String> parseQueryParams(HttpExchange exchange) {
        Map<String, String> queryMap = new HashMap<>();
        String query = exchange.getRequestURI().getRawQuery();
        if (query == null || query.isEmpty()) return queryMap;

        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length > 1) {
                try {
                    queryMap.put(
                        URLDecoder.decode(pair[0], StandardCharsets.UTF_8.name()),
                        URLDecoder.decode(pair[1], StandardCharsets.UTF_8.name())
                    );
                } catch (Exception ignored) {}
            } else if (pair.length == 1) {
                queryMap.put(pair[0], "");
            }
        }
        return queryMap;
    }

    public static void handleCorsPreflight(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(204, -1);
    }

    public static int toInt(Object val, int def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return (int) Double.parseDouble(val.toString().trim()); } catch (Exception e) { return def; }
    }

    public static long toLong(Object val, long def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).longValue();
        try { return (long) Double.parseDouble(val.toString().trim()); } catch (Exception e) { return def; }
    }

    public static double toDouble(Object val, double def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString().trim()); } catch (Exception e) { return def; }
    }
}
