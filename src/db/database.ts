import { Pool } from 'pg';

// Create a new PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a query on the database
 * @param text Query text
 * @param params Query parameters
 * @returns Query result
 */
export const query = async (text: string, params: any[] = []) => {
  return pool.query(text, params);
};

/**
 * Get a client from the pool
 * @returns Client from the pool
 */
export const getClient = async () => {
  return pool.connect();
};

export default pool;