const express = require('express');
const router = express.Router();
const { query, get, run } = require('../../database/db');
const { logAudit } = require('../middleware/audit');

/**
 * Member 03: Subasinghe R. A. G. I (IT25102521) - Developer 1
 * Module 02: Appointment Scheduling & Notification Module
 * Sequence Function: Book Veterinary or Grooming Appointment Online (UC-03)
 */

const STANDARD_TIME_SLOTS = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM',
    '03:30 PM - 04:00 PM',
    '04:00 PM - 04:30 PM',
    '04:30 PM - 05:00 PM'
];

// 1. Check Schedule and Return Available Slots (UC-03 Step 3 & 4)
router.get('/available-slots', async (req, res) => {
    const { date, service_type, staff_id } = req.query;

    if (!date) {
        return res.status(400).json({ success: false, error: 'Booking date is required to check availability.' });
    }

    try {
        let sql = `
            SELECT time_slot, assigned_staff_id, status
            FROM appointments
            WHERE booking_date = ? AND status != 'Cancelled'
        `;
        const params = [date];

        if (staff_id) {
            sql += ' AND assigned_staff_id = ?';
            params.push(staff_id);
        }

        const bookedSlots = await query(sql, params);
        const bookedTimes = bookedSlots.map(b => b.time_slot);

        const availability = STANDARD_TIME_SLOTS.map(slot => ({
            slot,
            is_available: !bookedTimes.includes(slot)
        }));

        const availableCount = availability.filter(s => s.is_available).length;

        // Alternative Flow 4.a: No slots available on selected date
        if (availableCount === 0) {
            return res.json({
                success: true,
                date,
                available_count: 0,
                slots: availability,
                message: 'No slots open for selected date. Please select another date.'
            });
        }

        res.json({
            success: true,
            date,
            available_count: availableCount,
            slots: availability
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Book Veterinary or Grooming Appointment Online (UC-03 Step 5-8)
router.post('/book', async (req, res) => {
    const { pet_id, owner_id, service_type, booking_date, time_slot, assigned_staff_id, notes } = req.body;

    if (!pet_id || !service_type || !booking_date || !time_slot) {
        return res.status(400).json({ success: false, error: 'Missing required booking information.' });
    }

    try {
        // Step 6 / Alternative Flow 6.a: Concurrent booking conflict check
        const existingBooking = await get(`
            SELECT appointment_id FROM appointments 
            WHERE booking_date = ? AND time_slot = ? AND status != 'Cancelled'
        `, [booking_date, time_slot]);

        if (existingBooking) {
            return res.status(409).json({
                success: false,
                conflict: true,
                error: 'Conflict detected: Selected slot was just reserved by another user. Please select another slot.'
            });
        }

        // Determine owner ID if not explicitly passed
        let targetOwnerId = owner_id;
        if (!targetOwnerId) {
            const petInfo = await get('SELECT owner_id FROM pets WHERE pet_id = ?', [pet_id]);
            if (petInfo) targetOwnerId = petInfo.owner_id;
        }

        // Insert appointment
        const result = await run(`
            INSERT INTO appointments (pet_id, owner_id, service_type, booking_date, time_slot, assigned_staff_id, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?)
        `, [
            pet_id,
            targetOwnerId || 1,
            service_type,
            booking_date,
            time_slot,
            assigned_staff_id || (service_type === 'Grooming' ? 7 : 3),
            notes || 'Online appointment request'
        ]);

        const appointmentId = result.lastID;

        // Auto-create initial payment record
        const basePrice = service_type === 'Grooming' ? 4800.00 : (service_type === 'Vaccination' ? 2800.00 : 3500.00);
        await run(`
            INSERT INTO payments (appointment_id, amount, method, status)
            VALUES (?, ?, 'Cash', 'Pending')
        `, [appointmentId, basePrice]);

        // Step 7: Parallel triggers (a) Create in-app notification, (b) Record audit log
        const ownerUser = await get(`
            SELECT po.user_id, u.first_name, p.pet_name 
            FROM pet_owners po 
            JOIN users u ON po.user_id = u.user_id 
            JOIN pets p ON p.owner_id = po.owner_id
            WHERE po.owner_id = ? AND p.pet_id = ?
        `, [targetOwnerId, pet_id]);

        if (ownerUser) {
            await run(`
                INSERT INTO notifications (user_id, message, notification_type, is_read)
                VALUES (?, ?, 'Booking Confirmation', 0)
            `, [
                ownerUser.user_id,
                `Booking Confirmed! Appointment #${appointmentId} for ${ownerUser.pet_name} (${service_type}) on ${booking_date} at ${time_slot}.`
            ]);
        }

        await logAudit(
            4,
            'Subasinghe R.A.G.I (Scheduling Engine)',
            'APPOINTMENT_BOOKED',
            'Appointment Scheduling',
            `Confirmed slot [${booking_date} ${time_slot}] for Appointment #${appointmentId} (${service_type})`
        );

        res.json({
            success: true,
            appointment_id: appointmentId,
            message: `Appointment #${appointmentId} successfully booked and confirmed. Staff calendar synced.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. List Appointments with filters
router.get('/', async (req, res) => {
    const { status, date, owner_id, service_type } = req.query;

    try {
        let sql = `
            SELECT a.*, p.pet_name, p.species, p.breed,
                   u_owner.first_name || ' ' || u_owner.last_name AS owner_name, u_owner.phone_number AS owner_phone,
                   u_staff.first_name || ' ' || u_staff.last_name AS assigned_staff_name,
                   pay.amount, pay.status AS payment_status
            FROM appointments a
            JOIN pets p ON a.pet_id = p.pet_id
            JOIN pet_owners po ON a.owner_id = po.owner_id
            JOIN users u_owner ON po.user_id = u_owner.user_id
            LEFT JOIN users u_staff ON a.assigned_staff_id = u_staff.user_id
            LEFT JOIN payments pay ON a.appointment_id = pay.appointment_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            sql += ' AND a.status = ?';
            params.push(status);
        }
        if (date) {
            sql += ' AND a.booking_date = ?';
            params.push(date);
        }
        if (owner_id) {
            sql += ' AND a.owner_id = ?';
            params.push(owner_id);
        }
        if (service_type) {
            sql += ' AND a.service_type = ?';
            params.push(service_type);
        }

        sql += ' ORDER BY a.booking_date DESC, a.time_slot ASC';
        const appointments = await query(sql, params);
        res.json({ success: true, appointments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Update Appointment Status (Reschedule / Cancel / Complete)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    try {
        await run('UPDATE appointments SET status = ? WHERE appointment_id = ?', [status, id]);

        await logAudit(
            4,
            'Subasinghe R.A.G.I (Scheduling Engine)',
            'APPOINTMENT_STATUS_UPDATE',
            'Appointment Scheduling',
            `Updated status of Appointment #${id} to '${status}'`
        );

        res.json({ success: true, message: `Appointment status updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. User Notifications List
router.get('/notifications', async (req, res) => {
    const { user_id } = req.query;

    try {
        let sql = 'SELECT * FROM notifications';
        const params = [];
        if (user_id) {
            sql += ' WHERE user_id = ?';
            params.push(user_id);
        }
        sql += ' ORDER BY notification_id DESC LIMIT 50';

        const notifications = await query(sql, params);
        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
