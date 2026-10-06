-- =======================================================
-- PawLife: MySQL Workbench Database Script
-- Open & Run this script in MySQL Workbench
-- Database: paw_life
-- =======================================================

CREATE DATABASE IF NOT EXISTS `paw_life` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `paw_life`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `staff_shifts`;
DROP TABLE IF EXISTS `grooming_sessions`;
DROP TABLE IF EXISTS `vaccination_records`;
DROP TABLE IF EXISTS `prescriptions`;
DROP TABLE IF EXISTS `consultations`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `grooming_services`;
DROP TABLE IF EXISTS `medical_supplies`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `pets`;
DROP TABLE IF EXISTS `inventory_managers`;
DROP TABLE IF EXISTS `grooming_staff`;
DROP TABLE IF EXISTS `veterinarians`;
DROP TABLE IF EXISTS `pet_owners`;
DROP TABLE IF EXISTS `users`;


CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(60) NOT NULL,
    `last_name` VARCHAR(60) NOT NULL,
    `email` VARCHAR(120) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `role` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) DEFAULT 'Active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `pet_owners` (
    `owner_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNIQUE NOT NULL,
    `nic` VARCHAR(20),
    `emergency_contact` VARCHAR(20),
    `address` TEXT,
    `gender` VARCHAR(10),
    `preferred_contact_method` VARCHAR(20) DEFAULT 'Phone',
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
    `skill_level` VARCHAR(60) DEFAULT 'Senior Specialist',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `inventory_managers` (
    `manager_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNIQUE NOT NULL,
    `clearance_code` VARCHAR(50) DEFAULT 'INV-LVL2',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `pets` (
    `pet_id` INT AUTO_INCREMENT PRIMARY KEY,
    `owner_id` INT NOT NULL,
    `pet_name` VARCHAR(60) NOT NULL,
    `species` VARCHAR(30) NOT NULL,
    `breed` VARCHAR(60) NOT NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(10) NOT NULL,
    `microchip_no` VARCHAR(50) UNIQUE,
    `photo_url` TEXT,
    `medical_notes` TEXT,
    `allergies` TEXT,
    `special_instructions` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_id`) REFERENCES `pet_owners`(`owner_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `suppliers` (
    `supplier_id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_name` VARCHAR(100) NOT NULL,
    `contact_no` VARCHAR(30) NOT NULL,
    `email` VARCHAR(100),
    `address` TEXT
) ENGINE=InnoDB;

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

CREATE TABLE `grooming_services` (
    `service_id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_name` VARCHAR(80) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_minutes` INT NOT NULL,
    `description` TEXT
) ENGINE=InnoDB;

CREATE TABLE `appointments` (
    `appointment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` INT NOT NULL,
    `owner_id` INT NOT NULL,
    `service_type` VARCHAR(40) NOT NULL,
    `booking_date` DATE NOT NULL,
    `time_slot` VARCHAR(20) NOT NULL,
    `assigned_staff_id` INT,
    `status` VARCHAR(20) DEFAULT 'Booked',
    `notes` TEXT,
    `customer_name` VARCHAR(100),
    `pet_name` VARCHAR(60),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`owner_id`) REFERENCES `pet_owners`(`owner_id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_staff_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `payments` (
    `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `appointment_id` INT NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` VARCHAR(30) DEFAULT 'Cash',
    `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` VARCHAR(20) DEFAULT 'Paid',
    FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`appointment_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `consultations` (
    `consultation_id` INT AUTO_INCREMENT PRIMARY KEY,
    `appointment_id` INT,
    `pet_id` INT NOT NULL,
    `vet_id` INT NOT NULL,
    `consultation_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `symptoms` TEXT NOT NULL,
    `vitals` VARCHAR(100),
    `diagnosis` TEXT NOT NULL,
    `treatment_notes` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`appointment_id`) ON DELETE SET NULL,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`vet_id`) REFERENCES `veterinarians`(`vet_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE `grooming_sessions` (
    `session_id` INT AUTO_INCREMENT PRIMARY KEY,
    `appointment_id` INT,
    `pet_id` INT NOT NULL,
    `groomer_id` INT NOT NULL,
    `service_id` INT NOT NULL,
    `progress_status` VARCHAR(30) DEFAULT 'Checked-in',
    `coat_condition` VARCHAR(100),
    `observations` TEXT,
    `photo_url` TEXT,
    `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME,
    FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`appointment_id`) ON DELETE SET NULL,
    FOREIGN KEY (`pet_id`) REFERENCES `pets`(`pet_id`) ON DELETE CASCADE,
    FOREIGN KEY (`groomer_id`) REFERENCES `grooming_staff`(`groomer_id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_id`) REFERENCES `grooming_services`(`service_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `staff_shifts` (
    `shift_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `shift_date` DATE NOT NULL,
    `shift_type` VARCHAR(20) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `status` VARCHAR(20) DEFAULT 'Scheduled',
    `max_hours_limit` INT DEFAULT 8,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `role_permissions` (
    `permission_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(30) NOT NULL,
    `module_name` VARCHAR(50) NOT NULL,
    `can_create` INT NOT NULL DEFAULT 0,
    `can_read` INT NOT NULL DEFAULT 1,
    `can_update` INT NOT NULL DEFAULT 0,
    `can_delete` INT NOT NULL DEFAULT 0,
    `is_master_role` INT NOT NULL DEFAULT 0,
    UNIQUE(`role_name`, `module_name`)
) ENGINE=InnoDB;

CREATE TABLE `audit_logs` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT,
    `user_name` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `module_name` VARCHAR(50) NOT NULL,
    `details` TEXT,
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `username` VARCHAR(100),
    `module` VARCHAR(50),
    `description` TEXT,
    `action_type` VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE `notifications` (
    `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `date_created` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `notification_type` VARCHAR(30) NOT NULL,
    `is_read` INT DEFAULT 0,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `reviews` (
    `review_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_name` VARCHAR(100) NOT NULL,
    `pet_name` VARCHAR(60),
    `service_type` VARCHAR(50),
    `rating` INT CHECK(`rating` >= 1 AND `rating` <= 5),
    `review_text` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Users
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password`, `phone_number`, `role`, `status`, `created_at`) VALUES
(1, 'Sanvidu', 'S.D.N', 'sanvidu@pawlife.lk', 'admin123', '+94 71 100 6180', 'Admin', 'Active', '2026-09-29 08:32:01'),
(2, 'De Silva', 'L.P.B', 'desilva@pawlife.lk', 'password123', '+94 77 101 7090', 'Veterinary Officer', 'Active', '2026-09-29 08:32:01'),
(3, 'Kasun', 'Jayawardena', 'kasun@pawlife.lk', 'password123', '+94 77 234 5678', 'Veterinary Officer', 'Active', '2026-09-29 08:32:01'),
(4, 'Nethmi', 'Alwis', 'nethmi@pawlife.lk', 'password123', '+94 77 456 7890', 'Veterinary Officer', 'Active', '2026-09-29 08:32:01'),
(5, 'Subasinghe', 'R.A.G.I', 'subasinghe@pawlife.lk', 'password123', '+94 76 102 5210', 'Appointments Manager', 'Active', '2026-09-29 08:32:01'),
(6, 'Alahakoon', 'A.M.B.U', 'alahakoon@pawlife.lk', 'password123', '+94 70 101 5340', 'Centre Manager', 'Active', '2026-09-29 08:32:01'),
(7, 'Balasooriya', 'B.A.H.N', 'balasooriya@pawlife.lk', 'password123', '+94 75 103 6070', 'Inventory Manager', 'Active', '2026-09-29 08:32:01'),
(8, 'Chamara', 'Weerasinghe', 'chamara@pawlife.lk', 'password123', '+94 71 888 9900', 'Inventory Manager', 'Active', '2026-09-29 08:32:01'),
(9, 'Warnakulasuriya', 'G.A.D.T.S', 'warnakulasuriya@pawlife.lk', 'password123', '+94 78 103 4080', 'Grooming Staff', 'Active', '2026-09-29 08:32:01'),
(10, 'Thanuki', 'Bandara', 'thanuki@test.com', 'password123', '+94 71 555 4321', 'Grooming Staff', 'Active', '2026-09-29 08:32:01'),
(11, 'Dilani', 'Fernando', 'dilani@pawlife.lk', 'password123', '+94 72 666 7890', 'Grooming Staff', 'Active', '2026-09-29 08:32:01'),
(12, 'Tharushi', 'Silva', 'tharushi@gmail.com', 'password123', '+94 72 345 6789', 'Pet Owner', 'Active', '2026-09-29 08:32:01'),
(13, 'Nadeesha', 'Perera', 'nadeesha@gmail.com', 'password123', '+94 71 987 6543', 'Pet Owner', 'Active', '2026-09-29 08:32:01'),
(14, 'Kamal', 'Perera', 'kamal@gmail.com', 'password123', '+94 76 543 2109', 'Pet Owner', 'Active', '2026-09-29 08:32:01'),
(15, 'Anura', 'Dissanayake', 'anura@gmail.com', 'password123', '+94 77 123 4567', 'Pet Owner', 'Active', '2026-09-29 08:32:01'),
(16, 'Dinithi', 'Jayasuriya', 'dinithi@gmail.com', 'password123', '+94 78 876 5432', 'Pet Owner', 'Active', '2026-09-29 08:32:01'),
(17, 'Malith', 'Fernando', 'malith@gmail.com', 'password123', '+94 70 333 4455', 'Pet Owner', 'Active', '2026-09-29 08:32:01'),
(18, 'Sachini', 'Wickramasinghe', 'sachini@gmail.com', 'password123', '+94 75 222 1199', 'Pet Owner', 'Active', '2026-09-29 08:32:01'),
(19, 'Ruwan', 'Senanayake', 'ruwan@gmail.com', 'password123', '+94 71 654 3210', 'Pet Owner', 'Active', '2026-09-29 08:32:01');

-- Pet Owners
INSERT INTO `pet_owners` (`owner_id`, `user_id`, `nic`, `emergency_contact`, `address`, `gender`, `preferred_contact_method`) VALUES
(1, 12, '982341123V', '+94 77 888 1122', 'No. 45, Flower Road, Colombo 07', 'Female', 'Phone'),
(2, 13, '975612341V', '+94 71 444 3322', '12/A, Station Road, Nugegoda', 'Female', 'Email'),
(3, 14, '851239874V', '+94 76 999 0011', '88, Galle Road, Dehiwala', 'Male', 'Phone'),
(4, 15, '892211456V', '+94 77 111 2233', '24, Kandy Road, Kiribathgoda', 'Male', 'SMS'),
(5, 16, '996541230V', '+94 78 444 5566', '15, Park Street, Colombo 02', 'Female', 'Phone'),
(6, 17, '923001889V', '+94 70 222 3344', '56, Temple Road, Mount Lavinia', 'Male', 'Email'),
(7, 18, '967812903V', '+94 75 666 7788', '7/2, Baseline Road, Borella', 'Female', 'SMS'),
(8, 19, '881452901V', '+94 71 333 9900', '104, Havelock Road, Colombo 05', 'Male', 'Phone');

-- Veterinarians
INSERT INTO `veterinarians` (`vet_id`, `user_id`, `license_no`, `specialization`) VALUES
(1, 2, 'SLVC-LIC-4509', 'Veterinary Medicine & Surgery'),
(2, 3, 'SLVC-LIC-3281', 'Small Animal Internal Medicine & Diagnostics'),
(3, 4, 'SLVC-LIC-5820', 'Veterinary Dermatology & Preventative Care');

-- Grooming Staff
INSERT INTO `grooming_staff` (`groomer_id`, `user_id`, `skill_level`) VALUES
(1, 9, 'Senior Stylist & Master Groomer'),
(2, 10, 'Specialist Pet Spa Technician'),
(3, 11, 'Junior Hydrobath Technician');

-- Inventory Managers
INSERT INTO `inventory_managers` (`manager_id`, `user_id`, `clearance_code`) VALUES
(1, 7, 'INV-SUPPLY-LEAD'),
(2, 8, 'INV-STOCK-02');

-- Pets
INSERT INTO `pets` (`pet_id`, `owner_id`, `pet_name`, `species`, `breed`, `date_of_birth`, `gender`, `microchip_no`, `photo_url`, `medical_notes`, `allergies`, `special_instructions`, `created_at`) VALUES
(1, 1, 'Buddy', 'Dog', 'Golden Retriever', '2021-04-12', 'Male', 'MC-981001', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', 'Past history of ear infection. Routine vaccines up to date.', 'Penicillin', 'Needs calm handling around water', '2026-09-29 08:32:01'),
(2, 1, 'Milo', 'Dog', 'Beagle', '2022-09-05', 'Male', 'MC-981002', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400', 'Active, healthy weight, microchipped in 2023.', 'None known', 'High energy, loves chew toys', '2026-09-29 08:32:01'),
(3, 2, 'Bella', 'Cat', 'Persian', '2022-02-18', 'Female', 'MC-981003', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', 'Sensitive skin coat, occasional dry flaking.', 'Dust mites', 'Use hypoallergenic oatmeal shampoo', '2026-09-29 08:32:01'),
(4, 2, 'Luna', 'Cat', 'Siamese', '2023-01-20', 'Female', 'MC-981004', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400', 'Indoor only cat, excellent appetite.', 'None', 'Vocal during clinical examination', '2026-09-29 08:32:01'),
(5, 3, 'Rocky', 'Dog', 'German Shepherd', '2020-11-30', 'Male', 'MC-981005', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', 'Agile, regular hip dysplasia checks performed.', 'Flea spray collars', 'Owner requests muzzle during nail clip', '2026-09-29 08:32:01'),
(6, 4, 'Charlie', 'Dog', 'Labrador Retriever', '2021-08-14', 'Male', 'MC-981006', 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab2?w=400', 'Friendly, prone to dietary indiscretion.', 'Beef protein', 'Loves chicken flavored treats', '2026-09-29 08:32:01'),
(7, 5, 'Coco', 'Dog', 'Poodle', '2023-05-10', 'Female', 'MC-981007', 'https://images.unsplash.com/photo-1605192554106-d549fa564a6e?w=400', 'Delicate coat, requires routine brushing and ear cleansing.', 'None', 'Sensitive to high velocity dryer sounds', '2026-09-29 08:32:01'),
(8, 6, 'Simba', 'Cat', 'British Shorthair', '2022-11-01', 'Male', 'MC-981008', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400', 'Calm demeanor, mild dental tartar.', 'None', 'Very cooperative with nail trims', '2026-09-29 08:32:01'),
(9, 7, 'Daisy', 'Dog', 'Shih Tzu', '2022-06-25', 'Female', 'MC-981009', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400', 'Eyes need regular saline wipe down.', 'None', 'Gentle handling required', '2026-09-29 08:32:01'),
(10, 8, 'Max', 'Dog', 'Rottweiler', '2020-03-19', 'Male', 'MC-981010', 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=400', 'Strong, obedient, annual cardiac check clear.', 'None', 'Requires senior vet for consultations', '2026-09-29 08:32:01'),
(11, 1, 'Ollie', 'Dog', 'French Bulldog', '2023-02-14', 'Male', 'MC-981011', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400', 'Brachycephalic breed, avoid high temperature exposure.', 'Wheat products', 'Clean facial skin folds daily', '2026-09-29 08:32:01'),
(12, 3, 'Cleo', 'Cat', 'Bengal', '2022-07-08', 'Female', 'MC-981012', 'https://images.unsplash.com/photo-1513360309081-36f20c40629a?w=400', 'Very energetic and inquisitive.', 'None', 'Loves laser pointer distraction during checks', '2026-09-29 08:32:01');

-- Suppliers
INSERT INTO `suppliers` (`supplier_id`, `supplier_name`, `contact_no`, `email`, `address`) VALUES
(1, 'BioVet Laboratories Lanka', '+94 11 234 5678', 'supply@biovet.lk', 'Colombo 03, Sri Lanka'),
(2, 'Apex Pet Healthcare Pharma', '+94 11 876 5432', 'orders@apexpet.lk', 'Industrial Zone, Ekala'),
(3, 'Global Groom Pro Supplies', '+94 11 345 8900', 'info@globalgroom.com', 'Kandy Road, Kelaniya'),
(4, 'Ceylon Veterinary Wholesale Ltd', '+94 11 901 2345', 'sales@ceylonvet.lk', 'Union Place, Colombo 02');

-- Medical Supplies
INSERT INTO `medical_supplies` (`supply_id`, `supply_name`, `category`, `batch_number`, `quantity`, `min_threshold`, `expiry_date`, `unit_price`, `supplier_id`, `created_at`) VALUES
(1, 'Rabies Vaccine (Nobivac R)', 'Vaccine', 'VAC-2026-R01', 45, 15, '2027-08-30', 2800, 1, '2026-09-29 08:32:01'),
(2, 'DHPP Canine 5-in-1 Vaccine', 'Vaccine', 'VAC-2026-D04', 6, 12, '2027-03-15', 3500, 1, '2026-09-29 08:32:01'),
(3, 'FVRCP Feline 3-in-1 Vaccine', 'Vaccine', 'VAC-2026-F02', 7, 10, '2027-05-20', 3200, 1, '2026-09-29 08:32:01'),
(4, 'Amoxicillin & Clavulanate 250mg', 'Antibiotic', 'MED-2026-A10', 140, 30, '2027-11-15', 95, 2, '2026-09-29 08:32:01'),
(5, 'Meloxicam 1.5mg/ml Oral Suspension', 'Pain Relief', 'MED-2026-M04', 4, 10, '2027-04-10', 520, 2, '2026-09-29 08:32:01'),
(6, 'Hypoallergenic Oatmeal Shampoo 500ml', 'Grooming Shampoo', 'GRM-2026-S01', 32, 10, '2028-02-28', 1950, 3, '2026-09-29 08:32:01'),
(7, 'Sterile Surgical Gauze Pack', 'Surgical Supply', 'SUR-2026-G12', 75, 20, '2028-10-31', 380, 2, '2026-09-29 08:32:01'),
(8, 'Chlorhexidine Antiseptic Skin Spray', 'Wellness', 'WEL-2026-C08', 25, 8, '2027-09-15', 1450, 4, '2026-09-29 08:32:01'),
(9, 'Surolan Otic Ear Suspension 15ml', 'Antibiotic', 'MED-2026-S02', 18, 5, '2027-06-30', 2250, 2, '2026-09-29 08:32:01'),
(10, 'Drontal Plus Canine Dewormer Tabs', 'Wellness', 'WEL-2026-D15', 85, 25, '2027-12-15', 450, 1, '2026-09-29 08:32:01'),
(11, 'Probiotic GI Support Paste 30ml', 'Wellness', 'WEL-2026-P03', 5, 12, '2027-02-28', 1800, 2, '2026-09-29 08:32:01'),
(12, 'Professional Curved Grooming Shears', 'Grooming Tool', 'TLS-2026-S07', 14, 5, '2029-12-31', 6500, 3, '2026-09-29 08:32:01');

-- Grooming Services
INSERT INTO `grooming_services` (`service_id`, `service_name`, `category`, `price`, `duration_minutes`, `description`) VALUES
(1, 'Full Luxury Bath & Coat Styling', 'Full Package', 4800, 60, 'Deep coat cleanse, conditioning, hand blow dry, full custom breed scissor cut & nail trim.'),
(2, 'Medicated Skin Therapy Bath', 'Specialty Care', 4200, 45, 'Antibacterial/antifungal medicated soak, soothing skin treatment, blow dry and hygiene trim.'),
(3, 'De-shedding & Undercoat Removal', 'Specialty Care', 3800, 50, 'High-velocity blowout, furminator deshedding treatment, reducing shedding by up to 90%.'),
(4, 'Express Hygiene & Nail Trim', 'Basic Grooming', 1800, 25, 'Ear cleaning, paw pad shaving, sanitary trim, and precision nail clipping/grinding.');

-- Appointments
INSERT INTO `appointments` (`appointment_id`, `pet_id`, `owner_id`, `service_type`, `booking_date`, `time_slot`, `assigned_staff_id`, `status`, `notes`, `created_at`, `customer_name`, `pet_name`) VALUES
(1, 1, 1, 'Veterinary Care', '2026-09-28', '09:00 AM - 09:30 AM', 2, 'Completed', 'Routine physical examination and ear redness check', '2026-09-29 08:32:01', 'Tharushi Silva', 'Buddy'),
(2, 4, 2, 'Veterinary Care', '2026-09-28', '11:00 AM - 11:30 AM', 3, 'Completed', 'Clear ocular discharge check and conjunctivitis treatment', '2026-09-29 08:32:01', 'Nadeesha Perera', 'Luna'),
(3, 5, 3, 'Veterinary Care', '2026-09-28', '02:00 PM - 02:30 PM', 2, 'Completed', 'Hind limb stiffness evaluation and hip palpation', '2026-09-29 08:32:01', 'Kamal Perera', 'Rocky'),
(4, 3, 2, 'Grooming', '2026-09-29', '09:30 AM - 10:30 AM', 9, 'In Progress', 'Persian breed full scissor styling and skin check', '2026-09-29 08:32:01', 'Nadeesha Perera', 'Bella'),
(5, 1, 1, 'Grooming', '2026-09-29', '10:30 AM - 11:30 AM', 10, 'In Progress', 'Full luxury bath and detangling spa session', '2026-09-29 08:32:01', 'Tharushi Silva', 'Buddy'),
(6, 6, 4, 'Veterinary Care', '2026-09-29', '11:00 AM - 11:30 AM', 3, 'Confirmed', 'Acute gastritis check, mild vomiting follow-up', '2026-09-29 08:32:01', 'Anura Dissanayake', 'Charlie'),
(7, 7, 5, 'Grooming', '2026-09-29', '01:30 PM - 02:30 PM', 9, 'Booked', 'Poodle puppy cut and ear hygiene clean', '2026-09-29 08:32:01', 'Dinithi Jayasuriya', 'Coco'),
(8, 2, 1, 'Vaccination', '2026-09-29', '03:00 PM - 03:30 PM', 2, 'Booked', 'Annual booster rabies and DHPP vaccination', '2026-09-29 08:32:01', 'Tharushi Silva', 'Milo'),
(9, 8, 6, 'Veterinary Care', '2026-09-30', '09:00 AM - 09:30 AM', 4, 'Confirmed', 'Dental scaling consultation and oral inspection', '2026-09-29 08:32:01', 'Malith Fernando', 'Simba'),
(10, 9, 7, 'Grooming', '2026-09-30', '10:00 AM - 11:00 AM', 10, 'Booked', 'Shih Tzu summer trim and nail grind', '2026-09-29 08:32:01', 'Sachini Wickramasinghe', 'Daisy'),
(11, 10, 8, 'Veterinary Care', '2026-09-30', '02:00 PM - 02:30 PM', 2, 'Booked', 'Senior health checkup and routine blood work', '2026-09-29 08:32:01', 'Ruwan Senanayake', 'Max'),
(12, 11, 1, 'Veterinary Care', '2026-10-02', '10:00 AM - 10:30 AM', 3, 'Booked', 'French Bulldog respiratory check and allergy test', '2026-09-29 08:32:01', 'Tharushi Silva', 'Ollie');

-- Payments
INSERT INTO `payments` (`payment_id`, `appointment_id`, `amount`, `method`, `payment_date`, `status`) VALUES
(1, 1, 3500, 'Credit Card', '2026-09-28 09:35:00', 'Paid'),
(2, 2, 3200, 'Cash', '2026-09-28 11:35:00', 'Paid'),
(3, 3, 4000, 'Debit Card', '2026-09-28 14:35:00', 'Paid'),
(4, 4, 4800, 'Credit Card', '2026-09-29 09:40:00', 'Paid'),
(5, 5, 4800, 'Cash', '2026-09-29 10:35:00', 'Paid'),
(6, 6, 3500, 'Bank Transfer', '2026-09-29 11:05:00', 'Paid');

-- Consultations
INSERT INTO `consultations` (`consultation_id`, `appointment_id`, `pet_id`, `vet_id`, `consultation_date`, `symptoms`, `vitals`, `diagnosis`, `treatment_notes`, `created_at`) VALUES
(1, 1, 1, 1, '2026-09-28 09:20:00', 'Head shaking, scratching left ear, mild dark ceruminous discharge.', 'Weight: 31.5kg, Temp: 38.4C, Heart Rate: 95 bpm', 'Otitis Externa (Left Ear Fungal/Bacterial Overgrowth)', 'Deep ear canal flush performed with sterile saline. Instilled Surolan otic drops. Advised owner to avoid water getting into ear canal.', '2026-09-29 08:32:01'),
(2, 2, 4, 2, '2026-09-28 11:20:00', 'Clear bilateral ocular discharge, frequent blinking, conjunctival redness.', 'Weight: 3.8kg, Temp: 38.6C, Heart Rate: 130 bpm', 'Mild Feline Allergic Conjunctivitis', 'Cleaned ocular discharge with sterile saline. Prescribed topical antibiotic eye drops.', '2026-09-29 08:32:01'),
(3, 3, 5, 1, '2026-09-28 14:20:00', 'Mild stiffness rising after rest in hind legs, slight reluctance to jump.', 'Weight: 37.0kg, Temp: 38.5C, Heart Rate: 88 bpm', 'Canine Hip Osteoarthritis (Mild-to-Moderate)', 'Palpated bilateral coxofemoral joints. Recommended moderate leash walks and joint mobility diet. Prescribed oral Meloxicam.', '2026-09-29 08:32:01');

-- Prescriptions
INSERT INTO `prescriptions` (`prescription_id`, `consultation_id`, `pet_id`, `vet_id`, `issued_date`, `medication_details`, `dosage`, `instructions`, `status`) VALUES
(1, 1, 1, 1, '2026-09-28 09:30:00', 'Surolan Otic Suspension & Amoxicillin 250mg', '5 drops left ear BID; 1 tablet PO BID', 'Clean ear before application. Complete full 7-day course.', 'Active'),
(2, 2, 4, 2, '2026-09-28 11:30:00', 'Tobramycin 0.3% Ophthalmic Eye Drops', '1 drop in both eyes every 8 hours', 'Apply after gently wiping eye corners for 5 consecutive days.', 'Active'),
(3, 3, 5, 1, '2026-09-28 14:30:00', 'Meloxicam 1.5mg/ml Oral Suspension', '1.2ml once daily with morning meal', 'Give with food. Discontinue if vomiting occurs.', 'Active');

-- Vaccination Records
INSERT INTO `vaccination_records` (`record_id`, `pet_id`, `vaccine_name`, `batch_number`, `date_administered`, `next_due_date`, `certificate_no`, `administered_by`, `status`, `remarks`, `created_at`) VALUES
(1, 1, 'Rabies Vaccine (Nobivac R)', 'VAC-2025-R09', '2025-09-10', '2026-09-10', 'CERT-RB-8921', 1, 'Overdue', 'Annual rabies booster is overdue. Automated alert active.', '2026-09-29 08:32:01'),
(2, 1, 'Canine DHPP 5-in-1', 'VAC-2026-D01', '2026-03-01', '2027-03-01', 'CERT-DH-9012', 1, 'Completed', 'Protected against Parvovirus, Distemper, and Hepatitis.', '2026-09-29 08:32:01'),
(3, 3, 'Feline FVRCP 3-in-1', 'VAC-2025-F08', '2025-10-15', '2026-10-15', 'CERT-FV-7714', 2, 'Upcoming', 'Due for annual feline booster next month.', '2026-09-29 08:32:01'),
(4, 5, 'Rabies Vaccine (Nobivac R)', 'VAC-2026-R01', '2026-01-20', '2027-01-20', 'CERT-RB-9443', 1, 'Completed', 'Valid until January 2027.', '2026-09-29 08:32:01'),
(5, 6, 'Canine DHPP 5-in-1', 'VAC-2026-D02', '2026-04-10', '2027-04-10', 'CERT-DH-9231', 2, 'Completed', 'Routine booster administered with no adverse reactions.', '2026-09-29 08:32:01'),
(6, 4, 'Rabies Vaccine (Nobivac R)', 'VAC-2025-R11', '2025-08-25', '2026-08-25', 'CERT-RB-8819', 1, 'Overdue', 'Booster overdue by 1 month. Notification dispatched to owner.', '2026-09-29 08:32:01'),
(7, 2, 'Canine DHPP 5-in-1', 'VAC-2026-D03', '2026-05-18', '2027-05-18', 'CERT-DH-9345', 3, 'Completed', 'Healthy response, next booster scheduled May 2027.', '2026-09-29 08:32:01');

-- Grooming Sessions
INSERT INTO `grooming_sessions` (`session_id`, `appointment_id`, `pet_id`, `groomer_id`, `service_id`, `progress_status`, `coat_condition`, `observations`, `photo_url`, `started_at`, `completed_at`) VALUES
(1, 4, 3, 1, 1, 'Bathing', 'Dense long coat, slight matting behind collar', 'Tolerating bath well; applied lavender calming shampoo rinse.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', '2026-09-29 09:35:00', NULL),
(2, 5, 1, 2, 1, 'Styling', 'Full dense double coat, washed and dried', 'Undercoat deshedding and scissor trimming underway.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400', '2026-09-29 09:15:00', NULL),
(3, 7, 7, 1, 4, 'Checked-in', 'Clean coat, mild paw pad fur growth', 'Waiting for bathing station turnaround.', 'https://images.unsplash.com/photo-1605192554106-d549fa564a6e?w=400', '2026-09-29 10:00:00', NULL),
(4, NULL, 5, 1, 3, 'Ready for Pick-up', 'Heavy seasonal shedding reduced by 90%', 'Grooming finished! Pet resting comfortably in suite 2. Owner notified via SMS.', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400', '2026-09-29 08:30:00', '2026-09-29 09:45:00'),
(5, NULL, 9, 3, 1, 'Completed', 'Silky, tangle-free, hygiene clip applied', 'Session concluded cleanly. Handed over to owner.', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400', '2026-09-28 14:00:00', '2026-09-28 15:15:00');

-- Staff Shifts
INSERT INTO `staff_shifts` (`shift_id`, `user_id`, `shift_date`, `shift_type`, `start_time`, `end_time`, `status`, `max_hours_limit`) VALUES
(1, 2, '2026-09-29', 'Morning', '08:00:00', '14:00:00', 'Completed', 8),
(2, 3, '2026-09-29', 'Evening', '14:00:00', '20:00:00', 'Scheduled', 8),
(3, 9, '2026-09-29', 'Full Day', '09:00:00', '17:00:00', 'Scheduled', 8),
(4, 10, '2026-09-29', 'Morning', '08:30:00', '15:30:00', 'Scheduled', 8),
(5, 5, '2026-09-29', 'Full Day', '08:00:00', '17:00:00', 'Scheduled', 8),
(6, 7, '2026-09-29', 'Morning', '08:30:00', '16:30:00', 'Scheduled', 8),
(7, 2, '2026-09-30', 'Morning', '08:00:00', '14:00:00', 'Scheduled', 8),
(8, 4, '2026-09-30', 'Evening', '14:00:00', '20:00:00', 'Scheduled', 8),
(9, 9, '2026-09-30', 'Morning', '09:00:00', '15:00:00', 'Scheduled', 8),
(10, 11, '2026-09-30', 'Full Day', '09:00:00', '17:00:00', 'Scheduled', 8),
(11, 6, '2026-09-30', 'Full Day', '08:00:00', '17:00:00', 'Scheduled', 8);

-- Role Permissions
INSERT INTO `role_permissions` (`permission_id`, `role_name`, `module_name`, `can_create`, `can_read`, `can_update`, `can_delete`, `is_master_role`) VALUES
(1, 'Admin', 'System Administration & BI', 1, 1, 1, 1, 1),
(2, 'Admin', 'Pet Profile & Health Record', 1, 1, 1, 1, 1),
(3, 'Admin', 'Appointment Scheduling', 1, 1, 1, 1, 1),
(4, 'Admin', 'Smart Inventory', 1, 1, 1, 1, 1),
(5, 'Admin', 'Operational Centre & Staff', 1, 1, 1, 1, 1),
(6, 'Admin', 'Pet Grooming Workflow', 1, 1, 1, 1, 1),
(7, 'Centre Manager', 'System Administration & BI', 0, 1, 0, 0, 0),
(8, 'Centre Manager', 'Pet Profile & Health Record', 0, 1, 0, 0, 0),
(9, 'Centre Manager', 'Appointment Scheduling', 1, 1, 1, 1, 0),
(10, 'Centre Manager', 'Smart Inventory', 0, 1, 0, 0, 0),
(11, 'Centre Manager', 'Operational Centre & Staff', 1, 1, 1, 1, 0),
(12, 'Centre Manager', 'Pet Grooming Workflow', 0, 1, 1, 0, 0),
(13, 'Veterinary Officer', 'System Administration & BI', 0, 0, 0, 0, 0),
(14, 'Veterinary Officer', 'Pet Profile & Health Record', 1, 1, 1, 0, 0),
(15, 'Veterinary Officer', 'Appointment Scheduling', 0, 1, 1, 0, 0),
(16, 'Veterinary Officer', 'Smart Inventory', 0, 1, 1, 0, 0),
(17, 'Veterinary Officer', 'Operational Centre & Staff', 0, 1, 0, 0, 0),
(18, 'Veterinary Officer', 'Pet Grooming Workflow', 0, 1, 0, 0, 0),
(19, 'Inventory Manager', 'System Administration & BI', 0, 0, 0, 0, 0),
(20, 'Inventory Manager', 'Pet Profile & Health Record', 0, 0, 0, 0, 0),
(21, 'Inventory Manager', 'Appointment Scheduling', 0, 1, 0, 0, 0),
(22, 'Inventory Manager', 'Smart Inventory', 1, 1, 1, 1, 0),
(23, 'Inventory Manager', 'Operational Centre & Staff', 0, 1, 0, 0, 0),
(24, 'Inventory Manager', 'Pet Grooming Workflow', 0, 0, 0, 0, 0),
(25, 'Grooming Staff', 'System Administration & BI', 0, 0, 0, 0, 0),
(26, 'Grooming Staff', 'Pet Profile & Health Record', 0, 1, 0, 0, 0),
(27, 'Grooming Staff', 'Appointment Scheduling', 0, 1, 1, 0, 0),
(28, 'Grooming Staff', 'Smart Inventory', 0, 1, 0, 0, 0),
(29, 'Grooming Staff', 'Operational Centre & Staff', 0, 0, 0, 0, 0),
(30, 'Grooming Staff', 'Pet Grooming Workflow', 1, 1, 1, 0, 0),
(31, 'Pet Owner', 'System Administration & BI', 0, 0, 0, 0, 0),
(32, 'Pet Owner', 'Pet Profile & Health Record', 1, 1, 1, 0, 0),
(33, 'Pet Owner', 'Appointment Scheduling', 1, 1, 1, 1, 0),
(34, 'Pet Owner', 'Smart Inventory', 0, 0, 0, 0, 0),
(35, 'Pet Owner', 'Operational Centre & Staff', 0, 0, 0, 0, 0),
(36, 'Pet Owner', 'Pet Grooming Workflow', 0, 1, 0, 0, 0),
(37, 'Appointments Manager', 'System Administration & BI', 0, 1, 0, 0, 0),
(38, 'Appointments Manager', 'Pet Profile & Health Record', 0, 1, 0, 0, 0),
(39, 'Appointments Manager', 'Appointment Scheduling', 1, 1, 1, 1, 0),
(40, 'Appointments Manager', 'Smart Inventory', 0, 1, 0, 0, 0),
(41, 'Appointments Manager', 'Operational Centre & Staff', 0, 1, 0, 0, 0),
(42, 'Appointments Manager', 'Pet Grooming Workflow', 0, 1, 0, 0, 0);

-- Audit Logs
INSERT INTO `audit_logs` (`log_id`, `user_id`, `user_name`, `action`, `module_name`, `details`, `timestamp`, `username`, `module`, `description`, `action_type`) VALUES
(1, 1, 'Sanvidu S.D.N (Admin)', 'USER_AUTHENTICATION', 'System Administration', 'Admin authenticated into PawLife Central Console successfully.', '2026-09-29 08:00:15', 'sanvidu@pawlife.lk', 'Admin', 'Admin login clearance verified.', 'LOGIN'),
(2, 1, 'Sanvidu S.D.N (Admin)', 'RBAC_SECURITY_POLICY', 'RBAC Engine', 'Enforced system-locked protection on Admin master role.', '2026-09-29 08:05:22', 'sanvidu@pawlife.lk', 'RBAC', 'Immutable master role verified.', 'SECURITY'),
(3, 3, 'Dr. Kasun Jayawardena', 'CLINICAL_CONSULTATION', 'Pet EHR Module', 'Consultation #2 logged for Luna (Cat) - Allergic Conjunctivitis', '2026-09-28 11:35:00', 'kasun@pawlife.lk', 'EHR', 'Prescription #2 issued.', 'CONSULT'),
(4, 7, 'Balasooriya B.A.H.N', 'STOCK_THRESHOLD_ALERT', 'Smart Inventory', 'Triggered low-stock notification for DHPP Canine Vaccine (Qty: 6)', '2026-09-29 08:20:00', 'balasooriya@pawlife.lk', 'Inventory', 'Auto reorder warning dispatched.', 'STOCK_ALERT'),
(5, 9, 'Warnakulasuriya G.A.D.T.S', 'GROOMING_STATUS_UPDATE', 'Grooming Workflow', 'Advanced Buddy status to Ready for Pick-up. Sent SMS notification to owner.', '2026-09-29 09:45:00', 'warnakulasuriya@pawlife.lk', 'Grooming', 'Station queue advancement completed.', 'GROOMING_UPDATE'),
(6, 5, 'Subasinghe R.A.G.I', 'SHIFT_ALLOCATION', 'Operational Centre', 'Allocated weekly shifts for 6 staff members with zero schedule conflicts.', '2026-09-29 08:30:00', 'subasinghe@pawlife.lk', 'Operations', 'Shift roster conflict scanner passed.', 'ROSTER_UPDATE');

-- Notifications
INSERT INTO `notifications` (`notification_id`, `user_id`, `message`, `date_created`, `notification_type`, `is_read`) VALUES
(1, 12, 'Reminder: Buddy is due for annual Rabies vaccination booster.', '2026-09-28 09:00:00', 'Vaccination Alert', 0),
(2, 13, 'Update: Bella is currently at Styling station in Grooming Care.', '2026-09-29 09:40:00', 'Grooming Status', 0),
(3, 6, 'Alert: Pet Charlie has confirmed veterinary appointment today at 11:00 AM.', '2026-09-29 07:30:00', 'Booking Alert', 0),
(4, 7, 'Low Stock Warning: DHPP Vaccine stock has dropped to 6 units (Threshold: 12).', '2026-09-29 08:15:00', 'Inventory Alert', 0),
(5, 14, 'Update: Rocky is resting comfortably in Suite 2. Grooming completed!', '2026-09-29 09:46:00', 'Grooming Status', 0),
(6, 2, 'Clinical Follow-up: Buddy ear examination follow-up due in 7 days.', '2026-09-29 08:00:00', 'Clinical Alert', 0);

-- Reviews
INSERT INTO `reviews` (`review_id`, `customer_name`, `pet_name`, `service_type`, `rating`, `review_text`, `created_at`) VALUES
(1, 'Tharushi Silva', 'Buddy', 'Veterinary Care', 5, 'Dr. De Silva and the clinic team handled Buddy with extraordinary gentleness. The ear flush and prescription worked wonders within 24 hours!', '2026-09-28 10:30:00'),
(2, 'Nadeesha Perera', 'Bella', 'Grooming', 5, 'The 4-station live tracking on the portal is brilliant! I knew the exact moment Bella went into the styling station. Her Persian coat looks magnificent.', '2026-09-29 10:15:00'),
(3, 'Kamal Perera', 'Rocky', 'Veterinary Care', 5, 'Thorough consultation for Rocky hip stiffness. Appreciate the transparent advice and digital prescription download feature.', '2026-09-28 16:00:00'),
(4, 'Anura Dissanayake', 'Charlie', 'Veterinary Care', 5, 'Fast check-in, zero waiting time, and clean modern facility. Highly recommended for pet parents in Colombo!', '2026-09-29 11:45:00');

SET FOREIGN_KEY_CHECKS = 1;
