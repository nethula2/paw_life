package com.pawlife;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.*;

public class GroomingHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            HttpUtils.handleCorsPreflight(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/grooming/queue") && "GET".equalsIgnoreCase(method)) {
                handleGetQueue(exchange);
            } else if (path.startsWith("/api/grooming/sessions/") && path.endsWith("/status") && "PUT".equalsIgnoreCase(method)) {
                String sub = path.substring("/api/grooming/sessions/".length());
                String idStr = sub.substring(0, sub.indexOf("/status"));
                handleUpdateStatus(exchange, Long.parseLong(idStr));
            } else if (path.equals("/api/grooming/services") && "GET".equalsIgnoreCase(method)) {
                handleGetServices(exchange);
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

    private void handleGetQueue(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> queue = Database.query(
            "SELECT gs.*, p.pet_name, p.breed, p.photo_url AS pet_photo, s.service_name, s.category AS service_category, " +
            "u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone " +
            "FROM grooming_sessions gs " +
            "JOIN pets p ON gs.pet_id = p.pet_id " +
            "LEFT JOIN grooming_services s ON gs.service_id = s.service_id " +
            "LEFT JOIN pet_owners o ON p.owner_id = o.owner_id " +
            "LEFT JOIN users u ON o.user_id = u.user_id " +
            "ORDER BY gs.session_id ASC"
        );
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("queue", queue);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleUpdateStatus(HttpExchange exchange, long sessionId) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String newStatus = (String) body.get("progress_status");
        String obs = (String) body.getOrDefault("observations", "Grooming session updated.");

        if (newStatus == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Progress status is required.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        Database.executeUpdate(
            "UPDATE grooming_sessions SET progress_status = ?, observations = ? WHERE session_id = ?",
            newStatus, obs, sessionId
        );

        boolean notified = false;
        if ("Ready for Pick-up".equalsIgnoreCase(newStatus)) {
            notified = true;
            Database.addNotification(8,
                "Ready for Pick-up Alert: Pet grooming session #" + sessionId + " is complete and ready for collection.",
                "Grooming Alert");
        }

        Database.logAudit(7, "Warnakulasuriya G.A.D.T.S (Grooming)", "GROOMING_STATUS_UPDATE", "Grooming Workflow",
            "Advanced session #" + sessionId + " to " + newStatus + ". Owner notified: " + notified);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("session_id", sessionId);
        res.put("new_status", newStatus);
        res.put("owner_notified", notified);
        res.put("message", "Session updated to " + newStatus + (notified ? " and owner notification dispatched." : "."));
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetServices(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> services = Database.query("SELECT * FROM grooming_services ORDER BY price ASC");
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("services", services);
        HttpUtils.sendJson(exchange, 200, res);
    }
}
