package com.pawlife;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.*;

public class NotificationHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            HttpUtils.handleCorsPreflight(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/notifications") && "GET".equalsIgnoreCase(method)) {
                handleGetNotifications(exchange);
            } else if (path.startsWith("/api/notifications/") && path.endsWith("/read")) {
                String sub = path.substring("/api/notifications/".length());
                String idStr = sub.substring(0, sub.indexOf("/read"));
                handleMarkRead(exchange, Long.parseLong(idStr));
            } else {
                Map<String, Object> err = new HashMap<>();
                err.put("success", false);
                err.put("error", "Endpoint not found: " + path);
                HttpUtils.sendJson(exchange, 404, err);
            }
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            HttpUtils.sendJson(exchange, 500, err);
        }
    }

    private void handleGetNotifications(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> notifs = Database.query(
            "SELECT * FROM notifications ORDER BY notification_id DESC LIMIT 30"
        );
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("notifications", notifs);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleMarkRead(HttpExchange exchange, long notifId) throws Exception {
        Database.executeUpdate("UPDATE notifications SET is_read = 1 WHERE notification_id = ?", notifId);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Notification marked as read.");
        HttpUtils.sendJson(exchange, 200, res);
    }
}
