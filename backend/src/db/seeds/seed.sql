-- Seeds: seed.sql
-- Description: Inserts standard lookup values, configurations, and bootstrap admin.

-- 1. Populate Default Departments
INSERT INTO departments (id, name) VALUES
('d0000000-0000-0000-0000-000000000001', 'Cardiology'),
('d0000000-0000-0000-0000-000000000002', 'Pediatrics'),
('d0000000-0000-0000-0000-000000000003', 'General Medicine'),
('d0000000-0000-0000-0000-000000000004', 'Radiology'),
('d0000000-0000-0000-0000-000000000005', 'Pathology'),
('d0000000-0000-0000-0000-000000000006', 'Pharmacy')
ON CONFLICT (name) DO NOTHING;

-- 2. Populate Standard Medicines Formulary
INSERT INTO medicines (id, name, reorder_threshold) VALUES
('m0000000-0000-0000-0000-000000000001', 'Paracetamol 500mg', 150),
('m0000000-0000-0000-0000-000000000002', 'Ibuprofen 400mg', 100),
('m0000000-0000-0000-0000-000000000003', 'Amoxicillin 500mg', 200),
('m0000000-0000-0000-0000-000000000004', 'Metformin 850mg', 120),
('m0000000-0000-0000-0000-000000000005', 'Atorvastatin 20mg', 80),
('m0000000-0000-0000-0000-000000000006', 'Amlodipine 5mg', 90)
ON CONFLICT (name) DO NOTHING;

-- 3. Populate Bootstrap Super Admin User
-- Email: superadmin@ship.local
-- Password: temporary_pass (hashed using bcrypt work factor 10)
-- Password hash: $2b$10$K9R.RjB.B/P6K9S.S8O8OeZ5/K7XyY3W2P4K5P6v8z2zQ7O8v9Q2u
INSERT INTO users (id, email, password_hash, role, department_id, status) VALUES
('u0000000-0000-0000-0000-000000000001', 'superadmin@ship.local', '$2b$10$K9R.RjB.B/P6K9S.S8O8OeZ5/K7XyY3W2P4K5P6v8z2zQ7O8v9Q2u', 'Super Admin', NULL, 'Active')
ON CONFLICT (email) DO NOTHING;

-- 4. Populate Global Configurations (PlatformConfigurations)
INSERT INTO platform_configurations (id, config_key, config_value, updated_by) VALUES
('c0000000-0000-0000-0000-000000000001', 'default_clinic_hours', '09:00-17:00', 'u0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000002', 'default_slot_interval_minutes', '15', 'u0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000003', 'wait_time_per_patient_minutes', '15', 'u0000000-0000-0000-0000-000000000001'),
('c0000000-0000-0000-0000-000000000004', 'sms_provider_endpoint', 'https://api.sms-gateway.local/send', 'u0000000-0000-0000-0000-000000000001')
ON CONFLICT (config_key) DO NOTHING;
