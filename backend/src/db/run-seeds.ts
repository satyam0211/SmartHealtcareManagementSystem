import fs from 'fs';
import path from 'path';
import { dbPool } from '../config/database';

export async function runSeeds(): Promise<void> {
  const seedPath = path.join(__dirname, 'seeds', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');
  
  console.log('Running database seeds...');
  const client = await dbPool.connect();
  try {
    await client.query(sql);
    console.log('Seeds applied successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('Seeding process completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding process failed:', err);
      process.exit(1);
    });
}
