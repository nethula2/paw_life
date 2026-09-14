package com.pawlife;

import java.sql.*;
import java.util.*;

public class Database {
    public static final String MYSQL_URL = "jdbc:mysql://127.0.0.1:3306/paw_life?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    public static final String MYSQL_USER = "root";
    public static final String MYSQL_PASSWORD = "nethula@2005";
    public static final String SQLITE_URL = "jdbc:sqlite:database/pawlife.db";

    private static boolean useMySQL = true;

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            try (Connection conn = DriverManager.getConnection(MYSQL_URL, MYSQL_USER, MYSQL_PASSWORD)) {
                System.out.println("✅ [Database] Successfully connected to MySQL Server (127.0.0.1:3306/paw_life) for MySQL Workbench.");
                useMySQL = true;
            } catch (SQLException e) {
                System.err.println("⚠️ MySQL connection failed, falling back to SQLite: " + e.getMessage());
                useMySQL = false;
            }
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL Driver not found, using SQLite: " + e.getMessage());
            useMySQL = false;
        }

        if (!useMySQL) {
            try {
                Class.forName("org.sqlite.JDBC");
                System.out.println("✅ [Database] Connected to SQLite database: database/pawlife.db");
            } catch (ClassNotFoundException e) {
                System.err.println("SQLite JDBC Driver not found: " + e.getMessage());
            }
        }
    }

    public static boolean isUsingMySQL() {
        return useMySQL;
    }

    public static Connection getConnection() throws SQLException {
        if (useMySQL) {
            Connection conn = DriverManager.getConnection(MYSQL_URL, MYSQL_USER, MYSQL_PASSWORD);
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("SET SESSION sql_mode = 'PIPES_AS_CONCAT,STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';");
            }
            return conn;
        } else {
            Connection conn = DriverManager.getConnection(SQLITE_URL);
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("PRAGMA foreign_keys = ON;");
            }
            return conn;
        }
    }

    public static List<Map<String, Object>> query(String sql, Object... params) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                int cols = meta.getColumnCount();
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= cols; i++) {
                        Object val = rs.getObject(i);
                        if (val instanceof java.sql.Date || val instanceof java.sql.Time || val instanceof java.sql.Timestamp || val instanceof java.time.temporal.Temporal) {
                            val = val.toString();
                        }
                        row.put(meta.getColumnLabel(i), val);
                    }
                    results.add(row);
                }
            }
        }
        return results;
    }

    public static Map<String, Object> getFirst(String sql, Object... params) throws SQLException {
        List<Map<String, Object>> list = query(sql, params);
        return list.isEmpty() ? null : list.get(0);
    }

    public static int executeUpdate(String sql, Object... params) throws SQLException {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            return ps.executeUpdate();
        }
    }

    public static long executeInsert(String sql, Object... params) throws SQLException {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getLong(1);
                }
            }
        }
        return -1;
    }

    public static void logAudit(int userId, String userName, String action, String moduleName, String details) {
        try {
            executeInsert(
                "INSERT INTO audit_logs (user_id, user_name, action, module_name, details, timestamp) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                userId, userName, action, moduleName, details
            );
        } catch (Exception e) {
            System.err.println("Failed to write audit log: " + e.getMessage());
        }
    }

    public static void addNotification(int userId, String message, String type) {
        try {
            executeInsert(
                "INSERT INTO notifications (user_id, message, notification_type, is_read, date_created) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)",
                userId, message, type
            );
        } catch (Exception e) {
            System.err.println("Failed to insert notification: " + e.getMessage());
        }
    }
}
