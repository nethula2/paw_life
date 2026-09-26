package com.pawlife;

import jakarta.annotation.PostConstruct;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @PostConstruct
    public void initReviewsTable() {
        try {
            Database.executeUpdate(
                "CREATE TABLE IF NOT EXISTS reviews (" +
                "review_id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "customer_name TEXT NOT NULL, " +
                "pet_name TEXT, " +
                "service_type TEXT, " +
                "rating INTEGER CHECK(rating >= 1 AND rating <= 5), " +
                "review_text TEXT NOT NULL, " +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ")"
            );

            Map<String, Object> count = Database.getFirst("SELECT COUNT(*) AS c FROM reviews");
            if (count == null || ((Number) count.get("c")).intValue() == 0) {
                Database.executeInsert(
                    "INSERT INTO reviews (customer_name, pet_name, service_type, rating, review_text) VALUES (?, ?, ?, ?, ?)",
                    "Kavinda Perera", "Barnaby", "Full Luxury Bath & Coat Styling", 5,
                    "Barnaby looked absolutely gorgeous after his grooming spa session! The coat blowout and blueberry scrub smelled amazing. Outstanding clinic care."
                );
                Database.executeInsert(
                    "INSERT INTO reviews (customer_name, pet_name, service_type, rating, review_text) VALUES (?, ?, ?, ?, ?)",
                    "Shenali Fernando", "Bella", "Veterinary Care & Wellness Exam", 5,
                    "Dr. Kasun was so patient and gentle with Bella during her checkup. The clinical advice and health record was explained thoroughly."
                );
                Database.executeInsert(
                    "INSERT INTO reviews (customer_name, pet_name, service_type, rating, review_text) VALUES (?, ?, ?, ?, ?)",
                    "Marcus Vance", "Max", "Vaccination & Dental Care", 5,
                    "Pristine hygiene, prompt scheduling without any waiting delays, and world-class veterinarians. Best pet hospital in the country."
                );
                Database.executeInsert(
                    "INSERT INTO reviews (customer_name, pet_name, service_type, rating, review_text) VALUES (?, ?, ?, ?, ?)",
                    "Nimalka Jayasuriya", "Milo", "Express Hygiene & Grooming", 5,
                    "Love the live care tracker and friendly front desk staff! Milo is usually very anxious during grooming, but here he was happy and relaxed."
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to initialize reviews table: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getReviews() {
        try {
            List<Map<String, Object>> reviews = Database.query("SELECT * FROM reviews ORDER BY review_id DESC");
            
            double totalStars = 0;
            Map<Integer, Integer> starCount = new HashMap<>();
            for (int i = 1; i <= 5; i++) starCount.put(i, 0);

            for (Map<String, Object> r : reviews) {
                int rating = ((Number) r.get("rating")).intValue();
                totalStars += rating;
                starCount.put(rating, starCount.getOrDefault(rating, 0) + 1);
            }

            double avg = reviews.isEmpty() ? 5.0 : Math.round((totalStars / reviews.size()) * 10.0) / 10.0;

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("reviews", reviews);
            res.put("total_reviews", reviews.size());
            res.put("average_rating", avg);
            res.put("breakdown", starCount);

            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("customer_name");
            String petName = (String) body.getOrDefault("pet_name", "Pet");
            String serviceType = (String) body.getOrDefault("service_type", "General Visit");
            String reviewText = (String) body.get("review_text");
            int rating = HttpUtils.toInt(body.get("rating"), 5);

            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Please provide your name."));
            }
            if (reviewText == null || reviewText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Review feedback text cannot be empty."));
            }
            if (rating < 1 || rating > 5) rating = 5;

            long reviewId = Database.executeInsert(
                "INSERT INTO reviews (customer_name, pet_name, service_type, rating, review_text) VALUES (?, ?, ?, ?, ?)",
                name.trim(), petName.trim(), serviceType.trim(), rating, reviewText.trim()
            );

            Database.createNotification(1, "New Customer Review from " + name + " (" + rating + "★ for " + petName + ")", "Review");
            Database.logAudit(1, "Client Portal", "REVIEW_SUBMIT", "Customer Reviews", "Review #" + reviewId + " submitted by " + name);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "review_id", reviewId,
                "message", "Thank you for your review! Your feedback has been published."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
