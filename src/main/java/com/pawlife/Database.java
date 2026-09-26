package com.pawlife;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

@Component
public class Database implements ApplicationContextAware {

    private static ApplicationContext ctx;
    private static JdbcTemplate jdbcTemplate;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        Database.ctx = applicationContext;
        Database.jdbcTemplate = applicationContext.getBean(JdbcTemplate.class);
    }

    private static JdbcTemplate getJdbcTemplate() {
        if (jdbcTemplate != null) return jdbcTemplate;
        if (ctx != null) {
            jdbcTemplate = ctx.getBean(JdbcTemplate.class);
            return jdbcTemplate;
        }
        throw new IllegalStateException("Database component not initialized by Spring yet!");
    }

    public static List<Map<String, Object>> query(String sql, Object... params) {
        return getJdbcTemplate().queryForList(sql, params);
    }

    public static Map<String, Object> getFirst(String sql, Object... params) {
        List<Map<String, Object>> list = query(sql, params);
        return list.isEmpty() ? null : list.get(0);
    }

    public static int executeUpdate(String sql, Object... params) {
        return getJdbcTemplate().update(sql, params);
    }

    public static long executeInsert(String sql, Object... params) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        getJdbcTemplate().update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().longValue();
        }
        return -1;
    }

    public static void logAudit(long userId, String username, String actionType, String module, String desc) {
        executeUpdate(
            "INSERT INTO audit_logs (user_id, user_name, action, module_name, details) VALUES (?, ?, ?, ?, ?)",
            userId, username, actionType, module, desc
        );
    }

    public static void createNotification(int userId, String message, String type) {
        executeUpdate(
            "INSERT INTO notifications (user_id, message, notification_type, is_read) VALUES (?, ?, ?, 0)",
            userId, message, type
        );
    }
}
