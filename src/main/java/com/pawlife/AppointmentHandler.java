package com.pawlife;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

public class AppointmentHandler implements HttpHandler {
    private static final String[] ALL_SLOTS = {
        "08:30 AM - 09:00 AM",
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
        "04:00 PM - 04:30 PM"
    };

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            HttpUtils.handleCorsPreflight(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/appointments/available-slots") && "GET".equalsIgnoreCase(method)) {
                handleGetSlots(exchange);
            } else if (path.equals("/api/appointments/book") && "POST".equalsIgnoreCase(method)) {
                handleBookAppointment(exchange);
            } else if (path.equals("/api/appointments/today") && "GET".equalsIgnoreCase(method)) {
                handleGetToday(exchange);
            } else if (path.equals("/api/appointments") && "GET".equalsIgnoreCase(method)) {
                handleGetAllAppointments(exchange);
            } else if (path.matches(".*/api/appointments/\\d+/status.*") && ("PUT".equalsIgnoreCase(method) || "POST".equalsIgnoreCase(method))) {
                handleUpdateStatus(exchange, path);
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

    private void handleGetSlots(HttpExchange exchange) throws Exception {
        Map<String, String> q = HttpUtils.parseQueryParams(exchange);
        String date = q.getOrDefault("date", LocalDate.now().toString());

        List<Map<String, Object>> booked = Database.query(
            "SELECT time_slot, status FROM appointments WHERE booking_date = ? AND status != 'Cancelled'",
            date
        );

        Set<String> bookedSlots = new HashSet<>();
        for (Map<String, Object> b : booked) {
            bookedSlots.add((String) b.get("time_slot"));
        }

        List<Map<String, Object>> slots = new ArrayList<>();
        int availableCount = 0;
        for (String slot : ALL_SLOTS) {
            boolean isAvail = !bookedSlots.contains(slot);
            if (isAvail) availableCount++;
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("slot", slot);
            s.put("time", slot);
            s.put("is_available", isAvail);
            s.put("available", isAvail);
            slots.add(s);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("date", date);
        res.put("available_count", availableCount);
        res.put("slots", slots);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleBookAppointment(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        boolean isNewCustomer = Boolean.TRUE.equals(body.get("is_new_customer")) 
            || "true".equalsIgnoreCase(String.valueOf(body.get("is_new_customer")));

        long petId = 0;
        if (body.get("pet_id") != null && !isNewCustomer) {
            petId = ((Number) body.get("pet_id")).longValue();
        }

        long ownerId = 0;
        if (body.get("owner_id") != null) {
            ownerId = ((Number) body.get("owner_id")).longValue();
        }

        String serviceType = (String) body.getOrDefault("service_type", "Veterinary Care");
        String bookingDate = (String) body.get("booking_date");
        String timeSlot = (String) body.get("time_slot");
        String notes = (String) body.getOrDefault("notes", "Online booking via PawLife portal");

        if (bookingDate == null || timeSlot == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Booking date and time slot are required.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        // If new customer or no pet_id provided, register customer & pet automatically
        String registeredPetName = null;
        if (isNewCustomer || petId <= 0) {
            String ownerName = (String) body.getOrDefault("owner_name", "Valued Customer");
            String ownerPhone = (String) body.getOrDefault("owner_phone", "+94 77 000 0000");
            String ownerEmail = (String) body.getOrDefault("owner_email", "");
            String petName = (String) body.getOrDefault("pet_name", "Pet");
            String species = (String) body.getOrDefault("species", "Dog");
            String breed = (String) body.getOrDefault("breed", "Mixed Breed");
            registeredPetName = petName;

            String[] nameParts = ownerName.trim().split("\\s+", 2);
            String firstName = nameParts[0].isEmpty() ? "New" : nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : "Customer";

            if (ownerEmail == null || ownerEmail.trim().isEmpty()) {
                ownerEmail = firstName.toLowerCase() + "." + (System.currentTimeMillis() % 100000) + "@customer.pawlife.lk";
            }

            // Find existing user or insert
            Map<String, Object> existingUser = Database.getFirst(
                "SELECT user_id FROM users WHERE email = ? OR (phone_number = ? AND phone_number != '')",
                ownerEmail, ownerPhone
            );
            long userId;
            if (existingUser != null) {
                userId = ((Number) existingUser.get("user_id")).longValue();
            } else {
                userId = Database.executeInsert(
                    "INSERT INTO users (first_name, last_name, email, password, phone_number, role, status) VALUES (?, ?, ?, ?, ?, 'Pet Owner', 'Active')",
                    firstName, lastName, ownerEmail, "$2b$10$PawLifeCustomerAutoReg2026", ownerPhone
                );
            }

            // Find or insert pet_owners
            Map<String, Object> existingOwner = Database.getFirst(
                "SELECT owner_id FROM pet_owners WHERE user_id = ?",
                userId
            );
            if (existingOwner != null) {
                ownerId = ((Number) existingOwner.get("owner_id")).longValue();
            } else {
                ownerId = Database.executeInsert(
                    "INSERT INTO pet_owners (user_id, emergency_contact, preferred_contact_method) VALUES (?, ?, 'Phone')",
                    userId, ownerPhone
                );
            }

            // Register new pet
            String microchip = "MC-" + (int)(100000 + Math.random() * 900000);
            String dob = LocalDate.now().minusYears(2).toString();
            petId = Database.executeInsert(
                "INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, gender, microchip_no, medical_notes) VALUES (?, ?, ?, ?, ?, 'Male', ?, 'Registered via online booking portal')",
                ownerId, petName, species, breed, dob, microchip
            );
        } else {
            // Existing pet: resolve owner_id and pet_name
            Map<String, Object> petObj = Database.getFirst("SELECT owner_id, pet_name FROM pets WHERE pet_id = ?", petId);
            if (petObj != null) {
                if (ownerId <= 0 && petObj.get("owner_id") != null) {
                    ownerId = ((Number) petObj.get("owner_id")).longValue();
                }
                registeredPetName = (String) petObj.get("pet_name");
            }
            if (ownerId <= 0) ownerId = 1;
        }

        // Check for concurrent double-booking conflict
        Map<String, Object> existing = Database.getFirst(
            "SELECT appointment_id FROM appointments WHERE booking_date = ? AND time_slot = ? AND status != 'Cancelled'",
            bookingDate, timeSlot
        );

        if (existing != null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("conflict", true);
            res.put("error", "Scheduling Conflict: The requested time slot (" + timeSlot + ") on " + bookingDate + " is already reserved. Please select another slot.");
            HttpUtils.sendJson(exchange, 409, res);
            return;
        }

        long apptId = Database.executeInsert(
            "INSERT INTO appointments (pet_id, owner_id, service_type, booking_date, time_slot, assigned_staff_id, status, notes) " +
            "VALUES (?, ?, ?, ?, ?, 3, 'Confirmed', ?)",
            petId, ownerId, serviceType, bookingDate, timeSlot, notes
        );

        Database.logAudit(3, "Subasinghe R.A.G.I (Appointments)", "APPOINTMENT_BOOKING", "Appointment Scheduling",
            "Reserved slot [" + timeSlot + "] on " + bookingDate + " for Pet ID " + petId + " [Appt #" + apptId + "]");

        Database.addNotification(ownerId > 0 ? (int)ownerId : 8,
            "Appointment #" + apptId + " confirmed for " + serviceType + " on " + bookingDate + " at " + timeSlot,
            "Booking Confirmation");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("appointment_id", apptId);
        res.put("pet_id", petId);
        res.put("pet_name", registeredPetName);
        res.put("is_new_customer", isNewCustomer);
        res.put("message", "Appointment reserved successfully for " + bookingDate + " at " + timeSlot);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetToday(HttpExchange exchange) throws Exception {
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
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("date", today);
        res.put("appointments", list);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetAllAppointments(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> list = Database.query(
            "SELECT a.*, p.pet_name, p.breed, u.first_name || ' ' || u.last_name AS owner_name " +
            "FROM appointments a " +
            "LEFT JOIN pets p ON a.pet_id = p.pet_id " +
            "LEFT JOIN pet_owners o ON a.owner_id = o.owner_id " +
            "LEFT JOIN users u ON o.user_id = u.user_id " +
            "ORDER BY a.booking_date DESC, a.time_slot ASC LIMIT 50"
        );
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("appointments", list);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleUpdateStatus(HttpExchange exchange, String path) throws Exception {
        String[] parts = path.split("/");
        long apptId = 0;
        for (int i = 0; i < parts.length; i++) {
            if ("appointments".equals(parts[i]) && i + 1 < parts.length) {
                try {
                    apptId = Long.parseLong(parts[i + 1]);
                } catch (NumberFormatException ignored) {}
                break;
            }
        }

        if (apptId <= 0) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Invalid appointment ID in URL path.");
            HttpUtils.sendJson(exchange, 400, err);
            return;
        }

        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String newStatus = (String) body.get("status");

        if (newStatus == null || newStatus.trim().isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Status is required.");
            HttpUtils.sendJson(exchange, 400, err);
            return;
        }

        Map<String, Object> existing = Database.getFirst(
            "SELECT appointment_id, pet_id, booking_date, time_slot, status FROM appointments WHERE appointment_id = ?",
            apptId
        );

        if (existing == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", "Appointment #" + apptId + " not found.");
            HttpUtils.sendJson(exchange, 404, err);
            return;
        }

        Database.executeUpdate(
            "UPDATE appointments SET status = ? WHERE appointment_id = ?",
            newStatus, apptId
        );

        Database.logAudit(1, "Sanvidu S.D.N (Admin)", "APPOINTMENT_STATUS_UPDATE", "Appointment Scheduling",
            "Updated Appointment #" + apptId + " status to [" + newStatus + "]");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Appointment #" + apptId + " marked as " + newStatus + " successfully.");
        res.put("appointment_id", apptId);
        res.put("status", newStatus);
        HttpUtils.sendJson(exchange, 200, res);
    }
}
