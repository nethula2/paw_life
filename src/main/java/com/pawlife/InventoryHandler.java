package com.pawlife;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

public class InventoryHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) {
            HttpUtils.handleCorsPreflight(exchange);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/inventory") && "GET".equalsIgnoreCase(method)) {
                handleGetAllSupplies(exchange);
            } else if (path.equals("/api/inventory/batch") && "POST".equalsIgnoreCase(method)) {
                handleAddBatch(exchange);
            } else if (path.equals("/api/inventory/deduct") && "POST".equalsIgnoreCase(method)) {
                handleDeductStock(exchange);
            } else if (path.equals("/api/inventory/purchase") && "POST".equalsIgnoreCase(method)) {
                handleCustomerPurchase(exchange);
            } else if (path.equals("/api/inventory/suppliers") && "GET".equalsIgnoreCase(method)) {
                handleGetSuppliers(exchange);
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

    private void handleGetAllSupplies(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> supplies = Database.query(
            "SELECT s.*, sup.supplier_name FROM medical_supplies s " +
            "LEFT JOIN suppliers sup ON s.supplier_id = sup.supplier_id " +
            "ORDER BY s.supply_name ASC"
        );
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("supplies", supplies);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleAddBatch(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        String name = (String) body.get("supply_name");
        String category = (String) body.getOrDefault("category", "Surgical Supply");
        String batchNo = (String) body.get("batch_number");
        int qty = ((Number) body.getOrDefault("quantity", 0)).intValue();
        int minThreshold = ((Number) body.getOrDefault("min_threshold", 10)).intValue();
        String expiryDate = (String) body.get("expiry_date");
        double unitPrice = ((Number) body.getOrDefault("unit_price", 500.0)).doubleValue();
        long supplierId = ((Number) body.getOrDefault("supplier_id", 3)).longValue();

        if (name == null || batchNo == null || expiryDate == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Supply name, batch number, and expiry date are required.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        // Validate expiry date: Must be in the future
        LocalDate exp = LocalDate.parse(expiryDate);
        if (!exp.isAfter(LocalDate.now())) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Validation Error: Batch expiry date must be in the future. Expired items cannot be received.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        long id = Database.executeInsert(
            "INSERT INTO medical_supplies (supply_name, category, batch_number, quantity, min_threshold, expiry_date, unit_price, supplier_id) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            name, category, batchNo, qty, minThreshold, expiryDate, unitPrice, supplierId
        );

        Database.logAudit(5, "Balasooriya B.A.H.N (Inventory)", "STOCK_BATCH_RECEIVED", "Smart Inventory",
            "Received batch [" + batchNo + "] of " + name + " (Qty: " + qty + ", Exp: " + expiryDate + ")");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("supply_id", id);
        res.put("total_quantity", qty);
        res.put("message", "Stock batch recorded successfully. Available quantity: " + qty);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleDeductStock(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        long supplyId = ((Number) body.get("supply_id")).longValue();
        int usedQty = ((Number) body.get("quantity_used")).intValue();

        Map<String, Object> item = Database.getFirst("SELECT * FROM medical_supplies WHERE supply_id = ?", supplyId);
        if (item == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Supply item not found.");
            HttpUtils.sendJson(exchange, 404, res);
            return;
        }

        int current = ((Number) item.get("quantity")).intValue();
        int remaining = Math.max(0, current - usedQty);
        Database.executeUpdate("UPDATE medical_supplies SET quantity = ? WHERE supply_id = ?", remaining, supplyId);

        int minThreshold = ((Number) item.get("min_threshold")).intValue();
        boolean isLow = remaining <= minThreshold;
        if (isLow) {
            Database.addNotification(5,
                "Low Stock Alert: " + item.get("supply_name") + " balance dropped to " + remaining + " (Threshold: " + minThreshold + ")",
                "Inventory Alert");
        }

        Database.logAudit(5, "Balasooriya B.A.H.N (Inventory)", "STOCK_DEDUCTION", "Smart Inventory",
            "Deducted " + usedQty + " units of " + item.get("supply_name") + ". Remaining: " + remaining);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("remaining_stock", remaining);
        res.put("low_stock_warning", isLow);
        res.put("message", "Successfully deducted " + usedQty + " units. New balance: " + remaining);
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleCustomerPurchase(HttpExchange exchange) throws Exception {
        Map<String, Object> body = HttpUtils.readJsonBody(exchange);
        Object idObj = body.get("supply_id");
        Object qtyObj = body.get("quantity");
        String custName = (String) body.get("customer_name");
        String custPhone = (String) body.get("customer_phone");
        String delivery = (String) body.getOrDefault("delivery_method", "Pickup at Clinic Desk");
        String payment = (String) body.getOrDefault("payment_method", "Cash on Pickup");

        if (idObj == null || qtyObj == null || custName == null || custPhone == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Product ID, quantity, customer name, and telephone are required.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        long supplyId = ((Number) idObj).longValue();
        int qty = ((Number) qtyObj).intValue();
        if (qty <= 0) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Purchase quantity must be greater than zero.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        Map<String, Object> item = Database.getFirst("SELECT * FROM medical_supplies WHERE supply_id = ?", supplyId);
        if (item == null) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Product item not found in inventory.");
            HttpUtils.sendJson(exchange, 404, res);
            return;
        }

        int currentStock = ((Number) item.get("quantity")).intValue();
        if (currentStock < qty) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Insufficient stock: Requested " + qty + " units, but only " + currentStock + " available in inventory.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        // Validate expiry
        Object expObj = item.get("expiry_date");
        String expiry = expObj != null ? expObj.toString() : null;
        if (expiry != null && LocalDate.parse(expiry).isBefore(LocalDate.now())) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", false);
            res.put("error", "Product batch is past expiration and cannot be dispensed.");
            HttpUtils.sendJson(exchange, 400, res);
            return;
        }

        int remaining = currentStock - qty;
        double unitPrice = ((Number) item.get("unit_price")).doubleValue();
        double totalAmount = unitPrice * qty;

        Database.executeUpdate("UPDATE medical_supplies SET quantity = ? WHERE supply_id = ?", remaining, supplyId);

        int minThreshold = ((Number) item.get("min_threshold")).intValue();
        boolean isLow = remaining <= minThreshold;
        if (isLow) {
            Database.addNotification(5,
                "Automated Low-Stock Trigger: " + item.get("supply_name") + " dropped to " + remaining + " units following online customer purchase.",
                "Inventory Alert");
        }

        String orderRef = "ORD-" + (int)(100000 + Math.random() * 900000);

        Database.logAudit(5, "Online Store / Self-Service", "CUSTOMER_ONLINE_PURCHASE", "Smart Inventory",
            "Customer " + custName + " (" + custPhone + ") purchased " + qty + "x " + item.get("supply_name") + " [" + orderRef + "]. Remaining: " + remaining);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("order_id", orderRef);
        res.put("supply_id", supplyId);
        res.put("product_name", item.get("supply_name"));
        res.put("quantity", qty);
        res.put("unit_price", unitPrice);
        res.put("total_amount", String.format("%.2f", totalAmount));
        res.put("remaining_stock", remaining);
        res.put("delivery_method", delivery);
        res.put("payment_method", payment);
        res.put("low_stock_warning", isLow);
        res.put("message", "Order " + orderRef + " confirmed! " + qty + "x " + item.get("supply_name") + " reserved successfully.");
        HttpUtils.sendJson(exchange, 200, res);
    }

    private void handleGetSuppliers(HttpExchange exchange) throws Exception {
        List<Map<String, Object>> suppliers = Database.query("SELECT * FROM suppliers ORDER BY supplier_name ASC");
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("suppliers", suppliers);
        HttpUtils.sendJson(exchange, 200, res);
    }
}
