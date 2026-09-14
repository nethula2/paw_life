const express = require('express');
const router = express.Router();
const { query, get, run } = require('../../database/db');
const { logAudit } = require('../middleware/audit');

/**
 * Member 06: Warnakulasuriya G. A. D. T. S (IT25103408) - Developer 4
 * Module 04: Pet Grooming & Specialty Care Service Workflow Module
 * Sequence Function: Track Grooming Session Progress and Log Notes (UC-06)
 */

// 1. Grooming Services Catalog (PBI-17)
router.get('/services', async (req, res) => {
    try {
        const services = await query('SELECT * FROM grooming_services ORDER BY price ASC');
        res.json({ success: true, services });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Customise Grooming Service Package (PBI-17)
router.post('/services', async (req, res) => {
    const { service_name, category, price, duration_minutes, description } = req.body;

    if (!service_name || !price || !duration_minutes) {
        return res.status(400).json({ success: false, error: 'Service name, price, and duration are required.' });
    }

    try {
        const result = await run(`
            INSERT INTO grooming_services (service_name, category, price, duration_minutes, description)
            VALUES (?, ?, ?, ?, ?)
        `, [
            service_name,
            category || 'Custom Specialty Care',
            price,
            duration_minutes,
            description || 'Custom tailored package based on breed and coat condition'
        ]);

        await logAudit(
            7,
            'Warnakulasuriya G.A.D.T.S (Grooming Lead)',
            'GROOMING_SERVICE_CREATED',
            'Pet Grooming Workflow',
            `Created tailored service package: ${service_name} (LKR ${price})`
        );

        res.json({
            success: true,
            serviceId: result.lastID,
            message: `Grooming package '${service_name}' added successfully.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Active Grooming Queue on Station Terminal (UC-06 Step 1 & 2)
router.get('/queue', async (req, res) => {
    try {
        const queue = await query(`
            SELECT gs.*, p.pet_name, p.species, p.breed, p.photo_url as pet_photo,
                   u_owner.first_name || ' ' || u_owner.last_name AS owner_name, u_owner.phone_number AS owner_phone, u_owner.user_id AS owner_user_id,
                   srv.service_name, srv.price AS service_price, srv.duration_minutes,
                   u_grm.first_name || ' ' || u_grm.last_name AS groomer_name
            FROM grooming_sessions gs
            JOIN pets p ON gs.pet_id = p.pet_id
            JOIN pet_owners po ON p.owner_id = po.owner_id
            JOIN users u_owner ON po.user_id = u_owner.user_id
            JOIN grooming_services srv ON gs.service_id = srv.service_id
            JOIN grooming_staff gst ON gs.groomer_id = gst.groomer_id
            JOIN users u_grm ON gst.user_id = u_grm.user_id
            ORDER BY 
                CASE gs.progress_status
                    WHEN 'Checked-in' THEN 1
                    WHEN 'Bathing' THEN 2
                    WHEN 'Styling' THEN 3
                    WHEN 'Ready for Pick-up' THEN 4
                    WHEN 'Completed' THEN 5
                    ELSE 6
                END,
                gs.started_at ASC
        `);

        res.json({ success: true, queue });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Check In Pet for Grooming Session
router.post('/sessions', async (req, res) => {
    const { pet_id, service_id, groomer_id, coat_condition, observations } = req.body;

    if (!pet_id || !service_id) {
        return res.status(400).json({ success: false, error: 'Pet and Service selection are required.' });
    }

    try {
        const result = await run(`
            INSERT INTO grooming_sessions (pet_id, groomer_id, service_id, progress_status, coat_condition, observations, started_at)
            VALUES (?, ?, ?, 'Checked-in', ?, ?, datetime('now', 'localtime'))
        `, [
            pet_id,
            groomer_id || 1,
            service_id,
            coat_condition || 'Normal coat condition upon check-in',
            observations || 'Awaiting grooming station'
        ]);

        await logAudit(
            7,
            'Warnakulasuriya G.A.D.T.S (Groomer)',
            'GROOMING_CHECKIN',
            'Pet Grooming Workflow',
            `Checked in Pet ID ${pet_id} for grooming session #${result.lastID}`
        );

        res.json({
            success: true,
            sessionId: result.lastID,
            message: 'Pet checked in to grooming queue.'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Advance Workflow Stage & Log Observations (UC-06 Step 3-9)
router.put('/sessions/:id/status', async (req, res) => {
    const { id } = req.params;
    const { progress_status, coat_condition, observations } = req.body;

    const VALID_STAGES = ['Checked-in', 'Bathing', 'Styling', 'Ready for Pick-up', 'Completed'];
    if (!VALID_STAGES.includes(progress_status)) {
        return res.status(400).json({ success: false, error: `Invalid workflow stage: ${progress_status}` });
    }

    try {
        const session = await get(`
            SELECT gs.*, p.pet_name, po.user_id as owner_user_id, u.first_name as owner_first_name
            FROM grooming_sessions gs
            JOIN pets p ON gs.pet_id = p.pet_id
            JOIN pet_owners po ON p.owner_id = po.owner_id
            JOIN users u ON po.user_id = u.user_id
            WHERE gs.session_id = ?
        `, [id]);

        if (!session) {
            return res.status(404).json({ success: false, error: 'Grooming session not found.' });
        }

        const completedAt = progress_status === 'Completed' ? "datetime('now', 'localtime')" : null;

        await run(`
            UPDATE grooming_sessions 
            SET progress_status = ?,
                coat_condition = COALESCE(?, coat_condition),
                observations = COALESCE(?, observations),
                completed_at = CASE WHEN ? = 'Completed' THEN datetime('now', 'localtime') ELSE completed_at END
            WHERE session_id = ?
        `, [progress_status, coat_condition, observations, progress_status, id]);

        // Alternative Flow 7.a: Stage equals "Ready for Pick-up"
        let ownerNotified = false;
        if (progress_status === 'Ready for Pick-up') {
            ownerNotified = true;
            await run(`
                INSERT INTO notifications (user_id, message, notification_type, is_read)
                VALUES (?, ?, 'Grooming Ready', 0)
            `, [
                session.owner_user_id,
                `Great news ${session.owner_first_name}! Your pet ${session.pet_name} has finished grooming and is Ready for Pick-up!`
            ]);
        }

        await logAudit(
            7,
            'Warnakulasuriya G.A.D.T.S (Groomer)',
            'GROOMING_STAGE_TRANSITION',
            'Pet Grooming Workflow',
            `Advanced session #${id} for ${session.pet_name} to '${progress_status}'. Notes: ${observations || 'None'}`
        );

        res.json({
            success: true,
            session_id: id,
            current_stage: progress_status,
            owner_notified: ownerNotified,
            message: `Grooming workflow advanced to '${progress_status}'. Synchronized with Pet Owner Portal.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Live Grooming Tracking for Pet Owner Portal (PBI-18 / PBI-23)
router.get('/track/:petId', async (req, res) => {
    const { petId } = req.params;

    try {
        const session = await get(`
            SELECT gs.*, p.pet_name, p.breed, p.photo_url as pet_photo,
                   srv.service_name, srv.duration_minutes,
                   u_grm.first_name || ' ' || u_grm.last_name as groomer_name
            FROM grooming_sessions gs
            JOIN pets p ON gs.pet_id = p.pet_id
            JOIN grooming_services srv ON gs.service_id = srv.service_id
            JOIN grooming_staff gst ON gs.groomer_id = gst.groomer_id
            JOIN users u_grm ON gst.user_id = u_grm.user_id
            WHERE gs.pet_id = ?
            ORDER BY gs.session_id DESC
            LIMIT 1
        `, [petId]);

        if (!session) {
            return res.json({ success: true, active_session: null, message: 'No active grooming session found for this pet.' });
        }

        // Compute workflow progress percentage
        const progressPercentages = {
            'Checked-in': 25,
            'Bathing': 50,
            'Styling': 75,
            'Ready for Pick-up': 100,
            'Completed': 100
        };

        res.json({
            success: true,
            active_session: {
                ...session,
                progress_percentage: progressPercentages[session.progress_status] || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
