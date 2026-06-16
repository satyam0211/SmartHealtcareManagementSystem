import { dbPool } from '../src/config/database';

describe('IT-DB-01: Database Integrity Check', () => {
  beforeAll(async () => {
    // Ensure database connection is active
    await dbPool.query('SELECT 1');
  });

  afterAll(async () => {
    // Close the database pool after tests complete
    await dbPool.end();
  });

  test('Should reject staff creation with an invalid role (chk_user_role)', async () => {
    let errorThrown = false;
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      // Attempt to insert an invalid role
      await client.query(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES (
          '00000000-0000-0000-0000-000000000099',
          'test_invalid_role@ship.local',
          'hash',
          'InvalidRoleName',
          'Active'
        )
      `);
      await client.query('COMMIT');
    } catch (error: any) {
      errorThrown = true;
      expect(error.message).toContain('chk_user_role');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    expect(errorThrown).toBe(true);
  });

  test('Should block duplicate doctor appointments at the same time slot (unique_doctor_time)', async () => {
    let errorThrown = false;
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert two patient stubs
      await client.query(`
        INSERT INTO patients (id, uhid, name, dob, gender, address, phone, emergency_contact, emergency_phone)
        VALUES 
        ('00000000-0000-0000-0000-000000000088', 'UHID-999-001', 'Patient A', '1990-01-01', 'Male', 'Addr', '123', 'Contact', '456'),
        ('00000000-0000-0000-0000-000000000089', 'UHID-999-002', 'Patient B', '1991-01-01', 'Female', 'Addr', '123', 'Contact', '456')
      `);

      // 2. Insert doctor staff stub
      await client.query(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES ('00000000-0000-0000-0000-000000000077', 'doc@ship.local', 'hash', 'Doctor', 'Active')
      `);
      await client.query(`
        INSERT INTO doctors (id, specialty)
        VALUES ('00000000-0000-0000-0000-000000000077', 'General Medicine')
      `);

      // 3. Create first appointment
      await client.query(`
        INSERT INTO appointments (id, patient_id, doctor_id, scheduled_date, time_slot, status)
        VALUES ('00000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000088', '00000000-0000-0000-0000-000000000077', '2026-06-25', '10:00:00', 'Booked')
      `);

      // 4. Attempt to create duplicate appointment (same doctor, same date, same time)
      await client.query(`
        INSERT INTO appointments (id, patient_id, doctor_id, scheduled_date, time_slot, status)
        VALUES ('00000000-0000-0000-0000-000000000067', '00000000-0000-0000-0000-000000000089', '00000000-0000-0000-0000-000000000077', '2026-06-25', '10:00:00', 'Booked')
      `);

      await client.query('COMMIT');
    } catch (error: any) {
      errorThrown = true;
      expect(error.message).toContain('unique_doctor_time');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    expect(errorThrown).toBe(true);
  });

  test('Should prevent negative inventory stock levels (chk_inventory_stock)', async () => {
    let errorThrown = false;
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert medicine stub
      await client.query(`
        INSERT INTO medicines (id, name, reorder_threshold)
        VALUES ('00000000-0000-0000-0000-000000000055', 'Test Integrity Medicine', 10)
      `);

      // 2. Insert pharmacist staff stub
      await client.query(`
        INSERT INTO users (id, email, password_hash, role, status)
        VALUES ('00000000-0000-0000-0000-000000000054', 'pharmacist@ship.local', 'hash', 'Pharmacist', 'Active')
      `);

      // 3. Attempt to log inventory count delta resulting in negative final stock
      await client.query(`
        INSERT INTO inventory_logs (id, medicine_id, quantity_delta, stock_after, expiry_date, reason, created_by)
        VALUES (
          '00000000-0000-0000-0000-000000000053',
          '00000000-0000-0000-0000-000000000055',
          -10,
          -5, -- Invalid: negative stock
          '2027-01-01',
          'Integrity Test',
          '00000000-0000-0000-0000-000000000054'
        )
      `);

      await client.query('COMMIT');
    } catch (error: any) {
      errorThrown = true;
      expect(error.message).toContain('chk_inventory_stock');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    expect(errorThrown).toBe(true);
  });
});
