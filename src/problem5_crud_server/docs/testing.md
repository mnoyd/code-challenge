# Testing Guide

This document explains how to run tests for the Chess Customization API.

## Test Types

The project supports two types of tests:

### 1. In-Memory Tests (Default)
- Uses in-memory storage for fast, isolated tests
- No external dependencies required
- Runs by default with `npm test`

### 2. PostgreSQL Tests
- Uses real PostgreSQL database for integration testing
- Requires PostgreSQL database to be running
- Tests the actual database integration

## Running Tests

### In-Memory Tests

```bash
# Run all tests with in-memory storage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### PostgreSQL Tests

1. **Start the PostgreSQL database:**
   ```bash
   npm run db:up
   ```

2. **Run PostgreSQL tests:**
   ```bash
   npm run test:postgresql
   ```

3. **Run PostgreSQL tests with coverage:**
   ```bash
   npm run test:postgresql:coverage
   ```

4. **Run PostgreSQL tests in watch mode:**
   ```bash
   npm run test:postgresql:watch
   ```

## Test Database Configuration

PostgreSQL tests use a separate test database to avoid conflicts with development data.

### Default Configuration
- **Host:** localhost
- **Port:** 5432
- **Database:** chess_customizations_test
- **User:** postgres
- **Password:** password

### Custom Configuration

You can override the test database configuration using environment variables:

```bash
export TEST_DB_HOST=localhost
export TEST_DB_PORT=5432
export TEST_DB_NAME=my_test_db
export TEST_DB_USER=testuser
export TEST_DB_PASSWORD=testpass
```

## Test Structure

```
tests/
├── integration/           # API integration tests
│   └── customization.test.ts
├── unit/                 # Unit tests
│   ├── databaseConnection.test.ts
│   ├── errorHandling.test.ts
│   ├── postgresqlStorage.test.ts
│   └── validation.test.ts
├── utils/                # Test utilities
│   ├── testDatabase.ts   # PostgreSQL test database manager
│   ├── testHelpers.ts    # Test helper functions
│   └── postgresqlTestSetup.ts
└── setup.ts              # Global test setup
```

## Test Features

### Database Cleanup
- PostgreSQL tests automatically clean the database between tests
- In-memory tests reset storage between tests
- Ensures test isolation and repeatability

### Test Helpers
- `createValidCustomizationRequest()` - Creates valid test data
- `createTestCustomization()` - Creates test data directly in storage
- `clearTestData()` - Cleans all test data
- `ApiTestHelper` - Simplifies API testing

### Error Handling
- Tests handle database connection failures gracefully
- PostgreSQL tests are skipped if database is unavailable
- Clear error messages for setup issues

## Troubleshooting

### PostgreSQL Tests Not Running

1. **Check if PostgreSQL is running:**
   ```bash
   npm run db:logs
   ```

2. **Restart PostgreSQL:**
   ```bash
   npm run db:down
   npm run db:up
   ```

3. **Check database connection:**
   ```bash
   docker-compose ps
   ```

### Test Database Issues

1. **Reset test database:**
   ```bash
   npm run db:down
   npm run db:up
   ```

2. **Check database logs:**
   ```bash
   npm run db:logs
   ```

### Common Issues

- **Port conflicts:** Change `DB_PORT` if 5432 is in use
- **Permission issues:** Ensure Docker has proper permissions
- **Network issues:** Check Docker network configuration

## Best Practices

1. **Run both test types** before committing changes
2. **Use in-memory tests** for rapid development
3. **Use PostgreSQL tests** for integration validation
4. **Keep tests isolated** - don't depend on external state
5. **Clean up test data** after each test
6. **Use descriptive test names** that explain the behavior being tested

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run In-Memory Tests
  run: npm test

- name: Start PostgreSQL
  run: npm run db:up

- name: Run PostgreSQL Tests
  run: npm run test:postgresql

- name: Stop PostgreSQL
  run: npm run db:down
```