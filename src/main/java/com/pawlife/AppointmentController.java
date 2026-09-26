package com.pawlife;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @PostMapping({"", "/book"})
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> body) {
        try {
            long petId = HttpUtils.toLong(body.get("pet_id"), 0L);
            long ownerId = HttpUtils.toLong(body.get("owner_id"), 0L);
            String serviceType = (String) body.get("service_type");
            String bookingDate = (String) body.get("booking_date");
            String timeSlot = (String) body.get("time_slot");
            String notes = (String) body.get("notes");
            boolean isNewCustomer = false;
            String registeredPetName = "";

            if (bookingDate == null || timeSlot == null || serviceType == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing required appointment fields."));
            }

            String customerName = "";

            if (petId <= 0) {
                isNewCustomer = true;
                
                String ownerFullName = (String) body.get("owner_name");
                String phone = (String) body.get("owner_phone");
                String email = (String) body.get("owner_email");
                String pName = (String) body.get("pet_name");
                String species = (String) body.getOrDefault("species", "Dog");
                String breed = (String) body.getOrDefault("breed", "Mixed Breed");

                if (ownerFullName == null && body.containsKey("new_owner")) {
                    Map<String, Object> newOwner = (Map<String, Object>) body.get("new_owner");
                    if (newOwner != null) {
                        ownerFullName = (newOwner.getOrDefault("first_name", "") + " " + newOwner.getOrDefault("last_name", "")).trim();
                        phone = (String) newOwner.get("phone_number");
                        email = (String) newOwner.get("email");
                    }
                }
                if (pName == null && body.containsKey("new_pet")) {
                    Map<String, Object> newPet = (Map<String, Object>) body.get("new_pet");
                    if (newPet != null) {
                        pName = (String) newPet.get("pet_name");
                        species = (String) newPet.getOrDefault("species", "Dog");
                        breed = (String) newPet.getOrDefault("breed", "Mixed Breed");
                    }
                }

                if (ownerFullName == null || ownerFullName.trim().isEmpty()) ownerFullName = "Guest Client";
                customerName = ownerFullName.trim();
                registeredPetName = (pName != null && !pName.trim().isEmpty()) ? pName.trim() : "Pet";

                String[] nameParts = customerName.split("\\s+", 2);
                String fname = nameParts[0];
                String lname = nameParts.length > 1 ? nameParts[1] : "Client";

                if (email == null || email.trim().isEmpty()) {
                    email = "client." + System.currentTimeMillis() + "@pawlife.lk";
                }
                if (phone == null) phone = "";

                Map<String, Object> existingUser = Database.getFirst("SELECT user_id FROM users WHERE email = ? OR phone_number = ?", email, phone);
                if (existingUser != null) {
                    long uId = HttpUtils.toLong(existingUser.get("user_id"), 1L);
                    Map<String, Object> po = Database.getFirst("SELECT owner_id FROM pet_owners WHERE user_id = ?", uId);
                    if (po != null) {
                        ownerId = HttpUtils.toLong(po.get("owner_id"), 1L);
                    } else {
                        ownerId = Database.executeInsert("INSERT INTO pet_owners (user_id, emergency_contact) VALUES (?, ?)", uId, phone);
                    }
                } else {
                    long uId = Database.executeInsert(
                        "INSERT INTO users (first_name, last_name, email, phone_number, password, role, status) VALUES (?, ?, ?, ?, 'password123', 'Pet Owner', 'Active')",
                        fname, lname, email, phone
                    );
                    ownerId = Database.executeInsert("INSERT INTO pet_owners (user_id, emergency_contact) VALUES (?, ?)", uId, phone);
                }

                petId = Database.executeInsert(
                    "INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, gender) VALUES (?, ?, ?, ?, ?, 'Male')",
                    ownerId, registeredPetName, species, breed, LocalDate.now().minusYears(1).toString()
                );
            } else {
                Map<String, Object> petInfo = Database.getFirst("SELECT pet_name, owner_id FROM pets WHERE pet_id = ?", petId);
                if (petInfo != null) {
                    registeredPetName = (String) petInfo.get("pet_name");
                    ownerId = HttpUtils.toLong(petInfo.get("owner_id"), 1L);
                }
                if (ownerId <= 0) ownerId = 1;

                Map<String, Object> ownerInfo = Database.getFirst(
                    "SELECT u.first_name || ' ' || u.last_name AS full_name FROM pet_owners po JOIN users u ON po.user_id = u.user_id WHERE po.owner_id = ?",
                    ownerId
                );
                customerName = (ownerInfo != null && ownerInfo.get("full_name") != null) ? ownerInfo.get("full_name").toString() : "Valued Client";
            }

            Map<String, Object> existing = Database.getFirst(
                "SELECT appointment_id FROM appointments WHERE booking_date = ? AND time_slot = ? AND status != 'Cancelled'",
                bookingDate, timeSlot
            );

            if (existing != null) {
                return ResponseEntity.status(409).body(Map.of(
                    "success", false, 
                    "conflict", true, 
                    "error", "Scheduling Conflict: The requested time slot is already reserved."
                ));
            }

            long apptId = Database.executeInsert(
                "INSERT INTO appointments (pet_id, owner_id, customer_name, pet_name, service_type, booking_date, time_slot, assigned_staff_id, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 3, 'Booked', ?)",
                petId, ownerId, customerName, registeredPetName, serviceType, bookingDate, timeSlot, notes
            );

            Database.logAudit(3, "Subasinghe R.A.G.I (Appointments)", "APPOINTMENT_BOOKING", "Appointment Scheduling",
                "Booked appointment [" + timeSlot + "] on " + bookingDate + " for Pet ID " + petId);

            Database.createNotification(ownerId > 0 ? (int)ownerId : 8,
                "Appointment #" + apptId + " booked for " + serviceType + " on " + bookingDate,
                "Booking Request");

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("appointment_id", apptId);
            res.put("pet_id", petId);
            res.put("pet_name", registeredPetName);
            res.put("status", "Booked");
            res.put("is_new_customer", isNewCustomer);
            res.put("message", "Appointment reserved successfully with status 'Booked'.");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.toString()));
        }
    }

    @GetMapping("/available-slots")
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "staff_id", required = false) Long staffId) {
        try {
            String checkDate = (date != null && !date.trim().isEmpty()) ? date.trim() : LocalDate.now().toString();

            List<String> standardSlots = List.of(
                "09:00 AM - 09:30 AM",
                "09:30 AM - 10:00 AM",
                "10:00 AM - 10:30 AM",
                "10:30 AM - 11:00 AM",
                "11:00 AM - 11:30 AM",
                "11:30 AM - 12:00 PM",
                "02:00 PM - 02:30 PM",
                "02:30 PM - 03:00 PM",
                "03:00 PM - 03:30 PM",
                "03:30 PM - 04:00 PM",
                "04:00 PM - 04:30 PM",
                "04:30 PM - 05:00 PM"
            );

            StringBuilder sql = new StringBuilder("SELECT time_slot FROM appointments WHERE booking_date = ? AND status != 'Cancelled' ");
            List<Object> params = new ArrayList<>();
            params.add(checkDate);

            if (staffId != null && staffId > 0) {
                sql.append("AND assigned_staff_id = ? ");
                params.add(staffId);
            }

            List<Map<String, Object>> booked = Database.query(sql.toString(), params.toArray());
            Set<String> bookedSlots = new HashSet<>();
            for (Map<String, Object> b : booked) {
                if (b.get("time_slot") != null) {
                    bookedSlots.add(b.get("time_slot").toString());
                }
            }

            List<Map<String, Object>> slots = new ArrayList<>();
            int availableCount = 0;
            for (String s : standardSlots) {
                boolean isAvail = !bookedSlots.contains(s);
                if (isAvail) availableCount++;
                Map<String, Object> item = new HashMap<>();
                item.put("slot", s);
                item.put("is_available", isAvail);
                slots.add(item);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("date", checkDate);
            res.put("available_count", availableCount);
            res.put("slots", slots);
            if (availableCount == 0) {
                res.put("message", "No slots open for selected date. Please select another date.");
            }
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.toString()));
        }
    }

    @GetMapping("/today")
    public ResponseEntity<?> getToday() {
        try {
            String today = LocalDate.now().toString();
            List<Map<String, Object>> list = Database.query(
                "SELECT a.*, p.pet_name, p.breed, u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone " +
                "FROM appointments a " +
                "LEFT JOIN pets p ON a.pet_id = p.pet_id " +
                "LEFT JOIN pet_owners o ON a.owner_id = o.owner_id " +
                "LEFT JOIN users u ON o.user_id = u.user_id " +
                "WHERE a.booking_date = ? ORDER BY a.time_slot ASC",
                today
            );
            return ResponseEntity.ok(Map.of("success", true, "date", today, "appointments", list));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.toString()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllAppointments(@RequestParam(value = "search", required = false) String search, @RequestParam(value = "status", required = false) String status) {
        try {
            StringBuilder sql = new StringBuilder(
                "SELECT a.*, COALESCE(a.pet_name, p.pet_name) AS pet_name, p.breed, p.species, " +
                "COALESCE(a.customer_name, u.first_name || ' ' || u.last_name) AS owner_name, " +
                "st.first_name || ' ' || st.last_name AS assigned_staff_name " +
                "FROM appointments a " +
                "LEFT JOIN pets p ON a.pet_id = p.pet_id " +
                "LEFT JOIN pet_owners o ON a.owner_id = o.owner_id " +
                "LEFT JOIN users u ON o.user_id = u.user_id " +
                "LEFT JOIN users st ON a.assigned_staff_id = st.user_id " +
                "WHERE 1=1 "
            );
            List<Object> params = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                sql.append("AND (LOWER(p.pet_name) LIKE ? OR LOWER(u.first_name) LIKE ? OR LOWER(u.last_name) LIKE ? OR LOWER(a.service_type) LIKE ? OR CAST(a.appointment_id AS CHAR) LIKE ?) ");
                String term = "%" + search.trim().toLowerCase() + "%";
                params.add(term); params.add(term); params.add(term); params.add(term); params.add(term);
            }

            if (status != null && !status.trim().isEmpty()) {
                sql.append("AND a.status = ? ");
                params.add(status.trim());
            }

            sql.append("ORDER BY a.booking_date DESC, a.time_slot ASC LIMIT 100");

            List<Map<String, Object>> list = Database.query(sql.toString(), params.toArray());
            return ResponseEntity.ok(Map.of("success", true, "appointments", list));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.toString()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable("id") long id, @RequestBody Map<String, Object> body) {
        try {
            String newStatus = (String) body.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Status is required."));
            }

            Map<String, Object> existing = Database.getFirst("SELECT appointment_id, owner_id FROM appointments WHERE appointment_id = ?", id);
            if (existing == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Appointment not found."));
            }

            Database.executeUpdate("UPDATE appointments SET status = ? WHERE appointment_id = ?", newStatus, id);

            long ownerId = HttpUtils.toLong(existing.get("owner_id"), 0L);
            Database.createNotification(ownerId > 0 ? (int) ownerId : 8,
                "Appointment #" + id + " status updated to " + newStatus, "Status Update");
            Database.logAudit(1, "System", "APPOINTMENT_STATUS_UPDATE", "Scheduling", "Updated Appointment #" + id + " to " + newStatus);

            return ResponseEntity.ok(Map.of("success", true, "message", "Appointment updated successfully.", "status", newStatus));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.toString()));
        }
    }
}
