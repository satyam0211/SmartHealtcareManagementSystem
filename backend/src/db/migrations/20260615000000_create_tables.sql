-- Migration: 20260615000000_create_tables.sql
-- Description: Creates the full relational database schema for SHIP v1.0.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_departments_modtime
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- 2. Users (Staff Accounts)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('Doctor', 'Nurse', 'Receptionist', 'Lab Staff', 'Pharmacist', 'Billing Officer', 'Administrator', 'Super Admin')),
    CONSTRAINT chk_user_status CHECK (status IN ('Active', 'Disabled'))
);

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Doctors
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    roster_info JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_doctors_modtime
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uhid VARCHAR(20) NOT NULL UNIQUE,
    -- FLE fields stored as TEXT because base64 ciphertext size varies
    name TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    blood_group TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact TEXT NOT NULL,
    emergency_phone TEXT NOT NULL,
    emergency_notes TEXT,
    consent_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_patient_gender CHECK (gender IN ('Male', 'Female', 'Other'))
);

CREATE TRIGGER update_patients_modtime
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);

-- 5. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    scheduled_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Booked',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_doctor_time UNIQUE (doctor_id, scheduled_date, time_slot),
    CONSTRAINT chk_appt_status CHECK (status IN ('Booked', 'Checked-In', 'Cancelled'))
);

CREATE TRIGGER update_appointments_modtime
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, scheduled_date);

-- 6. QueueTokens
CREATE TABLE IF NOT EXISTS queue_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_number VARCHAR(10) NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'Waiting',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_token_status CHECK (status IN ('Waiting', 'In-Consultation', 'Completed', 'Cancelled'))
);

CREATE TRIGGER update_queue_tokens_modtime
    BEFORE UPDATE ON queue_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_queue_doctor_status ON queue_tokens(doctor_id, status);

-- 7. Vitals (FLE encrypted fields stored as TEXT)
CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    queue_token_id UUID NOT NULL UNIQUE REFERENCES queue_tokens(id) ON DELETE RESTRICT,
    blood_pressure TEXT NOT NULL,
    heart_rate TEXT NOT NULL,
    temperature TEXT NOT NULL,
    weight TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_vitals_modtime
    BEFORE UPDATE ON vitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Consultations
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    queue_token_id UUID NOT NULL UNIQUE REFERENCES queue_tokens(id) ON DELETE RESTRICT,
    notes TEXT NOT NULL, -- FLE
    diagnosis TEXT NOT NULL, -- FLE
    recovery_status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_consult_recovery CHECK (recovery_status IN ('Active', 'Recovered', 'Referred'))
);

CREATE TRIGGER update_consultations_modtime
    BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_consults_patient ON consultations(patient_id);

-- 9. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_presc_status CHECK (status IN ('Pending', 'Dispensed'))
);

CREATE TRIGGER update_prescriptions_modtime
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Medicines
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    reorder_threshold INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_med_reorder CHECK (reorder_threshold >= 0)
);

CREATE TRIGGER update_medicines_modtime
    BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);

-- 11. PrescriptionItems
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    dosage TEXT NOT NULL, -- FLE
    duration TEXT NOT NULL, -- FLE
    instructions TEXT, -- FLE
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_presc_medicine UNIQUE (prescription_id, medicine_id)
);

CREATE TRIGGER update_prescription_items_modtime
    BEFORE UPDATE ON prescription_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. InventoryLogs
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity_delta INT NOT NULL,
    stock_after INT NOT NULL,
    expiry_date DATE NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_inventory_stock CHECK (stock_after >= 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_med_expiry ON inventory_logs(medicine_id, expiry_date);

-- 13. Rooms (F-IPD Gap Resolution)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(50) NOT NULL UNIQUE,
    ward_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_rooms_modtime
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Beds (F-IPD Gap Resolution)
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    bed_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_room_bed UNIQUE (room_id, bed_number),
    CONSTRAINT chk_bed_status CHECK (status IN ('Available', 'Occupied', 'Cleaning/Maintenance'))
);

CREATE TRIGGER update_beds_modtime
    BEFORE UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. Admissions (F-IPD Gap Resolution)
CREATE TABLE IF NOT EXISTS admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
    admission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP,
    discharge_summary TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Admitted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_admission_status CHECK (status IN ('Admitted', 'Discharged'))
);

CREATE TRIGGER update_admissions_modtime
    BEFORE UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. LabOrders
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    test_name VARCHAR(150) NOT NULL,
    status VARCHAR(25) NOT NULL DEFAULT 'Requested',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lab_status CHECK (status IN ('Requested', 'Sample Collected', 'Processing', 'Completed', 'Uploaded'))
);

CREATE TRIGGER update_lab_orders_modtime
    BEFORE UPDATE ON lab_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);

-- 17. LabReports
CREATE TABLE IF NOT EXISTS lab_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID NOT NULL UNIQUE REFERENCES lab_orders(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    pdf_url TEXT NOT NULL, -- FLE
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_lab_reports_modtime
    BEFORE UPDATE ON lab_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(25) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_invoice_amount CHECK (total_amount >= 0.00),
    CONSTRAINT chk_invoice_status CHECK (status IN ('Pending', 'Paid', 'Pending Insurance'))
);

CREATE TRIGGER update_invoices_modtime
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_invoices_patient_status ON invoices(patient_id, status);

-- 19. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_amount CHECK (amount_paid > 0.00),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('Cash', 'Card'))
);

CREATE TRIGGER update_payments_modtime
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 20. InsuranceClaims
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE RESTRICT,
    policy_number TEXT NOT NULL, -- FLE
    provider_name VARCHAR(150) NOT NULL,
    claim_amount DECIMAL(10,2) NOT NULL,
    claim_details TEXT, -- FLE
    status VARCHAR(25) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_claim_amount CHECK (claim_amount > 0.00),
    CONSTRAINT chk_claim_status CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

CREATE TRIGGER update_insurance_claims_modtime
    BEFORE UPDATE ON insurance_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 21. SymptomChats
CREATE TABLE IF NOT EXISTS symptom_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    chat_transcript TEXT NOT NULL, -- FLE
    urgency_level VARCHAR(15) NOT NULL,
    recommended_specialty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_chat_urgency CHECK (urgency_level IN ('Low', 'Medium', 'High'))
);

CREATE TRIGGER update_symptom_chats_modtime
    BEFORE UPDATE ON symptom_chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 22. ScribeSessions
CREATE TABLE IF NOT EXISTS scribe_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    audio_url TEXT NOT NULL, -- FLE
    soap_transcript TEXT, -- FLE
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_scribe_sessions_modtime
    BEFORE UPDATE ON scribe_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 23. AuditLogs (Postgres BIGSERIAL type PK)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    entity_changed VARCHAR(100) NOT NULL,
    pre_state TEXT, -- FLE
    post_state TEXT, -- FLE
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_patient_time ON audit_logs(patient_id, created_at);

-- 24. PlatformConfigurations
CREATE TABLE IF NOT EXISTS platform_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    updated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_platform_config_modtime
    BEFORE UPDATE ON platform_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
