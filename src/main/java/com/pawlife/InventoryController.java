package com.pawlife;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @GetMapping({"", "/supplies"})
    public ResponseEntity<?> getAllSupplies(@RequestParam(value = "search", required = false) String search, @RequestParam(value = "category", required = false) String category) {
        try {
            StringBuilder sql = new StringBuilder(
                "SELECT ms.*, s.supplier_name, s.contact_no AS supplier_contact " +
                "FROM medical_supplies ms LEFT JOIN suppliers s ON ms.supplier_id = s.supplier_id WHERE 1=1 "
            );
            List<Object> params = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                sql.append("AND LOWER(ms.supply_name) LIKE ? ");
                params.add("%" + search.trim().toLowerCase() + "%");
            }
            if (category != null && !category.trim().isEmpty()) {
                sql.append("AND ms.category = ? ");
                params.add(category.trim());
            }

            sql.append("ORDER BY ms.supply_name ASC");

            List<Map<String, Object>> supplies = Database.query(sql.toString(), params.toArray());
            List<Map<String, Object>> resultList = new ArrayList<>();

            for (Map<String, Object> rawItem : supplies) {
                Map<String, Object> item = new HashMap<>(rawItem);
                int qty = HttpUtils.toInt(item.get("quantity"), 0);
                int min = HttpUtils.toInt(item.get("min_threshold"), 0);
                Object expObj = item.get("expiry_date");
                boolean expired = false;
                if (expObj != null) {
                    try {
                        expired = LocalDate.parse(expObj.toString()).isBefore(LocalDate.now());
                    } catch (Exception ignored) {}
                }
                item.put("is_low_stock", qty <= min);
                item.put("is_expired", expired);
                resultList.add(item);
            }

            return ResponseEntity.ok(Map.of("success", true, "supplies", resultList));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.toString()));
        }
    }

    @PostMapping({"/supplies", "/batch"})
    public ResponseEntity<?> addSupply(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("supply_name");
            String category = (String) body.get("category");
            String batchNo = (String) body.get("batch_number");
            String expiryDate = (String) body.get("expiry_date");
            int qty = HttpUtils.toInt(body.get("quantity"), 0);
            int minThreshold = HttpUtils.toInt(body.get("min_threshold"), 10);
            double unitPrice = HttpUtils.toDouble(body.get("unit_price"), 0.0);
            long supplierId = HttpUtils.toLong(body.get("supplier_id"), 1L);

            if (name == null || category == null || batchNo == null || expiryDate == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "All fields are required."));
            }

            if (qty <= 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Validation Error: Quantity must be > 0"));
            }

            if (!LocalDate.parse(expiryDate).isAfter(LocalDate.now())) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Validation Error: Batch expiry date must be in the future."));
            }

            long id = Database.executeInsert(
                "INSERT INTO medical_supplies (supply_name, category, batch_number, quantity, min_threshold, expiry_date, unit_price, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                name, category, batchNo, qty, minThreshold, expiryDate, unitPrice, supplierId
            );

            Database.logAudit(5, "Balasooriya B.A.H.N (Inventory)", "STOCK_BATCH_RECEIVED", "Smart Inventory",
                "Received batch [" + batchNo + "] of " + name + " (Qty: " + qty + ", Exp: " + expiryDate + ")");

            return ResponseEntity.ok(Map.of("success", true, "supply_id", id, "total_quantity", qty, "message", "Stock batch recorded successfully."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @RequestMapping(value = {"/deduct", "/supplies/deduct"}, method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> deductStock(@RequestBody Map<String, Object> body) {
        try {
            long supplyId = HttpUtils.toLong(body.get("supply_id"), 0L);
            int usedQty = HttpUtils.toInt(body.get("quantity_used"), 1);

            Map<String, Object> item = Database.getFirst("SELECT * FROM medical_supplies WHERE supply_id = ?", supplyId);
            if (item == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Supply item not found."));
            }

            int current = HttpUtils.toInt(item.get("quantity"), 0);
            int remaining = Math.max(0, current - usedQty);
            Database.executeUpdate("UPDATE medical_supplies SET quantity = ? WHERE supply_id = ?", remaining, supplyId);

            int minThreshold = HttpUtils.toInt(item.get("min_threshold"), 10);
            boolean isLow = remaining <= minThreshold;
            if (isLow) {
                Database.createNotification(5, "Low Stock Alert: " + item.get("supply_name") + " balance dropped to " + remaining, "Inventory Alert");
            }

            Database.logAudit(5, "Balasooriya B.A.H.N (Inventory)", "STOCK_DEDUCTION", "Smart Inventory",
                "Deducted " + usedQty + " units of " + item.get("supply_name") + ". Remaining: " + remaining);

            return ResponseEntity.ok(Map.of("success", true, "remaining_stock", remaining, "low_stock_warning", isLow, "message", "Successfully deducted " + usedQty + " units. New balance: " + remaining));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/purchase")
    public ResponseEntity<?> customerPurchase(@RequestBody Map<String, Object> body) {
        try {
            long supplyId = HttpUtils.toLong(body.get("supply_id"), 0L);
            int qty = HttpUtils.toInt(body.get("quantity"), 0);
            String custName = (String) body.get("customer_name");
            String custPhone = (String) body.get("customer_phone");
            String delivery = (String) body.getOrDefault("delivery_method", "Pickup at Clinic Desk");
            String payment = (String) body.getOrDefault("payment_method", "Cash on Pickup");

            if (supplyId == 0 || qty == 0 || custName == null || custPhone == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Product ID, quantity, customer name, and telephone are required."));
            }
            if (qty <= 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Purchase quantity must be greater than zero."));
            }

            Map<String, Object> item = Database.getFirst("SELECT * FROM medical_supplies WHERE supply_id = ?", supplyId);
            if (item == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Product item not found in inventory."));
            }

            int currentStock = HttpUtils.toInt(item.get("quantity"), 0);
            if (currentStock < qty) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Insufficient stock: Requested " + qty + " units, but only " + currentStock + " available."));
            }

            Object expObj = item.get("expiry_date");
            if (expObj != null && LocalDate.parse(expObj.toString()).isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Product batch is past expiration and cannot be dispensed."));
            }

            int remaining = currentStock - qty;
            double unitPrice = HttpUtils.toDouble(item.get("unit_price"), 0.0);
            double totalAmount = unitPrice * qty;

            Database.executeUpdate("UPDATE medical_supplies SET quantity = ? WHERE supply_id = ?", remaining, supplyId);

            int minThreshold = HttpUtils.toInt(item.get("min_threshold"), 10);
            boolean isLow = remaining <= minThreshold;
            if (isLow) {
                Database.createNotification(5, "Automated Low-Stock Trigger: " + item.get("supply_name") + " dropped to " + remaining, "Inventory Alert");
            }

            String orderRef = "ORD-" + (int)(100000 + Math.random() * 900000);
            Database.logAudit(5, "Online Store / Self-Service", "CUSTOMER_ONLINE_PURCHASE", "Smart Inventory",
                "Customer " + custName + " purchased " + qty + "x " + item.get("supply_name") + " [" + orderRef + "]. Remaining: " + remaining);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("order_id", orderRef);
            resp.put("supply_id", supplyId);
            resp.put("product_name", item.get("supply_name"));
            resp.put("quantity", qty);
            resp.put("unit_price", unitPrice);
            resp.put("total_amount", String.format("%.2f", totalAmount));
            resp.put("remaining_stock", remaining);
            resp.put("delivery_method", delivery);
            resp.put("payment_method", payment);
            resp.put("low_stock_warning", isLow);
            resp.put("message", "Order " + orderRef + " confirmed!");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/suppliers")
    public ResponseEntity<?> getSuppliers() {
        try {
            List<Map<String, Object>> suppliers = Database.query(
                "SELECT s.*, (SELECT COUNT(*) FROM medical_supplies ms WHERE ms.supplier_id = s.supplier_id) AS items_count " +
                "FROM suppliers s ORDER BY s.supplier_name ASC"
            );
            return ResponseEntity.ok(Map.of("success", true, "suppliers", suppliers));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/suppliers")
    public ResponseEntity<?> addSupplier(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("supplier_name");
            String contact = (String) body.getOrDefault("contact_no", "");
            String email = (String) body.getOrDefault("email", "");
            String address = (String) body.getOrDefault("address", "");

            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Supplier name is required."));
            }

            long id = Database.executeInsert(
                "INSERT INTO suppliers (supplier_name, contact_no, email, address) VALUES (?, ?, ?, ?)",
                name.trim(), contact.trim(), email.trim(), address.trim()
            );

            Database.logAudit(5, "Inventory Manager", "SUPPLIER_CREATE", "Smart Inventory", "Added new supplier: " + name);
            return ResponseEntity.ok(Map.of("success", true, "supplier_id", id, "message", "Supplier '" + name + "' added successfully."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PutMapping("/suppliers/{supplierId}")
    public ResponseEntity<?> updateSupplier(@PathVariable("supplierId") long supplierId, @RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> existing = Database.getFirst("SELECT * FROM suppliers WHERE supplier_id = ?", supplierId);
            if (existing == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Supplier not found."));
            }

            String name = (String) body.getOrDefault("supplier_name", existing.get("supplier_name"));
            String contact = (String) body.getOrDefault("contact_no", existing.get("contact_no"));
            String email = (String) body.getOrDefault("email", existing.get("email"));
            String address = (String) body.getOrDefault("address", existing.get("address"));

            Database.executeUpdate(
                "UPDATE suppliers SET supplier_name = ?, contact_no = ?, email = ?, address = ? WHERE supplier_id = ?",
                name, contact, email, address, supplierId
            );

            Database.logAudit(5, "Inventory Manager", "SUPPLIER_UPDATE", "Smart Inventory", "Updated supplier details: " + name);
            return ResponseEntity.ok(Map.of("success", true, "message", "Supplier updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/suppliers/{supplierId}")
    public ResponseEntity<?> deleteSupplier(@PathVariable("supplierId") long supplierId) {
        try {
            Map<String, Object> existing = Database.getFirst("SELECT * FROM suppliers WHERE supplier_id = ?", supplierId);
            if (existing == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Supplier not found."));
            }

            // Unlink from supplies first
            Database.executeUpdate("UPDATE medical_supplies SET supplier_id = NULL WHERE supplier_id = ?", supplierId);
            Database.executeUpdate("DELETE FROM suppliers WHERE supplier_id = ?", supplierId);

            Database.logAudit(5, "Inventory Manager", "SUPPLIER_DELETE", "Smart Inventory", "Deleted supplier: " + existing.get("supplier_name"));
            return ResponseEntity.ok(Map.of("success", true, "message", "Supplier '" + existing.get("supplier_name") + "' deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
