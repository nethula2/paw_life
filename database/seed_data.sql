-- =======================================================
-- PawLife: Seed Data Script
-- Populates comprehensive realistic data for 75% Viva Demo
-- =======================================================

-- 1. Insert Base Users
INSERT OR IGNORE INTO users (user_id, first_name, last_name, email, password, phone_number, role, status) VALUES
(1, 'Sanvidu', 'S.D.N', 'sanvidu@pawlife.lk', 'admin123', '+94 71 100 6180', 'Admin', 'Active'),
(2, 'De Silva', 'L.P.B', 'desilva@pawlife.lk', 'vet123', '+94 77 101 7090', 'Veterinary Officer', 'Active'),
(3, 'Kasun', 'Jayawardena', 'kasun@pawlife.lk', 'vet123', '+94 77 234 5678', 'Veterinary Officer', 'Active'),
(4, 'Subasinghe', 'R.A.G.I', 'subasinghe@pawlife.lk', 'staff123', '+94 76 102 5210', 'Centre Manager', 'Active'),
(5, 'Balasooriya', 'B.A.H.N', 'balasooriya@pawlife.lk', 'inv123', '+94 75 103 6070', 'Inventory Manager', 'Active'),
(6, 'Alahakoon', 'A.M.B.U', 'alahakoon@pawlife.lk', 'manager123', '+94 70 101 5340', 'Centre Manager', 'Active'),
(7, 'Warnakulasuriya', 'G.A.D.T.S', 'warnakulasuriya@pawlife.lk', 'groom123', '+94 78 103 4080', 'Grooming Staff', 'Active'),
(8, 'Tharushi', 'Silva', 'tharushi@gmail.com', 'owner123', '+94 72 345 6789', 'Pet Owner', 'Active'),
(9, 'Nadeesha', 'Perera', 'nadeesha@gmail.com', 'owner123', '+94 71 987 6543', 'Pet Owner', 'Active'),
(10, 'Kamal', 'Perera', 'kamal@gmail.com', 'owner123', '+94 76 543 2109', 'Pet Owner', 'Active');

-- 2. Role Specialization Records
INSERT OR IGNORE INTO pet_owners (owner_id, user_id, nic, emergency_contact, address, gender) VALUES
(1, 8, '982341123V', '+94 77 888 1122', 'No. 45, Flower Road, Colombo 07', 'Female'),
(2, 9, '975612341V', '+94 71 444 3322', '12/A, Station Road, Nugegoda', 'Female'),
(3, 10, '851239874V', '+94 76 999 0011', '88, Galle Road, Dehiwala', 'Male');

INSERT OR IGNORE INTO veterinarians (vet_id, user_id, license_no, specialization) VALUES
(1, 2, 'SLVC-LIC-4509', 'Veterinary Medicine & Surgery'),
(2, 3, 'SLVC-LIC-3281', 'Small Animal Internal Medicine & Diagnostics');

INSERT OR IGNORE INTO grooming_staff (groomer_id, user_id, skill_level) VALUES
(1, 7, 'Master Grooming Specialist');

INSERT OR IGNORE INTO inventory_managers (manager_id, user_id, clearance_code) VALUES
(1, 5, 'INV-SUPPLY-LEAD');

-- 3. Pets Data (Digital Pet Profile Module - De Silva L.P.B)
INSERT OR IGNORE INTO pets (pet_id, owner_id, pet_name, species, breed, date_of_birth, gender, microchip_no, photo_url, medical_notes, allergies, special_instructions) VALUES
(1, 1, 'Buddy', 'Dog', 'Golden Retriever', '2021-04-12', 'Male', 'MC-981001', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', 'Past history of ear infection. Routine vaccines up to date.', 'Penicillin', 'Needs calm handling around water'),
(2, 1, 'Milo', 'Dog', 'Beagle', '2022-09-05', 'Male', 'MC-981002', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400', 'Active, healthy weight, microchipped in 2023.', 'None known', 'High energy, loves chew toys'),
(3, 2, 'Bella', 'Cat', 'Persian', '2022-02-18', 'Female', 'MC-981003', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', 'Sensitive skin coat, occasional dry flaking.', 'Dust mites', 'Use hypoallergenic oatmeal shampoo'),
(4, 2, 'Luna', 'Cat', 'Siamese', '2023-01-20', 'Female', 'MC-981004', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400', 'Indoor only cat, excellent appetite.', 'None', 'Vocal during clinical examination'),
(5, 3, 'Rocky', 'Dog', 'German Shepherd', '2020-11-30', 'Male', 'MC-981005', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', 'Agile, regular hip dysplasia checks performed.', 'Certain flea spray collars', 'Owner requests muzzle during nail clip');

-- 4. Suppliers (Smart Inventory Module - Balasooriya B.A.H.N)
INSERT OR IGNORE INTO suppliers (supplier_id, supplier_name, contact_no, email, address) VALUES
(1, 'BioVet Laboratories Lanka', '+94 11 234 5678', 'supply@biovet.lk', 'Colombo 03, Sri Lanka'),
(2, 'Apex Pet Healthcare Pharma', '+94 11 876 5432', 'orders@apexpet.lk', 'Industrial Zone, Ekala'),
(3, 'Global Groom Pro Supplies', '+94 11 345 8900', 'info@globalgroom.com', 'Kandy Road, Kelaniya');

-- 5. Medical Supply Inventory (Balasooriya B.A.H.N)
INSERT OR IGNORE INTO medical_supplies (supply_id, supply_name, category, batch_number, quantity, min_threshold, expiry_date, unit_price, supplier_id) VALUES
(1, 'Rabies Vaccine (Nobivac R)', 'Vaccine', 'VAC-2026-R01', 45, 15, '2027-08-30', 2800.00, 1),
(2, 'DHPP Canine 5-in-1 Vaccine', 'Vaccine', 'VAC-2026-D04', 6, 12, '2027-03-15', 3500.00, 1), -- Low stock alert!
(3, 'FVRCP Feline 3-in-1 Vaccine', 'Vaccine', 'VAC-2026-F02', 8, 10, '2027-05-20', 3200.00, 1), -- Low stock alert!
(4, 'Amoxicillin & Clavulanate 250mg', 'Antibiotic', 'MED-2026-A10', 140, 30, '2027-11-15', 95.00, 2),
(5, 'Meloxicam 1.5mg/ml Oral Suspension', 'Pain Relief', 'MED-2026-M04', 4, 10, '2027-04-10', 520.00, 2), -- Low stock alert!
(6, 'Hypoallergenic Oatmeal Shampoo 500ml', 'Grooming Shampoo', 'GRM-2026-S01', 32, 10, '2028-02-28', 1950.00, 3),
(7, 'Sterile Surgical Gauze Pack', 'Surgical Supply', 'SUR-2026-G12', 75, 20, '2028-10-31', 380.00, 2);

-- 6. Grooming Services Catalog (Warnakulasuriya G.A.D.T.S)
INSERT OR IGNORE INTO grooming_services (service_id, service_name, category, price, duration_minutes, description) VALUES
(1, 'Full Luxury Bath & Coat Styling', 'Full Package', 4800.00, 60, 'Deep coat cleanse, conditioning, hand blow dry, full custom breed scissor cut & nail trim.'),
(2, 'Medicated Skin Therapy Bath', 'Specialty Care', 4200.00, 45, 'Antibacterial/antifungal medicated soak, soothing skin treatment, blow dry and hygiene trim.'),
(3, 'De-shedding & Undercoat Removal', 'Specialty Care', 3800.00, 50, 'High-velocity blowout, furminator deshedding treatment, reducing shedding by up to 90%.'),
(4, 'Express Hygiene & Nail Trim', 'Basic Grooming', 1800.00, 25, 'Ear cleaning, paw pad shaving, sanitary trim, and precision nail clipping/grinding.');

-- 7. Appointments (Appointment Scheduling Module - Subasinghe R.A.G.I)
INSERT OR IGNORE INTO appointments (appointment_id, pet_id, owner_id, service_type, booking_date, time_slot, assigned_staff_id, status, notes) VALUES
(1, 1, 1, 'Veterinary Care', '2026-09-14', '09:00 AM - 09:30 AM', 3, 'Confirmed', 'Routine physical examination and ear redness check'),
(2, 3, 2, 'Grooming', '2026-09-14', '10:00 AM - 11:00 AM', 7, 'In Progress', 'Persian breed full scissor styling and skin check'),
(3, 2, 1, 'Vaccination', '2026-09-15', '11:00 AM - 11:30 AM', 2, 'Booked', 'Annual booster rabies and DHPP vaccination'),
(4, 5, 3, 'Grooming', '2026-09-15', '02:00 PM - 03:00 PM', 7, 'Booked', 'De-shedding package for German Shepherd'),
(5, 4, 2, 'Veterinary Care', '2026-09-12', '03:30 PM - 04:00 PM', 3, 'Completed', 'Appetite check and mild eye discharge treatment');

-- 8. Payments
INSERT OR IGNORE INTO payments (payment_id, appointment_id, amount, method, payment_date, status) VALUES
(1, 1, 3500.00, 'Credit Card', '2026-09-14 09:35:00', 'Paid'),
(2, 2, 4800.00, 'Cash', '2026-09-14 10:15:00', 'Paid'),
(3, 5, 3000.00, 'Bank Transfer', '2026-09-12 16:10:00', 'Paid');

-- 9. Consultations & Digital Prescriptions (De Silva L.P.B - IT25101709)
INSERT OR IGNORE INTO consultations (consultation_id, appointment_id, pet_id, vet_id, consultation_date, symptoms, vitals, diagnosis, treatment_notes) VALUES
(1, 5, 4, 2, '2026-09-12 15:45:00', 'Clear bilateral ocular discharge, frequent blinking, slight redness', 'Weight: 3.8kg, Temp: 38.6C, Heart Rate: 130 bpm', 'Mild Feline Allergic Conjunctivitis', 'Cleaned ocular discharge with sterile saline. Prescribed topical antibiotic/anti-inflammatory drops.'),
(2, 1, 1, 1, '2026-09-14 09:20:00', 'Head shaking, scratching left ear, mild dark discharge', 'Weight: 31.5kg, Temp: 38.4C, Heart Rate: 95 bpm', 'Otitis Externa (Left Ear Fungal/Bacterial Overgrowth)', 'Deep ear canal flush performed. Instilled anti-infective drops. Scheduled follow-up in 10 days.');

INSERT OR IGNORE INTO prescriptions (prescription_id, consultation_id, pet_id, vet_id, issued_date, medication_details, dosage, instructions, status) VALUES
(1, 1, 4, 2, '2026-09-12 15:55:00', 'Tobramycin 0.3% Ophthalmic Drops', '1 drop in both eyes every 8 hours', 'Apply carefully after cleaning discharge for 5 consecutive days', 'Active'),
(2, 2, 1, 1, '2026-09-14 09:30:00', 'Surolan Otic Suspension & Amoxicillin 250mg', '5 drops left ear BID; 1 tablet PO BID with food', 'Complete full 7-day course even if ear scratching diminishes', 'Active');

-- 10. Vaccination Records (De Silva L.P.B - IT25101709)
INSERT OR IGNORE INTO vaccination_records (record_id, pet_id, vaccine_name, batch_number, date_administered, next_due_date, certificate_no, administered_by, status, remarks) VALUES
(1, 1, 'Rabies Nobivac R', 'VAC-2025-R09', '2025-09-10', '2026-09-10', 'CERT-RB-8921', 1, 'Overdue', 'Annual rabies booster is overdue by 3 days. Alert generated.'),
(2, 1, 'Canine DHPP 5-in-1', 'VAC-2026-D01', '2026-03-01', '2027-03-01', 'CERT-DH-9012', 1, 'Completed', 'Protected against Parvovirus, Distemper & Hepatitis.'),
(3, 3, 'Feline FVRCP 3-in-1', 'VAC-2025-F08', '2025-10-15', '2026-10-15', 'CERT-FV-7714', 2, 'Upcoming', 'Due in 1 month.'),
(4, 5, 'Rabies Nobivac R', 'VAC-2026-R01', '2026-01-20', '2027-01-20', 'CERT-RB-9443', 2, 'Completed', 'Valid until January 2027.');

-- 11. Grooming Sessions Workflow (Warnakulasuriya G.A.D.T.S - IT25103408)
INSERT OR IGNORE INTO grooming_sessions (session_id, appointment_id, pet_id, groomer_id, service_id, progress_status, coat_condition, observations, photo_url, started_at, completed_at) VALUES
(1, 2, 3, 1, 1, 'Bathing', 'Dense long coat, slight matting behind collar area', 'Tolerating bath well; applied lavender calming shampoo rinse.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', '2026-09-14 10:05:00', NULL),
(2, 4, 5, 1, 3, 'Checked-in', 'Heavy seasonal shedding on undercoat, skin clean', 'Awaiting station availability after current bath cycle.', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', '2026-09-14 10:45:00', NULL),
(3, NULL, 1, 1, 1, 'Ready for Pick-up', 'Coat fully brushed, silky and detangled', 'Grooming completed. Pet is relaxed and resting in suite 2.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', '2026-09-14 08:30:00', '2026-09-14 09:40:00');

-- 12. Staff Shifts (Operational Centre & Staff Module - Alahakoon A.M.B.U - IT25101534)
INSERT OR IGNORE INTO staff_shifts (shift_id, user_id, shift_date, shift_type, start_time, end_time, status, max_hours_limit) VALUES
(1, 2, '2026-09-14', 'Morning', '08:00:00', '14:00:00', 'Completed', 8),
(2, 3, '2026-09-14', 'Evening', '14:00:00', '20:00:00', 'Scheduled', 8),
(3, 7, '2026-09-14', 'Full Day', '09:00:00', '17:00:00', 'Scheduled', 8),
(4, 5, '2026-09-14', 'Morning', '08:30:00', '16:30:00', 'Scheduled', 8),
(5, 6, '2026-09-14', 'Full Day', '08:00:00', '17:00:00', 'Scheduled', 8),
(6, 2, '2026-09-15', 'Morning', '08:00:00', '14:00:00', 'Scheduled', 8),
(7, 7, '2026-09-15', 'Morning', '09:00:00', '15:00:00', 'Scheduled', 8);

-- 13. Role Permissions Matrix (Sanvidu S.D.N - IT25100618)
INSERT OR IGNORE INTO role_permissions (permission_id, role_name, module_name, can_create, can_read, can_update, can_delete, is_master_role) VALUES
-- Administrator (Master Role: Locked against unauthorized tampering)
(1, 'Admin', 'System Administration & BI', 1, 1, 1, 1, 1),
(2, 'Admin', 'Pet Profile & Health Record', 1, 1, 1, 1, 1),
(3, 'Admin', 'Appointment Scheduling', 1, 1, 1, 1, 1),
(4, 'Admin', 'Smart Inventory', 1, 1, 1, 1, 1),
(5, 'Admin', 'Operational Centre & Staff', 1, 1, 1, 1, 1),
(6, 'Admin', 'Pet Grooming Workflow', 1, 1, 1, 1, 1),

-- Centre Manager
(7, 'Centre Manager', 'System Administration & BI', 0, 1, 0, 0, 0),
(8, 'Centre Manager', 'Pet Profile & Health Record', 0, 1, 0, 0, 0),
(9, 'Centre Manager', 'Appointment Scheduling', 1, 1, 1, 1, 0),
(10, 'Centre Manager', 'Smart Inventory', 0, 1, 0, 0, 0),
(11, 'Centre Manager', 'Operational Centre & Staff', 1, 1, 1, 1, 0),
(12, 'Centre Manager', 'Pet Grooming Workflow', 0, 1, 1, 0, 0),

-- Veterinary Officer
(13, 'Veterinary Officer', 'System Administration & BI', 0, 0, 0, 0, 0),
(14, 'Veterinary Officer', 'Pet Profile & Health Record', 1, 1, 1, 0, 0),
(15, 'Veterinary Officer', 'Appointment Scheduling', 0, 1, 1, 0, 0),
(16, 'Veterinary Officer', 'Smart Inventory', 0, 1, 1, 0, 0),
(17, 'Veterinary Officer', 'Operational Centre & Staff', 0, 1, 0, 0, 0),
(18, 'Veterinary Officer', 'Pet Grooming Workflow', 0, 1, 0, 0, 0),

-- Inventory Manager
(19, 'Inventory Manager', 'System Administration & BI', 0, 0, 0, 0, 0),
(20, 'Inventory Manager', 'Pet Profile & Health Record', 0, 0, 0, 0, 0),
(21, 'Inventory Manager', 'Appointment Scheduling', 0, 1, 0, 0, 0),
(22, 'Inventory Manager', 'Smart Inventory', 1, 1, 1, 1, 0),
(23, 'Inventory Manager', 'Operational Centre & Staff', 0, 1, 0, 0, 0),
(24, 'Inventory Manager', 'Pet Grooming Workflow', 0, 0, 0, 0, 0),

-- Grooming Staff
(25, 'Grooming Staff', 'System Administration & BI', 0, 0, 0, 0, 0),
(26, 'Grooming Staff', 'Pet Profile & Health Record', 0, 1, 0, 0, 0),
(27, 'Grooming Staff', 'Appointment Scheduling', 0, 1, 1, 0, 0),
(28, 'Grooming Staff', 'Smart Inventory', 0, 1, 0, 0, 0),
(29, 'Grooming Staff', 'Operational Centre & Staff', 0, 0, 0, 0, 0),
(30, 'Grooming Staff', 'Pet Grooming Workflow', 1, 1, 1, 0, 0),

-- Pet Owner
(31, 'Pet Owner', 'System Administration & BI', 0, 0, 0, 0, 0),
(32, 'Pet Owner', 'Pet Profile & Health Record', 1, 1, 1, 0, 0),
(33, 'Pet Owner', 'Appointment Scheduling', 1, 1, 1, 1, 0),
(34, 'Pet Owner', 'Smart Inventory', 0, 0, 0, 0, 0),
(35, 'Pet Owner', 'Operational Centre & Staff', 0, 0, 0, 0, 0),
(36, 'Pet Owner', 'Pet Grooming Workflow', 0, 1, 0, 0, 0);

-- 14. Audit Logs (Sanvidu S.D.N - IT25100618)
INSERT OR IGNORE INTO audit_logs (log_id, user_id, user_name, action, module_name, details, timestamp) VALUES
(1, 1, 'Sanvidu S.D.N (Admin)', 'USER_AUTHENTICATION', 'System Administration', 'Admin authenticated into PawLife Central Console successfully.', '2026-09-14 08:00:15'),
(2, 1, 'Sanvidu S.D.N (Admin)', 'RBAC_SECURITY_POLICY', 'RBAC Engine', 'Enforced system-locked protection on Admin master role.', '2026-09-14 08:05:22'),
(3, 3, 'Dr. Kasun Jayawardena', 'CLINICAL_CONSULTATION', 'Pet EHR Module', 'Consultation #1 logged for Luna (Cat) - Allergic Conjunctivitis', '2026-09-12 15:50:00'),
(4, 5, 'Balasooriya B.A.H.N', 'STOCK_THRESHOLD_ALERT', 'Smart Inventory', 'Triggered low-stock notification for DHPP Canine Vaccine (Qty: 6)', '2026-09-13 11:20:00'),
(5, 7, 'Warnakulasuriya G.A.D.T.S', 'GROOMING_STATUS_UPDATE', 'Grooming Workflow', 'Advanced Buddy status to Ready for Pick-up. Sent SMS notification to owner.', '2026-09-14 09:40:00');

-- 15. Notifications
INSERT OR IGNORE INTO notifications (notification_id, user_id, message, date_created, notification_type, is_read) VALUES
(1, 8, 'Reminder: Buddy is due for annual Rabies vaccination booster.', '2026-09-11 09:00:00', 'Vaccination Alert', 0),
(2, 9, 'Update: Bella is currently at Styling station in Grooming Care.', '2026-09-14 10:15:00', 'Grooming Status', 0),
(3, 6, 'Alert: Pet Rocky has upcoming grooming appointment tomorrow at 02:00 PM.', '2026-09-14 07:30:00', 'Booking Alert', 0),
(4, 5, 'Low Stock Warning: Meloxicam 1.5mg stock has dropped to 4 units (Threshold: 10).', '2026-09-14 08:15:00', 'Inventory Alert', 0);
