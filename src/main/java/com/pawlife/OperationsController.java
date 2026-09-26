package com.pawlife;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/operations")
@CrossOrigin(origins = "*")
public class OperationsController {

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        try {
            String today = LocalDate.now().toString();

            Map<String, Object> petCount = Database.getFirst("SELECT COUNT(*) AS c FROM pets");
            Map<String, Object> apptToday = Database.getFirst("SELECT COUNT(*) AS c FROM appointments WHERE booking_date = ?", today);
            Map<String, Object> groomActive = Database.getFirst("SELECT COUNT(*) AS c FROM grooming_sessions WHERE progress_status != 'Completed'");
            Map<String, Object> overdueVac = Database.getFirst("SELECT COUNT(*) AS c FROM vaccination_records WHERE status = 'Overdue' OR next_due_date < ?", today);
            Map<String, Object> lowStock = Database.getFirst("SELECT COUNT(*) AS c FROM medical_supplies WHERE quantity <= min_threshold");
            Map<String, Object> totalRev = Database.getFirst("SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE status = 'Paid'");
            Map<String, Object> todayRev = Database.getFirst(
                "SELECT COALESCE(SUM(p.amount), 0) AS s FROM payments p " +
                "JOIN appointments a ON p.appointment_id = a.appointment_id " +
                "WHERE a.booking_date = ? AND p.status = 'Paid'", today
            );

            Map<String, Object> kpis = new LinkedHashMap<>();
            kpis.put("total_pets", petCount != null ? petCount.get("c") : 5);
            kpis.put("today_appointments", apptToday != null ? apptToday.get("c") : 2);
            kpis.put("active_grooming", groomActive != null ? groomActive.get("c") : 3);
            kpis.put("overdue_vaccines", overdueVac != null ? overdueVac.get("c") : 1);
            kpis.put("low_stock_items", lowStock != null ? lowStock.get("c") : 3);
            kpis.put("total_revenue", totalRev != null ? totalRev.get("s") : 11300.0);
            kpis.put("today_revenue", todayRev != null ? todayRev.get("s") : 8300.0);

            return ResponseEntity.ok(Map.of("success", true, "date", today, "kpis", kpis));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts() {
        try {
            String today = LocalDate.now().toString();
            List<Map<String, Object>> alerts = new ArrayList<>();

            List<Map<String, Object>> overdues = Database.query(
                "SELECT vr.*, p.pet_name, u.first_name || ' ' || u.last_name AS owner_name, u.phone_number " +
                "FROM vaccination_records vr " +
                "JOIN pets p ON vr.pet_id = p.pet_id " +
                "JOIN pet_owners o ON p.owner_id = o.owner_id " +
                "JOIN users u ON o.user_id = u.user_id " +
                "WHERE vr.status = 'Overdue' OR vr.next_due_date < ?", today
            );
            for (Map<String, Object> o : overdues) {
                Map<String, Object> a = new LinkedHashMap<>();
                a.put("type", "Overdue Vaccine");
                a.put("severity", "High");
                a.put("message", o.get("pet_name") + " is overdue for " + o.get("vaccine_name") + " (Due: " + o.get("next_due_date") + ")");
                a.put("contact", o.get("owner_name") + " (" + o.get("phone_number") + ")");
                alerts.add(a);
            }

            List<Map<String, Object>> lowStock = Database.query("SELECT * FROM medical_supplies WHERE quantity <= min_threshold");
            for (Map<String, Object> s : lowStock) {
                Map<String, Object> a = new LinkedHashMap<>();
                a.put("type", "Low Stock");
                a.put("severity", "Warning");
                a.put("message", s.get("supply_name") + " balance is " + s.get("quantity") + " (Min Threshold: " + s.get("min_threshold") + ")");
                alerts.add(a);
            }

            return ResponseEntity.ok(Map.of("success", true, "alerts", alerts));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/shifts")
    public ResponseEntity<?> getShifts() {
        try {
            List<Map<String, Object>> shifts = Database.query(
                "SELECT s.*, u.first_name || ' ' || u.last_name AS staff_name, u.role, u.phone_number " +
                "FROM staff_shifts s JOIN users u ON s.user_id = u.user_id ORDER BY s.shift_date ASC, s.start_time ASC"
            );
            List<Map<String, Object>> availableStaff = Database.query(
                "SELECT user_id, first_name || ' ' || last_name AS name, role, phone_number, email " +
                "FROM users WHERE role != 'Pet Owner' AND status = 'Active' ORDER BY first_name ASC"
            );
            return ResponseEntity.ok(Map.of("success", true, "shifts", shifts, "available_staff", availableStaff));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/shifts")
    public ResponseEntity<?> createShift(@RequestBody Map<String, Object> body) {
        try {
            long userId = HttpUtils.toLong(body.get("user_id"), 0L);
            String shiftDate = (String) body.get("shift_date");
            String shiftType = (String) body.getOrDefault("shift_type", "Morning");
            String startTime = (String) body.getOrDefault("start_time", "08:00:00");
            String endTime = (String) body.getOrDefault("end_time", "14:00:00");

            if (userId <= 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Please select a valid staff member."));
            }
            if (shiftDate == null || shiftDate.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Shift date is required."));
            }

            Map<String, Object> conflict = Database.getFirst("SELECT * FROM staff_shifts WHERE user_id = ? AND shift_date = ?", userId, shiftDate);
            if (conflict != null) {
                return ResponseEntity.status(409).body(Map.of(
                    "success", false, "conflict", true, 
                    "error", "Scheduling Conflict: Staff member already has an assigned shift (" + conflict.get("shift_type") + ") on " + shiftDate + "."
                ));
            }

            long id = Database.executeInsert(
                "INSERT INTO staff_shifts (user_id, shift_date, shift_type, start_time, end_time, status, max_hours_limit) VALUES (?, ?, ?, ?, ?, 'Scheduled', 8)",
                userId, shiftDate, shiftType, startTime, endTime
            );

            Database.logAudit(6, "Alahakoon A.M.B.U (Operations)", "SHIFT_ALLOCATION", "Operational Centre",
                "Assigned " + shiftType + " shift on " + shiftDate + " to User ID " + userId + " [Shift ID: " + id + "]");

            return ResponseEntity.ok(Map.of("success", true, "shift_id", id, "message", "Shift successfully allocated without conflicts."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
