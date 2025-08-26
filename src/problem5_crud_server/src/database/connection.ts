import { Pool } from 'pg';

/**
 * Database connection configuration
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Connection retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Get database configuration from environment variables
 */
function getDatabaseConfig(): DatabaseConfig {
  // Use test database in test environment
  const defaultDatabase = process.env.NODE_ENV === 'test' 
    ? 'chess_customizations_test' 
    : 'chess_customizations';
    
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || defaultDatabase,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };
}

/**
 * Get retry configuration from environment variables
 */
function getRetryConfig(): RetryConfig {
  return {
    maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.DB_RETRY_DELAY_MS || '1000'),
    backoffMultiplier: parseFloat(process.env.DB_BACKOFF_MULTIPLIER || '2')
  };
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test database connection with retry logic
 */
async function testConnection(pool: Pool, retryConfig: RetryConfig): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      console.log(`Testing database connection (attempt ${attempt}/${retryConfig.maxRetries})...`);
      
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      console.log('Database connection successful');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown connection error');
      console.warn(`Database connection attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < retryConfig.maxRetries) {
        const delay = retryConfig.retryDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw new Error(`Failed to connect to database after ${retryConfig.maxRetries} attempts. Last error: ${lastError?.message}`);
}

/**
 * Create and configure a PostgreSQL connection pool
 */
export function createDatabasePool(): Pool {
  const config = getDatabaseConfig();
  
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

/**
 * Initialize database connection with retry logic
 */
export async function initializeDatabaseConnection(): Promise<Pool> {
  const pool = createDatabasePool();
  const retryConfig = getRetryConfig();
  
  try {
    await testConnection(pool, retryConfig);
    return pool;
  } catch (error) {
    // Close the pool if connection failed
    await pool.end();
    throw error;
  }
}

// Create a singleton pool instance
export const databasePool = createDatabasePool();