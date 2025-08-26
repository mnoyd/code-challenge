// Setup file to configure PostgreSQL testing
// This runs before the main setup.ts file

// Always use PostgreSQL for tests
process.env.NODE_ENV = 'test';

// Set test database configuration if not already set
if (!process.env.TEST_DB_NAME) {
  process.env.TEST_DB_NAME = 'chess_customizations_test';
}