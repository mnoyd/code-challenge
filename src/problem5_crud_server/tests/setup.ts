// Test setup file
// This file runs before all tests

import { setupTestDatabase, teardownTestDatabase } from './utils/testDatabase';

// Increase timeout for integration tests
jest.setTimeout(15000);

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(async () => {
  // Suppress console output during tests unless explicitly needed
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  
  // Always setup PostgreSQL test database
  try {
    await setupTestDatabase();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error; // Fail tests if database setup fails
  }
});

afterAll(async () => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Always teardown PostgreSQL test database
  await teardownTestDatabase();
  
  // Give a moment for connections to close
  await new Promise(resolve => setTimeout(resolve, 100));
});