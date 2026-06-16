import { Pool, PoolConfig } from 'pg';

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'ship_db',
  user: process.env.DB_USER || 'ship_admin',
  password: process.env.DB_PASSWORD || 'ship_secure_password',
  max: 20, // Max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Enforce TLS for database connections in production/staging environments
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  dbConfig.ssl = {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA_CERT, // Pass CA certificate details in env
  };
}

export const dbPool = new Pool(dbConfig);

// Helper function for queries
export async function dbQuery(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  try {
    const res = await dbPool.query(text, params);
    const duration = Date.now() - start;
    // Log queries in debug mode
    if (process.env.DEBUG_SQL === 'true') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
