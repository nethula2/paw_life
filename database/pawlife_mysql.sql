-- ==============================================================================
-- PawLife Pet Care Management System - Full MySQL Relational Database
-- Target RDBMS: MySQL 8.0 / MySQL Workbench
-- Group: 2026-Y2-S1-MLB-B6G2-07 (SLIIT SE2030)
-- ==============================================================================

DROP DATABASE IF EXISTS `paw_life`;
CREATE DATABASE `paw_life` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `paw_life`;

-- 1. Users Table (RBAC Authentication Base)
CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20),
    `role` ENUM('Admin', 'Veterinary Officer', 'Grooming Staff', 'Inventory Manager', 'Centre Manager', 'Pet Owner') NOT NULL,
    `status` ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Sub-Entities Linked to Users
CREATE TABLE `pet_owners` (
    `owner_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNIQUE NOT NULL,
    `address` TEXT,
    `emergency_contact` VARCHAR(20),
    `preferred_contact_method` ENUM('Email', 'Phone', 'WhatsApp') DEFAULT 'Phone',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `veterinarians` (
    `vet_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNIQUE NOT NULL,
    `license_no` VARCHAR(50) NOT NULL,
    `specialization` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `grooming_staff` (
    `groomer_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNIQUE NOT NULL,
    `skill_level` VARCHAR(30) DEFAULT 'Senior Specialist',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `inventory_managers` (
    `manager_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNIQUE NOT NULL,
    `clearance_code` VARCHAR(50) DEFAULT 'INV-LVL2',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Pets Table (De Silva L.P.B - IT25101709)
CREATE TABLE `pets` (
    `pet_id` INT AUTO_INCREMENT PRIMARY KEY,
    `owner_id` INT NOT NULL,
    `pet_name` VARCHAR(60) NOT NULL,
    `species` VARCHAR(30) NOT NULL,
    `breed` VARCHAR(60) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `gender` VARCHAR(10) NOT NULL,
    `microchip_no` VARCHAR(50) UNIQUE,
    `photo_url` TEXT,
    `medical_notes` TEXT,
    `allergies` TEXT,
    `special_instructions` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_id`) REFERENCES `pet_owners`(`owner_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Appointments Table (Subasinghe R.A.G.I - IT25102521)
CREATE TABLE `appointments` (
    `appointment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` INT NOT NULL,
    `owner_id` INT NOT NULL,
    `service_type` VARCHAR(40) NOT NULL,
    `booking_date` DATE NOT NULL,
    `time_slot` VARCHAR(30) NOT NULL,
    `assigned_staff_id` INT,
    `status` VARCHAR(20) DEFAULT 'Booked',
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`owner_id`) REFERENCES `pet_owners`(`owner_id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_staff_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Payments Table
CREATE TABLE `payments` (
    `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `appointment_id` INT NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` VARCHAR(30) DEFAULT 'Cash',
    `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` VARCHAR(20) DEFAULT 'Paid',
    FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`appointment_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Medical Consultations (De Silva L.P.B - IT25101709)
CREATE TABLE `consultations` (
    `consultation_id` INT AUTO_INCREMENT PRIMARY KEY,
    `appointment_id` INT,
    `pet_id` INT NOT NULL,
    `vet_id` INT NOT NULL,
    `consultation_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `symptoms` TEXT,
    `vitals` TEXT,
    `diagnosis` TEXT NOT NULL,
    `treatment_notes` TEXT,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`vet_id`) REFERENCES `veterinarians`(`vet_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Digital Prescriptions
CREATE TABLE `prescriptions` (
    `prescription_id` INT AUTO_INCREMENT PRIMARY KEY,
    `consultation_id` INT NOT NULL,
    `pet_id` INT NOT NULL,
    `vet_id` INT NOT NULL,
    `issued_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `medication_details` TEXT NOT NULL,
    `dosage` VARCHAR(100) NOT NULL,
    `instructions` TEXT NOT NULL,
    `status` VARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`consultation_id`) ON DELETE CASCADE,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`vet_id`) REFERENCES `veterinarians`(`vet_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Vaccination Records (Auto Due Date Scheduler)
CREATE TABLE `vaccination_records` (
    `record_id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` INT NOT NULL,
    `vaccine_name` VARCHAR(80) NOT NULL,
    `batch_number` VARCHAR(50) NOT NULL,
    `date_administered` DATE NOT NULL,
    `next_due_date` DATE NOT NULL,
    `certificate_no` VARCHAR(50) UNIQUE,
    `administered_by` INT NOT NULL,
    `status` VARCHAR(20) DEFAULT 'Completed',
    `remarks` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`administered_by`) REFERENCES `veterinarians`(`vet_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Suppliers Table (Balasooriya B.A.H.N - IT25103607)
CREATE TABLE `suppliers` (
    `supplier_id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_name` VARCHAR(100) NOT NULL,
    `contact_no` VARCHAR(30) NOT NULL,
    `email` VARCHAR(100),
    `address` TEXT
) ENGINE=InnoDB;

-- 10. Medical & Retail Supplies Table (Balasooriya B.A.H.N - IT25103607)
CREATE TABLE `medical_supplies` (
    `supply_id` INT AUTO_INCREMENT PRIMARY KEY,
    `supply_name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `batch_number` VARCHAR(50) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 0,
    `min_threshold` INT NOT NULL DEFAULT 10,
    `expiry_date` DATE NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `supplier_id` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Grooming Services Catalog (Warnakulasuriya G.A.D.T.S)
CREATE TABLE `grooming_services` (
    `service_id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_name` VARCHAR(80) NOT NULL,
    `category` VARCHAR(40) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_minutes` INT NOT NULL,
    `description` TEXT
) ENGINE=InnoDB;

-- 12. Grooming Sessions Workflow (4-Stage Pipeline)
CREATE TABLE `grooming_sessions` (
    `session_id` INT AUTO_INCREMENT PRIMARY KEY,
    `appointment_id` INT,
    `pet_id` INT NOT NULL,
    `groomer_id` INT,
    `service_id` INT,
    `progress_status` VARCHAR(50) DEFAULT 'Checked-in',
    `coat_condition` VARCHAR(100),
    `observations` TEXT,
    `photo_url` TEXT,
    `started_at` DATETIME,
    `completed_at` DATETIME,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`groomer_id`) REFERENCES `grooming_staff`(`groomer_id`) ON DELETE SET NULL,
    FOREIGN KEY (`service_id`) REFERENCES `grooming_services`(`service_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. Staff Shift Rosters (Alahakoon A.M.B.U - IT25101534)
CREATE TABLE `staff_shifts` (
    `shift_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `shift_date` DATE NOT NULL,
    `shift_type` VARCHAR(30) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `status` VARCHAR(20) DEFAULT 'Scheduled',
    `max_hours_limit` INT DEFAULT 8,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. RBAC Permissions Matrix (Sanvidu S.D.N - IT25100618)
CREATE TABLE `role_permissions` (
    `permission_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(40) NOT NULL,
    `module_name` VARCHAR(60) NOT NULL,
    `can_create` TINYINT(1) DEFAULT 0,
    `can_read` TINYINT(1) DEFAULT 1,
    `can_update` TINYINT(1) DEFAULT 0,
    `can_delete` TINYINT(1) DEFAULT 0,
    `is_master_role` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB;

-- 15. Audit Logs (Immutable Ledger - Sanvidu S.D.N)
CREATE TABLE `audit_logs` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT,
    `user_name` VARCHAR(100),
    `action` VARCHAR(60) NOT NULL,
    `module_name` VARCHAR(60) NOT NULL,
    `details` TEXT,
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 16. Notifications Center
CREATE TABLE `notifications` (
    `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `date_created` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `notification_type` VARCHAR(40) DEFAULT 'General Alert',
    `is_read` TINYINT(1) DEFAULT 0,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- POPULATE SEED DATA (Viva Demonstration Scope)
-- ==============================================================================

-- Users
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password`, `phone_number`, `role`, `status`) VALUES
(1, 'Sanvidu', 'S.D.N', 'sanvidu.admin@pawlife.lk', '$2b$10$PawLifeAdminSecureHash2026', '+94 77 123 4567', 'Admin', 'Active'),
(2, 'De Silva', 'L.P.B', 'desilva.vet@pawlife.lk', '$2b$10$PawLifeVetSecureHash2026', '+94 71 234 5678', 'Veterinary Officer', 'Active'),
(3, 'Subasinghe', 'R.A.G.I', 'subasinghe.sched@pawlife.lk', '$2b$10$PawLifeSchedSecureHash2026', '+94 76 345 6789', 'Veterinary Officer', 'Active'),
(4, 'Balasooriya', 'B.A.H.N', 'balasooriya.stock@pawlife.lk', '$2b$10$PawLifeStockSecureHash2026', '+94 78 456 7890', 'Inventory Manager', 'Active'),
(5, 'Alahakoon', 'A.M.B.U', 'alahakoon.ops@pawlife.lk', '$2b$10$PawLifeOpsSecureHash2026', '+94 72 567 8901', 'Centre Manager', 'Active'),
(6, 'Warnakulasuriya', 'G.A.D.T.S', 'warnakula.groom@pawlife.lk', '$2b$10$PawLifeGroomSecureHash2026', '+94 75 678 9012', 'Grooming Staff', 'Active'),
(7, 'Nethmi', 'Perera', 'nethmi.p@gmail.com', '$2b$10$ClientSecureHash202601', '+94 77 888 1122', 'Pet Owner', 'Active'),
(8, 'Kavinda', 'Silva', 'kavinda.s@gmail.com', '$2b$10$ClientSecureHash202602', '+94 71 999 3344', 'Pet Owner', 'Active'),
(9, 'Dilshan', 'Fernando', 'dilshan.f@gmail.com', '$2b$10$ClientSecureHash202603', '+94 76 111 5566', 'Pet Owner', 'Active'),
(10, 'Saman', 'Gunawardena', 'saman.g@gmail.com', '$2b$10$ClientSecureHash202604', '+94 78 222 7788', 'Pet Owner', 'Active');

-- Specialized Roles
INSERT INTO `pet_owners` (`owner_id`, `user_id`, `address`, `emergency_contact`, `preferred_contact_method`) VALUES
(1, 7, 'No. 45, Flower Road, Colombo 07', '+94 77 999 8877', 'WhatsApp'),
(2, 8, '12/A, Temple Road, Mount Lavinia', '+94 71 888 7766', 'Phone'),
(3, 9, '88, Kandy Road, Kiribathgoda', '+94 76 777 6655', 'Email'),
(4, 10, '102, Galle Road, Dehiwala', '+94 78 666 5544', 'Phone');

INSERT INTO `veterinarians` (`vet_id`, `user_id`, `license_no`, `specialization`) VALUES
(1, 2, 'SLVC-REG-2021-884', 'Senior Veterinary Surgeon'),
(2, 3, 'SLVC-REG-2023-102', 'Clinical Care & Preventive Vaccinology');

INSERT INTO `grooming_staff` (`groomer_id`, `user_id`, `skill_level`) VALUES
(1, 6, 'Master Grooming Specialist');

INSERT INTO `inventory_managers` (`manager_id`, `user_id`, `clearance_code`) VALUES
(1, 4, 'INV-SUPPLY-LEAD');

-- Pets
INSERT INTO `pets` (`pet_id`, `owner_id`, `pet_name`, `species`, `breed`, `date_of_birth`, `gender`, `microchip_no`, `photo_url`, `medical_notes`, `allergies`, `special_instructions`) VALUES
(1, 1, 'Buddy', 'Dog', 'Golden Retriever', '2021-04-12', 'Male', 'MC-981001', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', 'Past history of ear infection. Routine vaccines up to date.', 'Penicillin', 'Needs calm handling around water'),
(2, 1, 'Milo', 'Dog', 'Beagle', '2022-09-05', 'Male', 'MC-981002', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400', 'Active, healthy weight, microchipped in 2023.', 'None known', 'High energy, loves chew toys'),
(3, 2, 'Bella', 'Cat', 'Persian', '2022-02-18', 'Female', 'MC-981003', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', 'Sensitive skin coat, occasional dry flaking.', 'Dust mites', 'Use hypoallergenic oatmeal shampoo'),
(4, 2, 'Luna', 'Cat', 'Siamese', '2023-01-20', 'Female', 'MC-981004', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400', 'Indoor only cat, excellent appetite.', 'None', 'Vocal during clinical examination'),
(5, 3, 'Rocky', 'Dog', 'German Shepherd', '2020-11-30', 'Male', 'MC-981005', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', 'Agile, regular hip dysplasia checks performed.', 'Certain flea spray collars', 'Owner requests muzzle during nail clip');

-- Suppliers
INSERT INTO `suppliers` (`supplier_id`, `supplier_name`, `contact_no`, `email`, `address`) VALUES
(1, 'BioVet Laboratories Lanka', '+94 11 234 5678', 'supply@biovet.lk', 'Colombo 03, Sri Lanka'),
(2, 'Apex Pet Healthcare Pharma', '+94 11 876 5432', 'orders@apexpet.lk', 'Industrial Zone, Ekala'),
(3, 'Global Groom Pro Supplies', '+94 11 345 8900', 'info@globalgroom.com', 'Kandy Road, Kelaniya');

-- Supplies (Clinical Pharmacy + Consumer Grooming & Wellness Market)
INSERT INTO `medical_supplies` (`supply_id`, `supply_name`, `category`, `batch_number`, `quantity`, `min_threshold`, `expiry_date`, `unit_price`, `supplier_id`) VALUES
-- Clinical Items (For Hospital EHR / Staff Use Only)
(1, 'Rabies Vaccine (Nobivac R)', 'Vaccine', 'VAC-2026-R01', 45, 15, '2027-08-30', 2800.00, 1),
(2, 'DHPP Canine 5-in-1 Vaccine', 'Vaccine', 'VAC-2026-D04', 6, 12, '2027-03-15', 3500.00, 1),
(3, 'FVRCP Feline 3-in-1 Vaccine', 'Vaccine', 'VAC-2026-F02', 8, 10, '2027-05-20', 3200.00, 1),
(4, 'Amoxicillin & Clavulanate 250mg', 'Antibiotic', 'MED-2026-A10', 140, 30, '2027-11-15', 95.00, 2),
(5, 'Meloxicam 1.5mg/ml Oral Suspension', 'Pain Relief', 'MED-2026-M04', 4, 10, '2027-04-10', 520.00, 2),
(6, 'Hypoallergenic Oatmeal Shampoo 500ml', 'Grooming Shampoo', 'GRM-2026-S01', 32, 10, '2028-02-28', 1950.00, 3),
(7, 'Sterile Surgical Gauze Pack', 'Surgical Supply', 'SUR-2026-G12', 75, 20, '2028-10-31', 380.00, 2),
(8, 'Antiseptic Solution 500ml', 'Surgical Supply', 'SUR-2026-A01', 25, 5, '2028-06-30', 500.00, 2),

-- Consumer Retail Market: Shampoos & Washes
(10, 'Organic Oatmeal & Aloe Soothing Shampoo (500ml)', 'Grooming Shampoo', 'SHP-2026-OAT', 35, 8, '2028-06-30', 1950.00, 3),
(11, 'Lavender Calming Aromatherapy Dog Wash (400ml)', 'Grooming Shampoo', 'SHP-2026-LAV', 28, 6, '2028-08-15', 2100.00, 3),
(12, 'Anti-Tangle Silk Protein Fur Conditioner (350ml)', 'Grooming Shampoo', 'SHP-2026-SLK', 24, 5, '2028-05-20', 1850.00, 3),
(13, 'Tearless Gentle Kitten & Puppy Cleanser (300ml)', 'Grooming Shampoo', 'SHP-2026-TRL', 30, 8, '2028-09-10', 1600.00, 3),

-- Consumer Retail Market: Brushes & Grooming Tools
(14, 'Professional Undercoat Deshedding Slicker Brush', 'Grooming Tool', 'BRS-2026-SLK', 40, 10, '2030-12-31', 2400.00, 3),
(15, 'Dual-Sided Eco Bamboo Pin & Bristle Brush', 'Grooming Tool', 'BRS-2026-BAM', 32, 8, '2030-12-31', 1800.00, 3),
(16, 'Stainless Steel Dematting & Detangling Comb', 'Grooming Tool', 'BRS-2026-CMB', 25, 5, '2030-12-31', 1450.00, 3),
(17, 'Soft Silicone Bath & Massage Lather Scrubber', 'Grooming Tool', 'BRS-2026-SCR', 50, 12, '2030-12-31', 1200.00, 3),

-- Consumer Retail Market: Wellness, Balms & Dental
(18, 'Organic Lavender Paw & Nose Protection Balm (100g)', 'Wellness', 'BLM-2026-PAW', 30, 8, '2028-04-30', 1450.00, 3),
(19, 'Wild Alaskan Salmon Oil Omega-3 Coat Enhancer (250ml)', 'Wellness', 'WEL-2026-SLM', 22, 6, '2028-01-15', 3200.00, 2),
(20, 'Probiotic Daily Digestive Health Chews (60ct)', 'Wellness', 'WEL-2026-PRO', 26, 7, '2027-12-31', 2650.00, 2),
(21, 'Enzymatic Dental Care Kit & Dual Finger Brush', 'Wellness', 'WEL-2026-DNT', 18, 5, '2028-07-20', 1800.00, 3);

-- Grooming Services
INSERT INTO `grooming_services` (`service_id`, `service_name`, `category`, `price`, `duration_minutes`, `description`) VALUES
(1, 'Full Luxury Bath & Coat Styling', 'Full Package', 4800.00, 60, 'Deep coat cleanse, conditioning, hand blow dry, full custom breed scissor cut & nail trim.'),
(2, 'Medicated Skin Therapy Bath', 'Specialty Care', 4200.00, 45, 'Antibacterial/antifungal medicated soak, soothing skin treatment, blow dry and hygiene trim.'),
(3, 'De-shedding & Undercoat Removal', 'Specialty Care', 3800.00, 50, 'High-velocity blowout, furminator deshedding treatment, reducing shedding by up to 90%.'),
(4, 'Express Hygiene & Nail Trim', 'Basic Grooming', 1800.00, 25, 'Ear cleaning, paw pad shaving, sanitary trim, and precision nail clipping/grinding.');

-- Appointments
INSERT INTO `appointments` (`appointment_id`, `pet_id`, `owner_id`, `service_type`, `booking_date`, `time_slot`, `assigned_staff_id`, `status`, `notes`) VALUES
(1, 1, 1, 'Veterinary Care', '2026-09-14', '09:00 AM - 09:30 AM', 2, 'Confirmed', 'Routine physical examination and ear redness check'),
(2, 3, 2, 'Grooming', '2026-09-14', '10:00 AM - 11:00 AM', 6, 'In Progress', 'Persian breed full scissor styling and skin check'),
(3, 2, 1, 'Vaccination', '2026-09-15', '11:00 AM - 11:30 AM', 3, 'Booked', 'Annual booster rabies and DHPP vaccination'),
(4, 5, 3, 'Grooming', '2026-09-15', '02:00 PM - 03:00 PM', 6, 'Booked', 'De-shedding package for German Shepherd'),
(5, 4, 2, 'Veterinary Care', '2026-09-12', '03:30 PM - 04:00 PM', 2, 'Completed', 'Appetite check and mild eye discharge treatment');

-- Payments
INSERT INTO `payments` (`payment_id`, `appointment_id`, `amount`, `method`, `payment_date`, `status`) VALUES
(1, 1, 3500.00, 'Credit Card', '2026-09-14 09:35:00', 'Paid'),
(2, 2, 4800.00, 'Cash', '2026-09-14 10:15:00', 'Paid'),
(3, 5, 3000.00, 'Bank Transfer', '2026-09-12 16:10:00', 'Paid');

-- Consultations
INSERT INTO `consultations` (`consultation_id`, `appointment_id`, `pet_id`, `vet_id`, `consultation_date`, `symptoms`, `vitals`, `diagnosis`, `treatment_notes`) VALUES
(1, 5, 4, 1, '2026-09-12 15:45:00', 'Clear bilateral ocular discharge, frequent blinking, slight redness', 'Weight: 3.8kg, Temp: 38.6C, Heart Rate: 130 bpm', 'Mild Feline Allergic Conjunctivitis', 'Cleaned ocular discharge with sterile saline. Prescribed topical antibiotic drops.'),
(2, 1, 1, 1, '2026-09-14 09:20:00', 'Head shaking, scratching left ear, mild dark discharge', 'Weight: 31.5kg, Temp: 38.4C, Heart Rate: 95 bpm', 'Otitis Externa (Left Ear Fungal/Bacterial Overgrowth)', 'Deep ear canal flush performed. Instilled anti-infective drops.');

-- Prescriptions
INSERT INTO `prescriptions` (`prescription_id`, `consultation_id`, `pet_id`, `vet_id`, `issued_date`, `medication_details`, `dosage`, `instructions`, `status`) VALUES
(1, 1, 4, 1, '2026-09-12 15:55:00', 'Tobramycin 0.3% Ophthalmic Drops', '1 drop in both eyes every 8 hours', 'Apply carefully after cleaning discharge for 5 consecutive days', 'Active'),
(2, 2, 1, 1, '2026-09-14 09:30:00', 'Surolan Otic Suspension & Amoxicillin 250mg', '5 drops left ear BID; 1 tablet PO BID with food', 'Complete full 7-day course even if ear scratching diminishes', 'Active');

-- Vaccination Records
INSERT INTO `vaccination_records` (`record_id`, `pet_id`, `vaccine_name`, `batch_number`, `date_administered`, `next_due_date`, `certificate_no`, `administered_by`, `status`, `remarks`) VALUES
(1, 1, 'Rabies Nobivac R', 'VAC-2025-R09', '2025-09-10', '2026-09-10', 'CERT-RB-8921', 1, 'Overdue', 'Annual rabies booster is overdue by 3 days. Alert generated.'),
(2, 1, 'Canine DHPP 5-in-1', 'VAC-2026-D01', '2026-03-01', '2027-03-01', 'CERT-DH-9012', 1, 'Completed', 'Protected against Parvovirus, Distemper & Hepatitis.'),
(3, 3, 'Feline FVRCP 3-in-1', 'VAC-2025-F08', '2025-10-15', '2026-10-15', 'CERT-FV-7714', 2, 'Upcoming', 'Due in 1 month.'),
(4, 5, 'Rabies Nobivac R', 'VAC-2026-R01', '2026-01-20', '2027-01-20', 'CERT-RB-9443', 2, 'Completed', 'Valid until January 2027.');

-- Grooming Sessions
INSERT INTO `grooming_sessions` (`session_id`, `appointment_id`, `pet_id`, `groomer_id`, `service_id`, `progress_status`, `coat_condition`, `observations`, `photo_url`, `started_at`, `completed_at`) VALUES
(1, 2, 3, 1, 1, 'Bathing', 'Dense long coat, slight matting behind collar area', 'Tolerating bath well; applied lavender calming shampoo rinse.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', '2026-09-14 10:05:00', NULL),
(2, 4, 5, 1, 3, 'Checked-in', 'Heavy seasonal shedding on undercoat, skin clean', 'Awaiting station availability after current bath cycle.', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', '2026-09-14 10:45:00', NULL),
(3, NULL, 1, 1, 1, 'Ready for Pick-up', 'Coat fully brushed, silky and detangled', 'Grooming completed. Pet is relaxed and resting in suite 2.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', '2026-09-14 08:30:00', '2026-09-14 09:40:00');

-- Staff Shifts
INSERT INTO `staff_shifts` (`shift_id`, `user_id`, `shift_date`, `shift_type`, `start_time`, `end_time`, `status`, `max_hours_limit`) VALUES
(1, 2, '2026-09-14', 'Morning', '08:00:00', '14:00:00', 'Completed', 8),
(2, 3, '2026-09-14', 'Evening', '14:00:00', '20:00:00', 'Scheduled', 8),
(3, 6, '2026-09-14', 'Full Day', '09:00:00', '17:00:00', 'Scheduled', 8),
(4, 4, '2026-09-14', 'Morning', '08:30:00', '16:30:00', 'Scheduled', 8),
(5, 5, '2026-09-14', 'Full Day', '08:00:00', '17:00:00', 'Scheduled', 8),
(6, 2, '2026-09-15', 'Morning', '08:00:00', '14:00:00', 'Scheduled', 8),
(7, 6, '2026-09-15', 'Morning', '09:00:00', '15:00:00', 'Scheduled', 8);

-- Role Permissions Matrix
INSERT INTO `role_permissions` (`permission_id`, `role_name`, `module_name`, `can_create`, `can_read`, `can_update`, `can_delete`, `is_master_role`) VALUES
-- Admin
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

-- Audit Logs
INSERT INTO `audit_logs` (`log_id`, `user_id`, `user_name`, `action`, `module_name`, `details`, `timestamp`) VALUES
(1, 1, 'Sanvidu S.D.N (Admin)', 'USER_AUTHENTICATION', 'System Administration', 'Admin authenticated into PawLife Central Console successfully.', '2026-09-14 08:00:15'),
(2, 1, 'Sanvidu S.D.N (Admin)', 'RBAC_SECURITY_POLICY', 'RBAC Engine', 'Enforced system-locked protection on Admin master role.', '2026-09-14 08:05:22'),
(3, 2, 'Dr. Kasun Jayawardena', 'CLINICAL_CONSULTATION', 'Pet EHR Module', 'Consultation #1 logged for Luna (Cat) - Allergic Conjunctivitis', '2026-09-12 15:50:00'),
(4, 4, 'Balasooriya B.A.H.N', 'STOCK_THRESHOLD_ALERT', 'Smart Inventory', 'Triggered low-stock notification for DHPP Canine Vaccine (Qty: 6)', '2026-09-13 11:20:00'),
(5, 6, 'Warnakulasuriya G.A.D.T.S', 'GROOMING_STATUS_UPDATE', 'Grooming Workflow', 'Advanced Buddy status to Ready for Pick-up. Sent SMS notification to owner.', '2026-09-14 09:40:00');

-- Notifications
INSERT INTO `notifications` (`notification_id`, `user_id`, `message`, `date_created`, `notification_type`, `is_read`) VALUES
(1, 7, 'Reminder: Buddy is due for annual Rabies vaccination booster.', '2026-09-11 09:00:00', 'Vaccination Alert', 0),
(2, 8, 'Update: Bella is currently at Styling station in Grooming Care.', '2026-09-14 10:15:00', 'Grooming Status', 0),
(3, 9, 'Alert: Pet Rocky has upcoming grooming appointment tomorrow at 02:00 PM.', '2026-09-14 07:30:00', 'Booking Alert', 0),
(4, 4, 'Low Stock Warning: Meloxicam 1.5mg stock has dropped to 4 units (Threshold: 10).', '2026-09-14 08:15:00', 'Inventory Alert', 0);
