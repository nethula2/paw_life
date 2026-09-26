-- ==============================================================================
-- PawLife: Remove All Pets and Pet Owners Script (MySQL)
-- Run this script in MySQL Workbench to cleanly purge all pets & pet owners.
-- ==============================================================================

USE `paw_life`;

-- Disable safe update mode and foreign key checks in MySQL Workbench
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Purge dependent child records
DELETE FROM `payments`;
DELETE FROM `prescriptions`;
DELETE FROM `consultations`;
DELETE FROM `vaccination_records`;
DELETE FROM `grooming_sessions`;
DELETE FROM `appointments`;

-- 2. Purge pets and pet owners
DELETE FROM `pets`;
DELETE FROM `pet_owners`;

-- 3. Purge pet owner user accounts (keeping staff accounts safe)
DELETE FROM `users` WHERE `role` = 'Pet Owner';

-- Re-enable foreign key checks and safe updates
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- Verification Queries (Displays count of records)
SELECT 'pets' AS table_name, COUNT(*) AS remaining_count FROM `pets`
UNION ALL
SELECT 'pet_owners', COUNT(*) FROM `pet_owners`
UNION ALL
SELECT 'appointments', COUNT(*) FROM `appointments`
UNION ALL
SELECT 'staff_users', COUNT(*) FROM `users`;
