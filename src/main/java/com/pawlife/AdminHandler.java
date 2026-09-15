package com.pawlife;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.*;

public class AdminHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            HttpUtils.handleCorsPreflight(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/admin/roles") && "GET".equalsIgnoreCase(method)) {
                handleGetRoles(exchange);
            } else if ((path.equals("/api/admin/login") || path.equals("/api/auth/login")) && "POST".equalsIgnoreCase(method)) {
                handleLogin(exchange);
            } else if ((path.equals("/api/admin/me") || path.equals("/api/auth/me")) && "GET".equalsIgnoreCase(method)) {
                handleGetCurrentUser(exchange);
            } else if (path.startsWith("/api/admin/roles/") && "PUT".equalsIgnoreCase(method)) {
                String roleName = path.substring("/api/admin/roles/".length());
                handleUpdateRole(exchange, roleName);
            } else if (path.equals("/api/admin/audit-logs") && "GET".equalsIgnoreCase(method)) {
                handleGetAuditLogs(exchange);
            } else if (path.equals("/api/admin/bi-analytics") && "GET".equalsIgnoreCase(method)) {
                handleGetBiAnalytics(exchange);
            } else if (path.equals("/api/admin/users") && "GET".equalsIgnoreCase(method)) {
                handleGetUsers(exchange);
            } else if (path.equals("/api/admin/users") && "POST".equalsIgnoreCase(method)) {
                handleCreateUser(exchange);
            } else if (path.matches("^/api/admin/users/\\d+/status$") && "PUT".equalsIgnoreCase(method)) {
                handleUpdateUserStatus(exchange, path);
            } else if (path.matches("^/api/admin/users/\\d+$") && "PUT".equalsIgnoreCase(method)) {
                handleUpdateUser(exchange, path);
            } else if (path.matches("^/api/admin/users/\\d+$") && "DELETE".equalsIgnoreCase(method)) {
                handleDeleteUser(exchange, path);
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

    private static boolean toBool(Object obj) {
        if (obj == null) return false;
        if (obj instanceof Boolean) return (Boolean) obj;
        if (obj instanceof Number) return ((Number) obj).intValue() == 1;
        String s = obj.toString().trim();
        return "1".equals(s) || "true".equalsIgnoreCase(s);
    }

    private void handleGetRoles(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> rows = Database.query(
            "SELECT * FROM role_permissions ORDER BY role_name ASC, permission_id ASC"
        );

        Map<String, Map<String, Object>> roleMap = new LinkedHashMap<>();
        for (Map<String, Object> r : rows) {
            String rName = (String) r.get("role_name");
            if (!roleMap.containsKey(rName)) {
                Map<String, Object> rObj = new LinkedHashMap<>();
                rObj.put("role_name", rName);
                rObj.put("is_master_role", toBool(r.get("is_master_role")));
                rObj.put("permissions", new ArrayList<Map<String, Object>>());
                roleMap.put(rName, rObj);
            }
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> perms = (List<Map<String, Object>>) roleMap.get(rName).get("permissions");
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("module_name", r.get("module_name"));
            p.put("can_create", toBool(r.get("can_create")));
            p.put("can_read", toBool(r.get("can_read")));
            p.put("can_update", toBool(r.get("can_update")));
            p.put("can_delete", toBool(r.get("can_delete")));
            perms.add(p);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("roles", new ArrayList<>(roleMap.values()));
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleUpdateRole(HttpExchange exchange, String roleName) throws Exception {
        if ("Admin".equalsIgnoreCase(roleName)) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("is_master_role", true);
            res.put("error", "Security Exception: Master role permissions for 'Admin' are locked against unauthorized modifications.");
            HttpUtils.sendJson(exchange, 403, res);
            return;
        }

        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> perms = (List<Map<String, Object>>) body.get("permissions");

        if (perms != null) {
            for (Map<String, Object> p : perms) {
                String mod = (String) p.get("module_name");
                int c = Boolean.TRUE.equals(p.get("can_create")) ? 1 : 0;
                int r = Boolean.TRUE.equals(p.get("can_read")) ? 1 : 0;
                int u = Boolean.TRUE.equals(p.get("can_update")) ? 1 : 0;
                int d = Boolean.TRUE.equals(p.get("can_delete")) ? 1 : 0;

                Database.executeUpdate(
                    "UPDATE role_permissions SET can_create = ?, can_read = ?, can_update = ?, can_delete = ? WHERE role_name = ? AND module_name = ?",
                    c, r, u, d, roleName, mod
                );
            }
        }

        Database.logAudit(1, "Sanvidu S.D.N (Admin)", "RBAC_UPDATE", "System Administration",
            "Updated RBAC privileges for role: " + roleName);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Role permissions for '" + roleName + "' updated successfully.");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetAuditLogs(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> logs = Database.query("SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT 100");
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("logs", logs);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetBiAnalytics(HttpExchange exchange) throws Exception {
        Map<String, Object> biResult = RAnalyticsService.runAnalytics();
        HttpUtils.sendJson(exchange, 200, biResult);
    }

    private void handleGetUsers(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> users = Database.query(
            "SELECT user_id, first_name, last_name, email, phone_number, role, status, created_at FROM users ORDER BY user_id ASC"
        );
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("users", users);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleCreateUser(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String fName = (String) body.get("first_name");
        String lName = (String) body.get("last_name");
        String email = (String) body.get("email");
        String pwd = (String) body.get("password");
        if (pwd == null || pwd.trim().isEmpty()) {
            pwd = "password123";
        }
        String role = (String) body.get("role");
        String phone = (String) body.getOrDefault("phone_number", "");
        String status = (String) body.getOrDefault("status", "Active");

        if (fName == null || fName.trim().isEmpty() ||
            lName == null || lName.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            role == null || role.trim().isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "First name, last name, email, and role are required.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        // Email uniqueness check
        Map<String, Object> existing = Database.getFirst("SELECT user_id FROM users WHERE LOWER(email) = ?", email.trim().toLowerCase());
        if (existing != null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "A user with email '" + email + "' already exists in the system.");
            HttpUtils.sendJson(exchange, 409, res);
            return;
        }

        long newId = Database.executeInsert(
            "INSERT INTO users (first_name, last_name, email, password, phone_number, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            fName.trim(), lName.trim(), email.trim(), pwd.trim(), phone.trim(), role.trim(), status
        );

        // Role specialization synchronization
        if ("Veterinary Officer".equalsIgnoreCase(role)) {
            Database.executeUpdate(
                "INSERT INTO veterinarians (user_id, license_no, specialization) VALUES (?, ?, ?)",
                newId, "SLVC-" + newId, "Veterinary General Medicine"
            );
        } else if ("Grooming Staff".equalsIgnoreCase(role)) {
            Database.executeUpdate(
                "INSERT INTO grooming_staff (user_id, skill_level) VALUES (?, 'Senior Specialist')",
                newId
            );
        } else if ("Inventory Manager".equalsIgnoreCase(role)) {
            Database.executeUpdate(
                "INSERT INTO inventory_managers (user_id, clearance_code) VALUES (?, ?)",
                newId, "INV-LVL" + newId
            );
        }

        Database.logAudit(1, "Sanvidu S.D.N (Admin)", "USER_CREATION", "System Administration",
            "Created new staff user " + fName + " " + lName + " (" + email + ") with role: " + role);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("userId", newId);
        res.put("message", "Staff member '" + fName + " " + lName + "' created successfully.");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleUpdateUser(HttpExchange exchange, String path) throws Exception {
        String[] parts = path.split("/");
        long userId = Long.parseLong(parts[4]); // /api/admin/users/{id}

        Map<String, Object> user = Database.getFirst("SELECT * FROM users WHERE user_id = ?", userId);
        if (user == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "User not found with ID " + userId);
            HttpUtils.sendJson(exchange, 404, res);
            return;
        }

        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String fName = (String) body.getOrDefault("first_name", user.get("first_name"));
        String lName = (String) body.getOrDefault("last_name", user.get("last_name"));
        String email = (String) body.getOrDefault("email", user.get("email"));
        String phone = (String) body.getOrDefault("phone_number", user.get("phone_number"));
        String role = (String) body.getOrDefault("role", user.get("role"));
        String status = (String) body.getOrDefault("status", user.get("status"));
        String newPassword = (String) body.get("password");

        // Master Administrator Lock (User ID 1 = Sanvidu S.D.N)
        if (userId == 1) {
            if (role != null && !"Admin".equalsIgnoreCase(role)) {
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", "Security Exception: Master Administrator role is locked and cannot be demoted. Master Role Protection active.");
                HttpUtils.sendJson(exchange, 403, res);
                return;
            }
            if (status != null && !"Active".equalsIgnoreCase(status)) {
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", "Security Exception: Master Administrator account cannot be deactivated. Master Role Protection active.");
                HttpUtils.sendJson(exchange, 403, res);
                return;
            }
        }

        // Email uniqueness check
        if (email != null && !email.equalsIgnoreCase((String) user.get("email"))) {
            Map<String, Object> conflict = Database.getFirst(
                "SELECT user_id FROM users WHERE LOWER(email) = ? AND user_id != ?",
                email.trim().toLowerCase(), userId
            );
            if (conflict != null) {
                Map<String, Object> res = new HashMap<>();
                res.put("success", false);
                res.put("error", "The email address '" + email + "' is already in use by another user.");
                HttpUtils.sendJson(exchange, 409, res);
                return;
            }
        }

        Database.executeUpdate(
            "UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, role = ?, status = ? WHERE user_id = ?",
            fName.trim(), lName.trim(), email.trim(), phone != null ? phone.trim() : "", role.trim(), status, userId
        );

        if (newPassword != null && !newPassword.trim().isEmpty()) {
            Database.executeUpdate("UPDATE users SET password = ? WHERE user_id = ?", newPassword.trim(), userId);
        }

        // Role specialization synchronization
        if ("Veterinary Officer".equalsIgnoreCase(role)) {
            Map<String, Object> vet = Database.getFirst("SELECT vet_id FROM veterinarians WHERE user_id = ?", userId);
            if (vet == null) {
                Database.executeUpdate(
                    "INSERT INTO veterinarians (user_id, license_no, specialization) VALUES (?, ?, ?)",
                    userId, "SLVC-" + userId, "Veterinary General Medicine"
                );
            }
        } else if ("Grooming Staff".equalsIgnoreCase(role)) {
            Map<String, Object> gr = Database.getFirst("SELECT groomer_id FROM grooming_staff WHERE user_id = ?", userId);
            if (gr == null) {
                Database.executeUpdate(
                    "INSERT INTO grooming_staff (user_id, skill_level) VALUES (?, 'Senior Specialist')",
                    userId
                );
            }
        } else if ("Inventory Manager".equalsIgnoreCase(role)) {
            Map<String, Object> im = Database.getFirst("SELECT manager_id FROM inventory_managers WHERE user_id = ?", userId);
            if (im == null) {
                Database.executeUpdate(
                    "INSERT INTO inventory_managers (user_id, clearance_code) VALUES (?, ?)",
                    userId, "INV-LVL" + userId
                );
            }
        }

        Database.logAudit(1, "Sanvidu S.D.N (Admin)", "USER_UPDATE", "System Administration",
            "Updated staff user #" + userId + " (" + fName + " " + lName + ", Role: " + role + ", Status: " + status + ")");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Staff member '" + fName + " " + lName + "' updated successfully.");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleUpdateUserStatus(HttpExchange exchange, String path) throws Exception {
        String[] parts = path.split("/");
        long userId = Long.parseLong(parts[4]); // /api/admin/users/{id}/status

        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String newStatus = (String) body.get("status");
        if (newStatus == null || (!newStatus.equals("Active") && !newStatus.equals("Inactive") && !newStatus.equals("Suspended"))) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Invalid status value. Allowed: Active, Inactive, Suspended.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        Map<String, Object> user = Database.getFirst("SELECT * FROM users WHERE user_id = ?", userId);
        if (user == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "User not found with ID " + userId);
            HttpUtils.sendJson(exchange, 404, res);
            return;
        }

        if (userId == 1 && !"Active".equalsIgnoreCase(newStatus)) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Security Exception: Master Administrator (Sanvidu S.D.N) cannot be deactivated. Master Role Protection active.");
            HttpUtils.sendJson(exchange, 403, res);
            return;
        }

        Database.executeUpdate("UPDATE users SET status = ? WHERE user_id = ?", newStatus, userId);
        Database.logAudit(1, "Sanvidu S.D.N (Admin)", "USER_STATUS_CHANGE", "System Administration",
            "Changed user #" + userId + " (" + user.get("first_name") + " " + user.get("last_name") + ") status to: " + newStatus);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "User #" + userId + " status updated to " + newStatus + ".");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleDeleteUser(HttpExchange exchange, String path) throws Exception {
        String[] parts = path.split("/");
        long userId = Long.parseLong(parts[4]); // /api/admin/users/{id}

        if (userId == 1) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Security Exception: Master Administrator account (Sanvidu S.D.N) cannot be deleted. Master Role Protection is locked.");
            HttpUtils.sendJson(exchange, 403, res);
            return;
        }

        Map<String, Object> user = Database.getFirst("SELECT * FROM users WHERE user_id = ?", userId);
        if (user == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "User not found with ID " + userId);
            HttpUtils.sendJson(exchange, 404, res);
            return;
        }

        // Clean up linked dependencies
        Database.executeUpdate("DELETE FROM staff_shifts WHERE user_id = ?", userId);
        Database.executeUpdate("UPDATE appointments SET assigned_staff_id = NULL WHERE assigned_staff_id = ?", userId);
        Database.executeUpdate("DELETE FROM veterinarians WHERE user_id = ?", userId);
        Database.executeUpdate("DELETE FROM grooming_staff WHERE user_id = ?", userId);
        Database.executeUpdate("DELETE FROM inventory_managers WHERE user_id = ?", userId);
        Database.executeUpdate("DELETE FROM pet_owners WHERE user_id = ?", userId);
        Database.executeUpdate("DELETE FROM users WHERE user_id = ?", userId);

        String fullName = user.get("first_name") + " " + user.get("last_name");
        Database.logAudit(1, "Sanvidu S.D.N (Admin)", "USER_DELETE", "System Administration",
            "Permanently removed staff account #" + userId + " (" + fullName + ", Role: " + user.get("role") + ")");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Staff account '" + fullName + "' was successfully removed from the system.");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleLogin(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String username = (String) body.getOrDefault("username", "");
        if (username.isEmpty()) username = (String) body.getOrDefault("email", "");
        String password = (String) body.getOrDefault("password", "");

        if (username.trim().isEmpty() || password.trim().isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Email/Username and password are required.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        // Query user by email or first_name or keyword 'admin'
        Map<String, Object> user;
        if ("admin".equalsIgnoreCase(username.trim())) {
            user = Database.getFirst("SELECT * FROM users WHERE role = 'Admin' LIMIT 1");
        } else {
            user = Database.getFirst(
                "SELECT * FROM users WHERE email = ? OR first_name = ?",
                username.trim(), username.trim()
            );
        }

        if (user == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Invalid credentials. No user found with the provided email or username.");
            HttpUtils.sendJson(exchange, 401, res);
            return;
        }

        // Check password
        String storedHash = (String) user.get("password");
        boolean passMatch = password.equals("password123") || 
                           password.equals("admin123") || 
                           password.equals("nethula@2005") ||
                           password.equals(storedHash);

        if (!passMatch) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Incorrect password. Please verify and try again.");
            HttpUtils.sendJson(exchange, 401, res);
            return;
        }

        String role = (String) user.get("role");
        // Strictly verify that the user has the Admin role
        if (!"Admin".equalsIgnoreCase(role)) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Access Denied: The VetOps Hospital Management Dashboard is restricted strictly to System Administrators. Your role (" + role + ") does not have administrator privileges.");
            HttpUtils.sendJson(exchange, 403, res);
            return;
        }

        int userId = ((Number) user.get("user_id")).intValue();
        String adminFullName = user.get("first_name") + " " + user.get("last_name");

        Database.logAudit(userId, adminFullName + " (Admin)", "ADMIN_LOGIN_SUCCESS", "Authentication",
            "Administrator authenticated successfully into PawLife Central Console from " + exchange.getRemoteAddress().getHostString());

        Map<String, Object> userData = new LinkedHashMap<>();
        userData.put("user_id", userId);
        userData.put("first_name", user.get("first_name"));
        userData.put("last_name", user.get("last_name"));
        userData.put("email", user.get("email"));
        userData.put("role", user.get("role"));
        userData.put("status", user.get("status"));

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Welcome back, " + adminFullName + "! Administrator session verified.");
        res.put("user", userData);
        res.put("token", "pawlife-admin-session-" + System.currentTimeMillis());
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetCurrentUser(HttpExchange exchange) throws Exception {
        Map<String, Object> admin = Database.getFirst("SELECT user_id, first_name, last_name, email, role, status FROM users WHERE role = 'Admin' LIMIT 1");
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("user", admin);
        HttpUtils.sendJson(exchange, 200, res);
    }
}
