import { PostgreSQLChessCustomizationStorage } from './PostgreSQLChessCustomizationStorage';
import { databasePool } from '../database/connection';

// Create storage instance - use test database pool in test environment
function createStorageInstance(): PostgreSQLChessCustomizationStorage {
  if (process.env.NODE_ENV === 'test') {
    // In test environment, we'll set this up in the test helpers
    // For now, use the regular pool and let tests override it
    return new PostgreSQLChessCustomizationStorage(databasePool);
  }
  return new PostgreSQLChessCustomizationStorage(databasePool);
}

// Always use PostgreSQL storage
export const chessCustomizationStorage = createStorageInstance();

/**
 * Initialize storage with database connection retry logic
 * This should be called during application startup
 */
export async function initializeStorage(): Promise<void> {
  // The connection retry logic is handled in the databasePool creation
  // This function is provided for future extensibility
  console.log('Storage initialized with PostgreSQL backend');
}

// Export types and classes for testing and other uses
export * from './PostgreSQLChessCustomizationStorage';