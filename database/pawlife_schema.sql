-- =======================================================
-- PawLife: Web-Based Pet Care Management System
-- Group ID: 2026-Y2-S1-MLB-B6G2-07
-- Database Schema (SQL / MySQL / SQLite Compatible DDL)
-- Reflects EER Diagram & Functional Module Architecture
-- =======================================================

-- 1. Users Table (Base entity for all system personas)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK(role IN ('Admin', 'Centre Manager', 'Veterinary Officer', 'Grooming Staff', 'Inventory Manager', 'Pet Owner')),
    status VARCHAR(20) DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Role Specialization Tables (ISA Hierarchy from EER)
CREATE TABLE IF NOT EXISTS pet_owners (
    owner_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    nic VARCHAR(20),
    emergency_contact VARCHAR(20),
    address TEXT,
    gender VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS veterinarians (
    vet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    license_no VARCHAR(50) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grooming_staff (
    groomer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    skill_level VARCHAR(30) DEFAULT 'Senior Specialist',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_managers (
    manager_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    clearance_code VARCHAR(50) DEFAULT 'INV-LVL2',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Pets Table (De Silva L.P.B - IT25101709)
CREATE TABLE IF NOT EXISTS pets (
    pet_id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    pet_name VARCHAR(60) NOT NULL,
    species VARCHAR(30) NOT NULL,
    breed VARCHAR(60) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    microchip_no VARCHAR(50) UNIQUE,
    photo_url TEXT,
    medical_notes TEXT,
    allergies TEXT,
    special_instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE
);

-- 4. Appointments Table (Subasinghe R.A.G.I - IT25102521)
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    service_type VARCHAR(40) NOT NULL CHECK(service_type IN ('Veterinary Care', 'Grooming', 'Vaccination', 'Boarding')),
    booking_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    assigned_staff_id INTEGER,
    status VARCHAR(20) DEFAULT 'Booked' CHECK(status IN ('Booked', 'Confirmed', 'In Progress', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES pet_owners(owner_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 5. Payments Table (Financial records linked to appointments)
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(30) DEFAULT 'Cash' CHECK(method IN ('Cash', 'Credit Card', 'Debit Card', 'Bank Transfer')),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Paid' CHECK(status IN ('Paid', 'Pending', 'Refunded')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

-- 6. Medical Consultations Table (De Silva L.P.B - IT25101709)
CREATE TABLE IF NOT EXISTS consultations (
    consultation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    pet_id INTEGER NOT NULL,
    vet_id INTEGER NOT NULL,
    consultation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    symptoms TEXT NOT NULL,
    vitals VARCHAR(100),
    diagnosis TEXT NOT NULL,
    treatment_notes TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES veterinarians(vet_id) ON DELETE CASCADE
);

-- 7. Digital Prescriptions Table (De Silva L.P.B - IT25101709)
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
    consultation_id INTEGER NOT NULL,
    pet_id INTEGER NOT NULL,
    vet_id INTEGER NOT NULL,
    issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    medication_details TEXT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    instructions TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK(status IN ('Active', 'Dispensed', 'Expired')),
    FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (vet_id) REFERENCES veterinarians(vet_id) ON DELETE CASCADE
);

-- 8. Vaccination Records Table (De Silva L.P.B - IT25101709)
CREATE TABLE IF NOT EXISTS vaccination_records (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    vaccine_name VARCHAR(80) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    date_administered DATE NOT NULL,
    next_due_date DATE NOT NULL,
    certificate_no VARCHAR(50) UNIQUE,
    administered_by INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Completed' CHECK(status IN ('Completed', 'Overdue', 'Upcoming')),
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (administered_by) REFERENCES veterinarians(vet_id) ON DELETE CASCADE
);

-- 9. Suppliers Table (Balasooriya B.A.H.N - IT25103607)
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    address TEXT
);

-- 10. Medical Supply & Smart Inventory Table (Balasooriya B.A.H.N - IT25103607)
CREATE TABLE IF NOT EXISTS medical_supplies (
    supply_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supply_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK(category IN ('Vaccine', 'Antibiotic', 'Pain Relief', 'Surgical Supply', 'Grooming Shampoo', 'Grooming Tool', 'Wellness')),
    batch_number VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER NOT NULL DEFAULT 10,
    expiry_date DATE NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    supplier_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

-- 11. Grooming Services Catalog (Warnakulasuriya G.A.D.T.S - IT25103408)
CREATE TABLE IF NOT EXISTS grooming_services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name VARCHAR(80) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT
);

-- 12. Grooming Sessions Workflow (Warnakulasuriya G.A.D.T.S - IT25103408)
CREATE TABLE IF NOT EXISTS grooming_sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    pet_id INTEGER NOT NULL,
    groomer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    progress_status VARCHAR(30) DEFAULT 'Checked-in' CHECK(progress_status IN ('Checked-in', 'Bathing', 'Styling', 'Ready for Pick-up', 'Completed')),
    coat_condition VARCHAR(100),
    observations TEXT,
    photo_url TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (groomer_id) REFERENCES grooming_staff(groomer_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES grooming_services(service_id) ON DELETE CASCADE
);

-- 13. Staff Shifts & Attendance (Alahakoon A.M.B.U - IT25101534)
CREATE TABLE IF NOT EXISTS staff_shifts (
    shift_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL CHECK(shift_type IN ('Morning', 'Evening', 'Full Day', 'Night')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Absent')),
    max_hours_limit INTEGER DEFAULT 8,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 14. RBAC Permissions Matrix (Sanvidu S.D.N - IT25100618)
CREATE TABLE IF NOT EXISTS role_permissions (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name VARCHAR(30) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    can_create INTEGER NOT NULL DEFAULT 0,
    can_read INTEGER NOT NULL DEFAULT 1,
    can_update INTEGER NOT NULL DEFAULT 0,
    can_delete INTEGER NOT NULL DEFAULT 0,
    is_master_role INTEGER NOT NULL DEFAULT 0,
    UNIQUE(role_name, module_name)
);

-- 15. Security & System Audit Logs (Sanvidu S.D.N - IT25100618)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Multi-Channel Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    notification_type VARCHAR(30) NOT NULL,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for performance & quick lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(booking_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_consultations_pet ON consultations(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_due ON vaccination_records(next_due_date);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON medical_supplies(expiry_date);
CREATE INDEX IF NOT EXISTS idx_grooming_status ON grooming_sessions(progress_status);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON staff_shifts(shift_date, user_id);
