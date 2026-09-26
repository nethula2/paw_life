package com.pawlife;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/grooming")
@CrossOrigin(origins = "*")
public class GroomingController {

    @GetMapping("/queue")
    public ResponseEntity<?> getQueue() {
        try {
            List<Map<String, Object>> queue = Database.query(
                "SELECT gs.*, p.pet_name, p.breed, p.photo_url AS pet_photo, s.service_name, s.category AS service_category, " +
                "u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone, " +
                "COALESCE(g.first_name || ' ' || g.last_name, 'Kasun Jayawardena') AS groomer_name " +
                "FROM grooming_sessions gs " +
                "JOIN pets p ON gs.pet_id = p.pet_id " +
                "LEFT JOIN grooming_services s ON gs.service_id = s.service_id " +
                "LEFT JOIN pet_owners o ON p.owner_id = o.owner_id " +
                "LEFT JOIN users u ON o.user_id = u.user_id " +
                "LEFT JOIN users g ON gs.groomer_id = g.user_id " +
                "WHERE gs.progress_status != 'Completed' " +
                "ORDER BY gs.session_id ASC"
            );
            return ResponseEntity.ok(Map.of("success", true, "queue", queue));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/checkin")
    public ResponseEntity<?> checkinPet(@RequestBody Map<String, Object> body) {
        try {
            long petId = HttpUtils.toLong(body.get("pet_id"), 0L);
            long apptId = HttpUtils.toLong(body.get("appointment_id"), 0L);
            long serviceId = HttpUtils.toLong(body.get("service_id"), 1L);
            String coat = (String) body.getOrDefault("coat_condition", "Normal");
            String obs = (String) body.getOrDefault("observations", "Pet checked in at front desk.");

            if (petId <= 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Valid pet_id is required."));
            }

            if (apptId > 0) {
                Database.executeUpdate("UPDATE appointments SET status = 'In Progress' WHERE appointment_id = ?", apptId);
            }

            long sessionId = Database.executeInsert(
                "INSERT INTO grooming_sessions (appointment_id, pet_id, groomer_id, service_id, progress_status, coat_condition, observations, started_at) " +
                "VALUES (?, ?, 3, ?, 'Checked-in', ?, ?, datetime('now', 'localtime'))",
                apptId > 0 ? apptId : null, petId, serviceId, coat, obs
            );

            Database.logAudit(1, "Front Desk", "GROOMING_CHECKIN", "Grooming Workflow",
                "Checked-in pet ID " + petId + " into Grooming Station (Ticket #" + sessionId + ")");

            return ResponseEntity.ok(Map.of(
                "success", true,
                "session_id", sessionId,
                "message", "Pet checked into Grooming Station! Ticket #" + sessionId + " is now live in the salon queue."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PutMapping("/sessions/{sessionId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable("sessionId") long sessionId, @RequestBody Map<String, Object> body) {
        try {
            String newStatus = (String) body.get("progress_status");
            if (newStatus != null) {
                newStatus = newStatus.trim();
                if ("Scissor & Styling".equalsIgnoreCase(newStatus) || "Styling & Trimming".equalsIgnoreCase(newStatus)) {
                    newStatus = "Styling";
                } else if ("Bathing & Drying".equalsIgnoreCase(newStatus)) {
                    newStatus = "Bathing";
                }
            }
            String obs = (String) body.getOrDefault("observations", "Grooming session updated.");

            if (newStatus == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Progress status is required."));
            }

            Database.executeUpdate(
                "UPDATE grooming_sessions SET progress_status = ?, observations = ? WHERE session_id = ?",
                newStatus, obs, sessionId
            );

            // If session is Completed, sync the corresponding appointment to Completed!
            if ("Completed".equalsIgnoreCase(newStatus)) {
                Map<String, Object> sess = Database.getFirst("SELECT appointment_id FROM grooming_sessions WHERE session_id = ?", sessionId);
                if (sess != null && sess.get("appointment_id") != null) {
                    long aId = ((Number) sess.get("appointment_id")).longValue();
                    Database.executeUpdate("UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?", aId);
                }
            }

            boolean notified = false;
            if ("Ready for Pick-up".equalsIgnoreCase(newStatus)) {
                notified = true;
                Database.createNotification(8,
                    "Ready for Pick-up Alert: Pet grooming session #" + sessionId + " is complete and ready for collection.",
                    "Grooming Alert");
            }

            Database.logAudit(7, "Warnakulasuriya G.A.D.T.S (Grooming)", "GROOMING_STATUS_UPDATE", "Grooming Workflow",
                "Advanced session #" + sessionId + " to " + newStatus + ". Owner notified: " + notified);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "session_id", sessionId,
                "new_status", newStatus,
                "owner_notified", notified,
                "message", "Session updated to " + newStatus + (notified ? " and owner notification dispatched." : ".")
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/track/{petId}")
    public ResponseEntity<?> trackGrooming(@PathVariable("petId") long petId) {
        try {
            Map<String, Object> session = Database.getFirst(
                "SELECT gs.*, p.pet_name, p.breed, p.photo_url AS pet_photo, s.service_name, s.category AS service_category, s.duration_minutes, " +
                "COALESCE(u.first_name || ' ' || u.last_name, 'Expert Groomer') AS groomer_name " +
                "FROM grooming_sessions gs " +
                "JOIN pets p ON gs.pet_id = p.pet_id " +
                "LEFT JOIN grooming_services s ON gs.service_id = s.service_id " +
                "LEFT JOIN users u ON gs.groomer_id = u.user_id " +
                "WHERE gs.pet_id = ? AND gs.progress_status != 'Completed' " +
                "ORDER BY gs.session_id DESC LIMIT 1",
                petId
            );
            if (session == null) {
                return ResponseEntity.ok(Map.of("success", false, "error", "No active grooming session found for this pet."));
            }

            // Calculate percentage
            String st = (String) session.get("progress_status");
            int pct = 25;
            if ("Bathing".equalsIgnoreCase(st) || "Bathing & Drying".equalsIgnoreCase(st)) pct = 50;
            else if ("Styling".equalsIgnoreCase(st) || "Scissor & Styling".equalsIgnoreCase(st)) pct = 75;
            else if ("Ready for Pick-up".equalsIgnoreCase(st)) pct = 100;

            Map<String, Object> enriched = new HashMap<>(session);
            enriched.put("progress_percentage", pct);

            return ResponseEntity.ok(Map.of("success", true, "active_session", enriched));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/services")
    public ResponseEntity<?> getServices() {
        try {
            List<Map<String, Object>> services = Database.query("SELECT * FROM grooming_services ORDER BY price ASC");
            return ResponseEntity.ok(Map.of("success", true, "services", services));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
