package com.pawlife;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @GetMapping
    public ResponseEntity<?> getNotifications() {
        try {
            List<Map<String, Object>> notifs = Database.query(
                "SELECT * FROM notifications ORDER BY notification_id DESC LIMIT 30"
            );
            return ResponseEntity.ok(Map.of("success", true, "notifications", notifs));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable("id") long id) {
        try {
            Database.executeUpdate("UPDATE notifications SET is_read = 1 WHERE notification_id = ?", id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
