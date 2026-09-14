package com.pawlife;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class PetEhrHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            HttpUtils.handleCorsPreflight(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/pets") && "GET".equalsIgnoreCase(method)) {
                handleGetPets(exchange);
            } else if (path.startsWith("/api/pets/") && "GET".equalsIgnoreCase(method)) {
                String idStr = path.substring("/api/pets/".length());
                handleGetPetById(exchange, Long.parseLong(idStr));
            } else if (path.equals("/api/pets") && "POST".equalsIgnoreCase(method)) {
                handleCreatePet(exchange);
            } else if (path.equals("/api/consultations") && "POST".equalsIgnoreCase(method)) {
                handleCreateConsultation(exchange);
            } else if (path.equals("/api/vaccinations") && "POST".equalsIgnoreCase(method)) {
                handleCreateVaccination(exchange);
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

    private void handleGetPets(HttpExchange exchange) throws Exception {
        Map<String, String> queryParams = HttpUtils.parseQueryParams(exchange);
        String search = queryParams.get("search");

        List<Map<String, Object>> pets;
        if (search != null && !search.trim().isEmpty()) {
            String term = "%" + search.trim() + "%";
            pets = Database.query(
                "SELECT p.*, o.user_id, u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone " +
                "FROM pets p " +
                "LEFT JOIN pet_owners o ON p.owner_id = o.owner_id " +
                "LEFT JOIN users u ON o.user_id = u.user_id " +
                "WHERE p.pet_name LIKE ? OR p.breed LIKE ? OR p.microchip_no LIKE ? " +
                "ORDER BY p.pet_name ASC",
                term, term, term
            );
        } else {
            pets = Database.query(
                "SELECT p.*, o.user_id, u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone " +
                "FROM pets p " +
                "LEFT JOIN pet_owners o ON p.owner_id = o.owner_id " +
                "LEFT JOIN users u ON o.user_id = u.user_id " +
                "ORDER BY p.pet_name ASC"
            );
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("pets", pets);
        if (pets.isEmpty() && search != null && !search.trim().isEmpty()) {
            res.put("message", "No records match search criteria: '" + search + "'. Please verify pet name or microchip.");
        }
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetPetById(HttpExchange exchange, long petId) throws Exception {
        Map<String, Object> pet = Database.getFirst(
            "SELECT p.*, o.user_id, u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone " +
            "FROM pets p " +
            "LEFT JOIN pet_owners o ON p.owner_id = o.owner_id " +
            "LEFT JOIN users u ON o.user_id = u.user_id " +
            "WHERE p.pet_id = ?",
            petId
        );

        if (pet == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Pet profile not found.");
            HttpUtils.sendJson(exchange, 404, res);
            return;
        }

        List<Map<String, Object>> consultations = Database.query(
            "SELECT c.*, u.first_name || ' ' || u.last_name AS vet_name, pr.medication_details, pr.dosage, pr.instructions " +
            "FROM consultations c " +
            "LEFT JOIN veterinarians v ON c.vet_id = v.vet_id " +
            "LEFT JOIN users u ON v.user_id = u.user_id " +
            "LEFT JOIN prescriptions pr ON c.consultation_id = pr.consultation_id " +
            "WHERE c.pet_id = ? ORDER BY c.consultation_date DESC",
            petId
        );

        List<Map<String, Object>> vaccinations = Database.query(
            "SELECT vr.*, u.first_name || ' ' || u.last_name AS administered_by_name " +
            "FROM vaccination_records vr " +
            "LEFT JOIN veterinarians v ON vr.administered_by = v.vet_id " +
            "LEFT JOIN users u ON v.user_id = u.user_id " +
            "WHERE vr.pet_id = ? ORDER BY vr.date_administered DESC",
            petId
        );

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("pet", pet);
        res.put("consultations", consultations);
        res.put("vaccinations", vaccinations);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleCreatePet(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String name = (String) body.get("pet_name");
        String species = (String) body.get("species");
        String breed = (String) body.get("breed");
        String dob = (String) body.get("date_of_birth");
        String gender = (String) body.get("gender");
        String chip = (String) body.getOrDefault("microchip_no", "MC-" + (int)(100000 + Math.random() * 900000));
        String allergies = (String) body.getOrDefault("allergies", "None");

        if (name == null || species == null || breed == null || dob == null || gender == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Pet name, species, breed, date of birth, and gender are mandatory.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        long id = Database.executeInsert(
            "INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, gender, microchip_no, allergies) VALUES (1, ?, ?, ?, ?, ?, ?, ?)",
            name, species, breed, dob, gender, chip, allergies
        );

        Database.logAudit(2, "De Silva L.P.B (Veterinary EHR)", "PET_REGISTRATION", "Pet EHR",
            "Registered new pet: " + name + " (" + breed + ", " + species + ") [ID: " + id + "]");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("pet_id", id);
        res.put("message", "Pet '" + name + "' registered successfully with Microchip " + chip + ".");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleCreateConsultation(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        Object petIdObj = body.get("pet_id");
        String diagnosis = (String) body.get("diagnosis");
        String notes = (String) body.getOrDefault("treatment_notes", "");
        String symptoms = (String) body.getOrDefault("symptoms", "Clinical examination");
        String vitals = (String) body.getOrDefault("vitals", "Normal");
        String meds = (String) body.get("medication_details");
        String dosage = (String) body.get("dosage");
        String instructions = (String) body.get("instructions");

        if (diagnosis == null || diagnosis.trim().isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Clinical Error: Diagnosis is a mandatory clinical field. Please enter clinical findings.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        long petId = HttpUtils.toLong(petIdObj, 0L);
        long consultId = Database.executeInsert(
            "INSERT INTO consultations (appointment_id, pet_id, vet_id, symptoms, vitals, diagnosis, treatment_notes) " +
            "VALUES (1, ?, 2, ?, ?, ?, ?)",
            petId, symptoms, vitals, diagnosis, notes
        );

        if (meds != null && !meds.trim().isEmpty()) {
            Database.executeInsert(
                "INSERT INTO prescriptions (consultation_id, pet_id, vet_id, medication_details, dosage, instructions, status) " +
                "VALUES (?, ?, 2, ?, ?, ?, 'Active')",
                consultId, petId, meds, dosage != null ? dosage : "As directed", instructions != null ? instructions : "Take with food"
            );
        }

        Database.logAudit(2, "De Silva L.P.B (Veterinary EHR)", "CLINICAL_CONSULTATION", "Pet EHR",
            "Logged consultation for Pet ID " + petId + ". Diagnosis: " + diagnosis);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("consultation_id", consultId);
        res.put("message", "Clinical consultation record and digital prescription saved.");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleCreateVaccination(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        long petId = HttpUtils.toLong(body.get("pet_id"), 0L);
        String vaccineName = (String) body.get("vaccine_name");
        String batchNumber = (String) body.get("batch_number");
        String adminDate = (String) body.get("date_administered");

        if (vaccineName == null || batchNumber == null || adminDate == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Vaccine name, batch number, and administration date are required.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        // Auto-calculate next due date to +365 days (1 year)
        LocalDate nextDueDate = LocalDate.parse(adminDate).plusYears(1);
        String nextDueStr = nextDueDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String certNo = "CERT-VAC-" + (int)(1000 + Math.random() * 9000);

        long recId = Database.executeInsert(
            "INSERT INTO vaccination_records (pet_id, vaccine_name, batch_number, date_administered, next_due_date, certificate_no, administered_by, status, remarks) " +
            "VALUES (?, ?, ?, ?, ?, ?, 2, 'Completed', 'Administered during clinic visit. Next annual booster auto-calculated.')",
            petId, vaccineName, batchNumber, adminDate, nextDueStr, certNo
        );

        Database.logAudit(2, "De Silva L.P.B (Veterinary EHR)", "VACCINATION_RECORDED", "Pet EHR",
            "Recorded vaccination: " + vaccineName + " for Pet ID " + petId + ". Next booster due: " + nextDueStr);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("record_id", recId);
        res.put("next_due_date", nextDueStr);
        res.put("certificate_no", certNo);
        res.put("message", "Vaccination record logged successfully. Next preventative due date calculated: " + nextDueStr);
        HttpUtils.sendJson(exchange, 200, res);
    }
}
