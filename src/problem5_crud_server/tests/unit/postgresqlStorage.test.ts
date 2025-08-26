import { PostgreSQLChessCustomizationStorage } from '../../src/storage/PostgreSQLChessCustomizationStorage';
import { getTestDatabaseManager } from '../utils/testDatabase';
import { createValidCustomizationRequest, generateValidBase64Svg } from '../utils/testHelpers';

// Always run PostgreSQL tests
describe('PostgreSQL Chess Customization Storage', () => {
  let storage: PostgreSQLChessCustomizationStorage;
  let testDbManager: any;

  beforeAll(async () => {
    testDbManager = getTestDatabaseManager();
    
    // Check if database is available before running any tests
    const isAvailable = await testDbManager.isAvailable();
    if (!isAvailable) {
      throw new Error('PostgreSQL test database is not available. Please start the database with: npm run db:up');
    }

    storage = new PostgreSQLChessCustomizationStorage(testDbManager.getPool());
  });

  beforeEach(async () => {
    // Clean database before each test
    await testDbManager.cleanup();
  });

  describe('create', () => {
    it('should create a new customization', async () => {
      const requestData = createValidCustomizationRequest();
      const result = await storage.create(requestData);

      expect(result).toMatchObject({
        id: expect.any(String),
        name: requestData.name,
        description: requestData.description,
        boardSvg: requestData.boardSvg,
        pieces: requestData.pieces,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should create a customization with minimal data', async () => {
      const requestData = {
        name: 'Minimal Set',
        pieces: [{
          type: 'pawn' as const,
          color: 'white' as const,
          svgData: generateValidBase64Svg('<svg><circle r="5"/></svg>')
        }]
      };

      const result = await storage.create(requestData);

      expect(result.name).toBe(requestData.name);
      expect(result.description).toBeNull();
      expect(result.boardSvg).toBeNull();
      expect(result.pieces).toHaveLength(1);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no customizations exist', async () => {
      const result = await storage.getAll();
      expect(result).toEqual([]);
    });

    it('should return all customizations', async () => {
      const customization1 = await storage.create({
        ...createValidCustomizationRequest(),
        name: 'Set 1'
      });
      const customization2 = await storage.create({
        ...createValidCustomizationRequest(),
        name: 'Set 2'
      });

      const result = await storage.getAll();

      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toContain('Set 1');
      expect(result.map(c => c.name)).toContain('Set 2');
    });
  });

  describe('getById', () => {
    it('should return customization by ID', async () => {
      const created = await storage.create(createValidCustomizationRequest());
      const result = await storage.getById(created.id);

      expect(result).toMatchObject({
        id: created.id,
        name: created.name,
        description: created.description,
        pieces: created.pieces
      });
    });

    it('should return undefined for non-existent ID', async () => {
      const result = await storage.getById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update an existing customization', async () => {
      const created = await storage.create(createValidCustomizationRequest());
      const updateData = {
        name: 'Updated Name',
        description: 'Updated Description'
      };

      const result = await storage.update(created.id, updateData);

      expect(result).toMatchObject({
        id: created.id,
        name: updateData.name,
        description: updateData.description
      });
    });

    it('should return undefined for non-existent ID', async () => {
      const result = await storage.update('non-existent-id', { name: 'Updated' });
      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete an existing customization', async () => {
      const created = await storage.create(createValidCustomizationRequest());
      const result = await storage.delete(created.id);

      expect(result).toBe(true);

      // Verify it's deleted
      const getResult = await storage.getById(created.id);
      expect(getResult).toBeUndefined();
    });

    it('should return false for non-existent ID', async () => {
      const result = await storage.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing customization', async () => {
      const created = await storage.create(createValidCustomizationRequest());
      const result = await storage.exists(created.id);

      expect(result).toBe(true);
    });

    it('should return false for non-existent customization', async () => {
      const result = await storage.exists('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return 0 when no customizations exist', async () => {
      const result = await storage.count();
      expect(result).toBe(0);
    });

    it('should return correct count', async () => {
      await storage.create(createValidCustomizationRequest());
      await storage.create(createValidCustomizationRequest());

      const result = await storage.count();
      expect(result).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all customizations', async () => {
      await storage.create(createValidCustomizationRequest());
      await storage.create(createValidCustomizationRequest());

      await storage.clear();

      const count = await storage.count();
      expect(count).toBe(0);
    });
  });
});