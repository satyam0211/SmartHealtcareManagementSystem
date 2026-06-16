import fs from 'fs';
import path from 'path';
import { dbPool } from '../config/database';

export async function runMigrations(): Promise<void> {
  const rollbackPath = path.join(__dirname, 'migrations', '20260615000000_create_tables.down.sql');
  const migrationPath = path.join(__dirname, 'migrations', '20260615000000_create_tables.sql');
  
  const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  
  const client = await dbPool.connect();
  try {
    console.log('Rolling back old tables (if any)...');
    await client.query(rollbackSql);
    
    console.log('Running DDL migrations...');
    await client.query(migrationSql);
    console.log('DDL Migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration process failed:', err);
      process.exit(1);
    });
}
