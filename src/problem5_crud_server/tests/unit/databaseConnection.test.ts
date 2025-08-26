import { createDatabasePool, initializeDatabaseConnection } from '../../src/database/connection';
import { Pool } from 'pg';

// Always mock for unit tests - we want to test the connection logic, not the actual database
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  
  const mockPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  
  return {
    Pool: jest.fn(() => mockPool),
    __mockClient: mockClient,
    __mockPool: mockPool
  };
});

describe('Database Connection', () => {
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const pg = require('pg');
    mockPool = pg.__mockPool;
    mockClient = pg.__mockClient;
    
    // Reset environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_MAX_RETRIES;
    delete process.env.DB_RETRY_DELAY_MS;
    delete process.env.DB_BACKOFF_MULTIPLIER;
  });

  describe('createDatabasePool', () => {
    it('should create a pool with default configuration', () => {
      const pool = createDatabasePool();
      
      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        database: 'chess_customizations_test',
        user: 'postgres',
        password: 'password',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });
      
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should create a pool with environment variables', () => {
      process.env.DB_HOST = 'custom-host';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'custom-db';
      process.env.DB_USER = 'custom-user';
      process.env.DB_PASSWORD = 'custom-password';
      
      createDatabasePool();
      
      expect(Pool).toHaveBeenCalledWith({
        host: 'custom-host',
        port: 5433,
        database: 'custom-db',
        user: 'custom-user',
        password: 'custom-password',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });
    });
  });

  describe('initializeDatabaseConnection', () => {
    it('should successfully initialize connection on first try', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      
      const pool = await initializeDatabaseConnection();
      
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(pool).toBe(mockPool);
    });

    it('should retry connection on failure and eventually succeed', async () => {
      // Mock console.log and console.warn to avoid test output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Set fast retry for testing
      process.env.DB_MAX_RETRIES = '2';
      process.env.DB_RETRY_DELAY_MS = '10';
      
      // First attempt fails, second succeeds
      mockPool.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      
      const pool = await initializeDatabaseConnection();
      
      expect(mockPool.connect).toHaveBeenCalledTimes(2);
      expect(pool).toBe(mockPool);
      
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should fail after max retries', async () => {
      // Mock console methods to avoid test output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Set fast retry for testing
      process.env.DB_MAX_RETRIES = '2';
      process.env.DB_RETRY_DELAY_MS = '10';
      
      // All attempts fail
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));
      mockPool.end.mockResolvedValue(undefined);
      
      await expect(initializeDatabaseConnection()).rejects.toThrow(
        'Failed to connect to database after 2 attempts'
      );
      
      expect(mockPool.connect).toHaveBeenCalledTimes(2);
      expect(mockPool.end).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });
});