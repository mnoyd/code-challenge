import { Pool } from 'pg';
import { DatabaseInitializer } from '../../src/database/init';

/**
 * Test database configuration
 */
interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Get test database configuration
 * Uses environment variables with test-specific defaults
 */
function getTestDatabaseConfig(): TestDatabaseConfig {
  return {
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'chess_customizations_test',
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'password'
  };
}

/**
 * Create a test database pool
 */
export function createTestDatabasePool(): Pool {
  const config = getTestDatabaseConfig();
  
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 5, // Smaller pool for tests
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  });
}

/**
 * Test database manager for handling test database lifecycle
 */
export class TestDatabaseManager {
  private pool: Pool;
  private initializer: DatabaseInitializer;

  constructor() {
    this.pool = createTestDatabasePool();
    this.initializer = new DatabaseInitializer(this.pool);
  }

  /**
   * Initialize the test database
   * Creates the database and tables if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      // First, ensure the test database exists
      await this.ensureTestDatabaseExists();
      
      // Then initialize the tables
      await this.initializer.initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      throw error;
    }
  }

  /**
   * Ensure the test database exists
   * Creates it if it doesn't exist
   */
  private async ensureTestDatabaseExists(): Promise<void> {
    const config = getTestDatabaseConfig();
    
    // Create a connection to the default postgres database to create our test database
    const adminPool = new Pool({
      host: config.host,
      port: config.port,
      database: 'postgres', // Connect to default postgres database
      user: config.user,
      password: config.password,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
    });

    try {
      // Check if test database exists
      const result = await adminPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [config.database]
      );

      if (result.rows.length === 0) {
        // Database doesn't exist, create it
        try {
          await adminPool.query(`CREATE DATABASE "${config.database}"`);
          console.log(`Created test database: ${config.database}`);
        } catch (error: any) {
          // Ignore error if database already exists (race condition)
          if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            throw error;
          }
        }
      }
    } finally {
      await adminPool.end();
    }
  }

  /**
   * Clean all data from test database
   * Truncates all tables to ensure test isolation
   */
  async cleanup(): Promise<void> {
    try {
      // Truncate tables in correct order (chess_pieces first due to foreign key)
      await this.pool.query('TRUNCATE TABLE chess_pieces, customizations RESTART IDENTITY CASCADE');
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
      throw error;
    }
  }

  /**
   * Clear all data from test database (alias for cleanup)
   */
  async clearAllData(): Promise<void> {
    await this.cleanup();
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Failed to close test database pool:', error);
      throw error;
    }
  }

  /**
   * Get the database pool for use in tests
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Check if database is available
   * Returns true if PostgreSQL server is available (not necessarily the test database)
   */
  async isAvailable(): Promise<boolean> {
    const config = getTestDatabaseConfig();
    
    // Check if PostgreSQL server is available by connecting to the default postgres database
    const adminPool = new Pool({
      host: config.host,
      port: config.port,
      database: 'postgres',
      user: config.user,
      password: config.password,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
    });

    try {
      const client = await adminPool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      return false;
    } finally {
      await adminPool.end();
    }
  }
}

// Global test database manager instance
let testDatabaseManager: TestDatabaseManager | null = null;
let isInitialized = false;

/**
 * Get or create the global test database manager
 */
export function getTestDatabaseManager(): TestDatabaseManager {
  if (!testDatabaseManager) {
    testDatabaseManager = new TestDatabaseManager();
  }
  return testDatabaseManager;
}

/**
 * Setup test database for the entire test suite
 * Should be called in global setup
 */
export async function setupTestDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  const manager = getTestDatabaseManager();
  
  // Check if PostgreSQL server is available
  const isAvailable = await manager.isAvailable();
  if (!isAvailable) {
    throw new Error('PostgreSQL server is not available. Please start the database with: npm run db:up');
  }
  
  await manager.initialize();
  isInitialized = true;
}

/**
 * Teardown test database for the entire test suite
 * Should be called in global teardown
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testDatabaseManager) {
    await testDatabaseManager.close();
    testDatabaseManager = null;
    isInitialized = false;
  }
}