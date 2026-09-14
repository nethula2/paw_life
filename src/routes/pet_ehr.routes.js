const express = require('express');
const router = express.Router();
const { query, get, run } = require('../../database/db');
const { logAudit } = require('../middleware/audit');

/**
 * Member 02: De Silva L.P.B (IT25101709) - Scrum Master
 * Module 01: Digital Pet Profile & Health Record Module
 * Sequence Function: Search Pet Profile and Log Medical Consultation Notes (UC-02)
 */

// 1. Search Pet Profiles (UC-02 Step 1 & 2)
router.get('/pets', async (req, res) => {
    const { search } = req.query;

    try {
        let sql = `
            SELECT p.*, u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone
            FROM pets p
            JOIN pet_owners po ON p.owner_id = po.owner_id
            JOIN users u ON po.user_id = u.user_id
        `;
        const params = [];

        if (search && search.trim() !== '') {
            sql += ` WHERE p.pet_name LIKE ? OR p.breed LIKE ? OR p.microchip_no LIKE ? OR u.phone_number LIKE ?`;
            const pattern = `%${search.trim()}%`;
            params.push(pattern, pattern, pattern, pattern);
        }

        sql += ' ORDER BY p.pet_name ASC';
        const pets = await query(sql, params);

        // Alternative Flow 2.a: No matching pet found
        if (pets.length === 0 && search) {
            return res.json({
                success: true,
                pets: [],
                message: 'No records match search criteria.'
            });
        }

        res.json({ success: true, pets });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get Complete Pet EHR (UC-02 Step 3 & 4)
router.get('/pets/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const pet = await get(`
            SELECT p.*, u.first_name || ' ' || u.last_name AS owner_name, u.phone_number AS owner_phone, u.email AS owner_email, po.address, po.emergency_contact
            FROM pets p
            JOIN pet_owners po ON p.owner_id = po.owner_id
            JOIN users u ON po.user_id = u.user_id
            WHERE p.pet_id = ?
        `, [id]);

        if (!pet) {
            return res.status(404).json({ success: false, error: 'Pet record not found.' });
        }

        // Consultations history
        const consultations = await query(`
            SELECT c.*, u.first_name || ' ' || u.last_name AS vet_name, v.license_no
            FROM consultations c
            JOIN veterinarians v ON c.vet_id = v.vet_id
            JOIN users u ON v.user_id = u.user_id
            WHERE c.pet_id = ?
            ORDER BY c.consultation_date DESC
        `, [id]);

        // Prescriptions history
        const prescriptions = await query(`
            SELECT pr.*, u.first_name || ' ' || u.last_name AS vet_name
            FROM prescriptions pr
            JOIN veterinarians v ON pr.vet_id = v.vet_id
            JOIN users u ON v.user_id = u.user_id
            WHERE pr.pet_id = ?
            ORDER BY pr.issued_date DESC
        `, [id]);

        // Vaccination timeline
        const vaccinations = await query(`
            SELECT vr.*, u.first_name || ' ' || u.last_name AS vet_name
            FROM vaccination_records vr
            JOIN veterinarians v ON vr.administered_by = v.vet_id
            JOIN users u ON v.user_id = u.user_id
            WHERE vr.pet_id = ?
            ORDER BY vr.date_administered DESC
        `, [id]);

        res.json({
            success: true,
            pet,
            consultations,
            prescriptions,
            vaccinations
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Register New Pet Profile (PBI-21)
router.post('/pets', async (req, res) => {
    const { owner_id, pet_name, species, breed, date_of_birth, gender, microchip_no, photo_url, medical_notes, allergies, special_instructions } = req.body;

    if (!pet_name || !species || !breed || !date_of_birth || !gender) {
        return res.status(400).json({ success: false, error: 'Missing required pet registration fields.' });
    }

    try {
        const result = await run(`
            INSERT INTO pets (owner_id, pet_name, species, breed, date_of_birth, gender, microchip_no, photo_url, medical_notes, allergies, special_instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            owner_id || 1,
            pet_name,
            species,
            breed,
            date_of_birth,
            gender,
            microchip_no || `MC-${Date.now().toString().slice(-6)}`,
            photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
            medical_notes || '',
            allergies || 'None recorded',
            special_instructions || ''
        ]);

        await logAudit(
            2,
            'De Silva L.P.B (EHR Module)',
            'PET_PROFILE_CREATED',
            'Digital Pet Profile',
            `Registered new pet: ${pet_name} (${species} - ${breed})`
        );

        res.json({
            success: true,
            petId: result.lastID,
            message: `Pet profile for '${pet_name}' created successfully.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Log Medical Consultation Notes (UC-02 Step 5-10)
router.post('/consultations', async (req, res) => {
    const { appointment_id, pet_id, vet_id, symptoms, vitals, diagnosis, treatment_notes, prescription } = req.body;

    // Alternative Flow 8.a: Mandatory clinical fields empty
    if (!diagnosis || !diagnosis.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Mandatory clinical field missing: Diagnosis is required before saving consultation.'
        });
    }
    if (!treatment_notes || !treatment_notes.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Mandatory clinical field missing: Treatment notes are required.'
        });
    }

    try {
        const result = await run(`
            INSERT INTO consultations (appointment_id, pet_id, vet_id, consultation_date, symptoms, vitals, diagnosis, treatment_notes)
            VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?, ?, ?)
        `, [
            appointment_id || null,
            pet_id,
            vet_id || 1,
            symptoms || 'General clinical checkup',
            vitals || 'Temp: Normal, Heart Rate: Normal',
            diagnosis,
            treatment_notes
        ]);

        const consultationId = result.lastID;

        // Auto-generate digital prescription if prescribed
        let prescriptionId = null;
        if (prescription && prescription.medication_details) {
            const rxResult = await run(`
                INSERT INTO prescriptions (consultation_id, pet_id, vet_id, issued_date, medication_details, dosage, instructions, status)
                VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?, ?, 'Active')
            `, [
                consultationId,
                pet_id,
                vet_id || 1,
                prescription.medication_details,
                prescription.dosage || 'As directed',
                prescription.instructions || 'Administer with food'
            ]);
            prescriptionId = rxResult.lastID;
        }

        // If linked to an appointment, mark appointment as Completed
        if (appointment_id) {
            await run(`UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?`, [appointment_id]);
        }

        await logAudit(
            2,
            'De Silva L.P.B (Vet Officer)',
            'CONSULTATION_LOGGED',
            'Pet EHR Module',
            `Recorded consultation #${consultationId} for Pet ID ${pet_id}. Diagnosis: ${diagnosis}`
        );

        res.json({
            success: true,
            consultationId,
            prescriptionId,
            message: 'Consultation saved successfully and appended to pet health timeline.'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Add Vaccination Record with Auto-Calculated Next Due Date (PBI-11)
router.post('/vaccinations', async (req, res) => {
    const { pet_id, vaccine_name, batch_number, date_administered, administered_by, remarks } = req.body;

    if (!pet_id || !vaccine_name || !batch_number || !date_administered) {
        return res.status(400).json({ success: false, error: 'All vaccination record fields are mandatory.' });
    }

    try {
        // Auto-calculate next due date (Standard preventative protocol: 1 year from admin date)
        const adminDate = new Date(date_administered);
        const nextDueDate = new Date(adminDate);
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        const nextDueStr = nextDueDate.toISOString().split('T')[0];

        const certNo = `CERT-VC-${Date.now().toString().slice(-6)}`;

        const result = await run(`
            INSERT INTO vaccination_records (pet_id, vaccine_name, batch_number, date_administered, next_due_date, certificate_no, administered_by, status, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Upcoming', ?)
        `, [
            pet_id,
            vaccine_name,
            batch_number,
            date_administered,
            nextDueStr,
            certNo,
            administered_by || 1,
            remarks || `Next booster scheduled automatically for ${nextDueStr}.`
        ]);

        await logAudit(
            2,
            'De Silva L.P.B (Vet Officer)',
            'VACCINATION_RECORDED',
            'Pet EHR Module',
            `Administered ${vaccine_name} to Pet ID ${pet_id}. Next due date auto-calculated: ${nextDueStr}`
        );

        res.json({
            success: true,
            recordId: result.lastID,
            next_due_date: nextDueStr,
            certificate_no: certNo,
            message: `Vaccination record created. Next booster automatically set for ${nextDueStr}.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. View / Download Digital Prescription (PBI-12 / PBI-24)
router.get('/prescriptions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const prescription = await get(`
            SELECT pr.*, 
                   p.pet_name, p.species, p.breed, p.allergies,
                   u_owner.first_name || ' ' || u_owner.last_name AS owner_name, u_owner.phone_number AS owner_phone,
                   u_vet.first_name || ' ' || u_vet.last_name AS vet_name, v.license_no, v.specialization,
                   c.diagnosis, c.consultation_date
            FROM prescriptions pr
            JOIN pets p ON pr.pet_id = p.pet_id
            JOIN pet_owners po ON p.owner_id = po.owner_id
            JOIN users u_owner ON po.user_id = u_owner.user_id
            JOIN veterinarians v ON pr.vet_id = v.vet_id
            JOIN users u_vet ON v.user_id = u_vet.user_id
            JOIN consultations c ON pr.consultation_id = c.consultation_id
            WHERE pr.prescription_id = ?
        `, [id]);

        if (!prescription) {
            return res.status(404).json({ success: false, error: 'Prescription not found.' });
        }

        res.json({ success: true, prescription });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
