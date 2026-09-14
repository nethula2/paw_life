const express = require('express');
const router = express.Router();
const { query, get, run } = require('../../database/db');
const { logAudit } = require('../middleware/audit');

/**
 * Member 04: Balasooriya B. A. H. N (IT25103607) - Developer 2
 * Module 03: Smart Inventory & Medical Supply Chain Management Module
 * Sequence Function: Track Medicine Stock Levels with Batch and Expiry Dates (UC-04)
 */

// 1. Search & List Medical Stock and Vaccines (UC-04 Step 1 & 2)
router.get('/', async (req, res) => {
    const { search, category, low_stock_only } = req.query;

    try {
        let sql = `
            SELECT ms.*, s.supplier_name, s.contact_no AS supplier_contact,
                   CASE WHEN ms.quantity <= ms.min_threshold THEN 1 ELSE 0 END AS is_low_stock,
                   CASE WHEN ms.expiry_date <= date('now') THEN 1 ELSE 0 END AS is_expired
            FROM medical_supplies ms
            LEFT JOIN suppliers s ON ms.supplier_id = s.supplier_id
            WHERE 1=1
        `;
        const params = [];

        if (search && search.trim() !== '') {
            sql += ' AND (ms.supply_name LIKE ? OR ms.batch_number LIKE ?)';
            const pat = `%${search.trim()}%`;
            params.push(pat, pat);
        }

        if (category) {
            sql += ' AND ms.category = ?';
            params.push(category);
        }

        if (low_stock_only === 'true') {
            sql += ' AND ms.quantity <= ms.min_threshold';
        }

        sql += ' ORDER BY ms.quantity ASC, ms.expiry_date ASC';
        const supplies = await query(sql, params);

        res.json({ success: true, supplies });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Add New Stock Batch (UC-04 Step 3-7)
router.post('/batch', async (req, res) => {
    const { supply_name, category, batch_number, quantity, min_threshold, expiry_date, unit_price, supplier_id } = req.body;

    if (!supply_name || !batch_number || !quantity || !expiry_date) {
        return res.status(400).json({ success: false, error: 'Mandatory batch fields (Name, Batch, Quantity, Expiry) are required.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, error: 'Received quantity must be a positive integer.' });
    }

    // Alternative Flow 4.a: Expiry date is invalid or in the past
    const today = new Date().toISOString().split('T')[0];
    if (expiry_date <= today) {
        return res.status(400).json({
            success: false,
            error: 'Validation Alert: Expiry date must be in the future.'
        });
    }

    try {
        // Check if batch already exists or insert new record
        const existingBatch = await get('SELECT supply_id, quantity FROM medical_supplies WHERE batch_number = ?', [batch_number]);

        let supplyId;
        if (existingBatch) {
            const newQty = existingBatch.quantity + qty;
            await run('UPDATE medical_supplies SET quantity = ? WHERE supply_id = ?', [newQty, existingBatch.supply_id]);
            supplyId = existingBatch.supply_id;
        } else {
            const result = await run(`
                INSERT INTO medical_supplies (supply_name, category, batch_number, quantity, min_threshold, expiry_date, unit_price, supplier_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                supply_name,
                category || 'Medicine',
                batch_number,
                qty,
                min_threshold || 10,
                expiry_date,
                unit_price || 500.00,
                supplier_id || 1
            ]);
            supplyId = result.lastID;
        }

        // Step 6 / Alternative Flow 6.a: Evaluate if total stock falls below threshold
        const updatedItem = await get('SELECT * FROM medical_supplies WHERE supply_id = ?', [supplyId]);
        let lowStockAlert = false;

        if (updatedItem && updatedItem.quantity <= updatedItem.min_threshold) {
            lowStockAlert = true;
            // Record alert notification for manager
            await run(`
                INSERT INTO notifications (user_id, message, notification_type, is_read)
                VALUES (5, ?, 'Inventory Alert', 0)
            `, [
                `Automated Low-Stock Alert: ${updatedItem.supply_name} (Batch: ${updatedItem.batch_number}) is below threshold (Balance: ${updatedItem.quantity}).`
            ]);
        }

        await logAudit(
            5,
            'Balasooriya B.A.H.N (Inventory Lead)',
            'STOCK_BATCH_ADDED',
            'Smart Inventory',
            `Received ${qty} units of ${supply_name} [Batch: ${batch_number}, Expiry: ${expiry_date}]. Low stock alert triggered: ${lowStockAlert}`
        );

        res.json({
            success: true,
            supply_id: supplyId,
            total_quantity: updatedItem ? updatedItem.quantity : qty,
            low_stock_warning: lowStockAlert,
            message: `Batch ${batch_number} saved successfully. Total available balance updated.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Deduct Stock Upon Service Usage (PBI-15)
router.post('/deduct', async (req, res) => {
    const { supply_id, quantity_used, session_reference } = req.body;

    const used = parseInt(quantity_used, 10);
    if (!supply_id || isNaN(used) || used <= 0) {
        return res.status(400).json({ success: false, error: 'Supply ID and valid deduction quantity are required.' });
    }

    try {
        const item = await get('SELECT * FROM medical_supplies WHERE supply_id = ?', [supply_id]);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Inventory item not found.' });
        }

        if (item.quantity < used) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock: Requested ${used} units, but only ${item.quantity} are in stock.`
            });
        }

        const remaining = item.quantity - used;
        await run('UPDATE medical_supplies SET quantity = ? WHERE supply_id = ?', [remaining, supply_id]);

        // Check if deduction breached reorder threshold
        let isLow = false;
        if (remaining <= item.min_threshold) {
            isLow = true;
            await run(`
                INSERT INTO notifications (user_id, message, notification_type, is_read)
                VALUES (5, ?, 'Inventory Alert', 0)
            `, [
                `Reorder Alert: ${item.supply_name} dropped to ${remaining} units after session deduction.`
            ]);
        }

        await logAudit(
            5,
            'Balasooriya B.A.H.N (Inventory)',
            'STOCK_DEDUCTION',
            'Smart Inventory',
            `Deducted ${used} units of ${item.supply_name} for ${session_reference || 'Clinical Service'}. Remaining balance: ${remaining}`
        );

        res.json({
            success: true,
            remaining_stock: remaining,
            low_stock_warning: isLow,
            message: `Successfully deducted ${used} units. New balance is ${remaining}.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Get Suppliers List
router.get('/suppliers', async (req, res) => {
    try {
        const suppliers = await query('SELECT * FROM suppliers ORDER BY supplier_name ASC');
        res.json({ success: true, suppliers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Customer Online Purchase & Real-Time Stock Deduction
router.post('/purchase', async (req, res) => {
    const { supply_id, quantity, customer_name, customer_phone, delivery_method, payment_method } = req.body;

    const qty = parseInt(quantity, 10);
    if (!supply_id || isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, error: 'A valid supply item and purchase quantity are required.' });
    }

    if (!customer_name || !customer_phone) {
        return res.status(400).json({ success: false, error: 'Customer name and contact telephone are required for checkout.' });
    }

    try {
        const item = await get('SELECT * FROM medical_supplies WHERE supply_id = ?', [supply_id]);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Product item not found in inventory.' });
        }

        // Validate stock availability
        if (item.quantity < qty) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock: Requested ${qty} units, but only ${item.quantity} available in inventory.`
            });
        }

        // Validate expiry
        const today = new Date().toISOString().split('T')[0];
        if (item.expiry_date <= today) {
            return res.status(400).json({
                success: false,
                error: 'Product batch is past expiration and cannot be dispensed.'
            });
        }

        const remaining = item.quantity - qty;
        const totalAmount = (item.unit_price * qty).toFixed(2);

        // Deduct inventory
        await run('UPDATE medical_supplies SET quantity = ? WHERE supply_id = ?', [remaining, supply_id]);

        // Check if stock dropped below threshold
        let isLow = false;
        if (remaining <= item.min_threshold) {
            isLow = true;
            await run(`
                INSERT INTO notifications (user_id, message, notification_type, is_read)
                VALUES (5, ?, 'Inventory Alert', 0)
            `, [
                `Automated Low-Stock Trigger: ${item.supply_name} dropped to ${remaining} units following online customer purchase.`
            ]);
        }

        // Record payment & transaction
        const orderRef = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        // Audit Trail
        await logAudit(
            5,
            'Online Store / Self-Service',
            'CUSTOMER_ONLINE_PURCHASE',
            'Smart Inventory',
            `Customer ${customer_name} (${customer_phone}) purchased ${qty}x ${item.supply_name} [${orderRef}]. Total: LKR ${totalAmount}. Remaining: ${remaining}`
        );

        res.json({
            success: true,
            order_id: orderRef,
            supply_id: item.supply_id,
            product_name: item.supply_name,
            quantity: qty,
            unit_price: item.unit_price,
            total_amount: totalAmount,
            remaining_stock: remaining,
            delivery_method: delivery_method || 'Pickup at Clinic',
            payment_method: payment_method || 'Cash on Pickup',
            low_stock_warning: isLow,
            message: `Order ${orderRef} confirmed! ${qty}x ${item.supply_name} reserved successfully.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
