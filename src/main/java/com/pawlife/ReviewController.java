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

            double avg = reviews.isEmpty() ? 0.0 : Math.round((totalStars / reviews.size()) * 10.0) / 10.0;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable("id") long id) {
        try {
            int affected = Database.executeUpdate("DELETE FROM reviews WHERE review_id = ?", id);
            return ResponseEntity.ok(Map.of("success", true, "deleted", affected > 0));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> clearAllReviews() {
        try {
            int affected = Database.executeUpdate("DELETE FROM reviews");
            return ResponseEntity.ok(Map.of("success", true, "message", "All reviews cleared", "count", affected));
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
