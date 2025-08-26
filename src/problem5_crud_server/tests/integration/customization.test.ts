import request from 'supertest';
import { Application } from 'express';
import {
  createTestApp,
  ApiTestHelper,
  clearTestData,
  createValidCustomizationRequest,
  createMinimalCustomizationRequest,
  createInvalidCustomizationRequest,
  createTestCustomization,
  generateValidBase64Svg,
  generateInvalidBase64,
  generateLargeBase64Svg
} from '../utils/testHelpers';
import { getTestDatabaseManager } from '../utils/testDatabase';

describe('Chess Customization API Integration Tests', () => {
  let app: Application;
  let apiHelper: ApiTestHelper;

  beforeAll(async () => {
    // Always use PostgreSQL for tests
    const testDbManager = getTestDatabaseManager();
    const isAvailable = await testDbManager.isAvailable();
    if (!isAvailable) {
      throw new Error('PostgreSQL test database is not available. Cannot run tests.');
    }
  });

  beforeEach(async () => {
    app = createTestApp();
    apiHelper = new ApiTestHelper(app);
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('POST /api/customizations', () => {
    it('should create a new customization with valid data', async () => {
      const validRequest = createValidCustomizationRequest();
      
      const { response, body } = await apiHelper.post('/api/customizations', validRequest);
      
      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: expect.any(String),
        name: validRequest.name,
        description: validRequest.description,
        boardSvg: validRequest.boardSvg,
        pieces: validRequest.pieces,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      expect(body.message).toBe('Customization created successfully');
    });

    it('should create a customization with minimal required data', async () => {
      const minimalRequest = createMinimalCustomizationRequest();
      
      const { response, body } = await apiHelper.post('/api/customizations', minimalRequest);
      
      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(minimalRequest.name);
      expect(body.data.pieces).toHaveLength(1);
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = createInvalidCustomizationRequest();
      
      const { response, body } = await apiHelper.post('/api/customizations', invalidRequest);
      
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid base64 SVG data', async () => {
      const invalidRequest = {
        ...createValidCustomizationRequest(),
        boardSvg: generateInvalidBase64()
      };
      
      const { response, body } = await apiHelper.post('/api/customizations', invalidRequest);
      
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.details).toContain('Board SVG must be valid base64 format');
    });

    it('should return 400 for SVG data exceeding size limit', async () => {
      const invalidRequest = {
        ...createValidCustomizationRequest(),
        boardSvg: generateLargeBase64Svg()
      };
      
      const { response, body } = await apiHelper.post('/api/customizations', invalidRequest);
      
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.details).toContain('Board SVG exceeds maximum size limit of 100KB');
    });

    it('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/customizations')
        .send({})
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/customizations', () => {
    it('should return empty array when no customizations exist', async () => {
      const { response, body } = await apiHelper.get('/api/customizations');
      
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
      expect(body.message).toBe('Retrieved 0 customizations');
    });

    it('should return all customizations', async () => {
      // Create test data
      const customization1 = await createTestCustomization({ name: 'Chess Set 1' });
      const customization2 = await createTestCustomization({ name: 'Chess Set 2' });
      
      const { response, body } = await apiHelper.get('/api/customizations');
      
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      // Results are ordered by creation time (newest first), so customization2 comes first
      expect(body.data.map((c: any) => c.id)).toContain(customization1.id);
      expect(body.data.map((c: any) => c.id)).toContain(customization2.id);
      expect(body.message).toBe('Retrieved 2 customizations');
    });
  });

  describe('GET /api/customizations/:id', () => {
    it('should return a specific customization by ID', async () => {
      const testCustomization = await createTestCustomization();
      
      const { response, body } = await apiHelper.get(`/api/customizations/${testCustomization.id}`);
      
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: testCustomization.id,
        name: testCustomization.name,
        description: testCustomization.description,
        pieces: testCustomization.pieces
      });
      expect(body.message).toBe('Customization retrieved successfully');
    });

    it('should return 404 for non-existent customization', async () => {
      const { response, body } = await apiHelper.get('/api/customizations/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Not found');
      expect(body.message).toBe('Customization with ID non-existent-id not found');
    });
  });

  describe('PUT /api/customizations/:id', () => {
    it('should update an existing customization', async () => {
      const testCustomization = await createTestCustomization();
      const updateData = {
        name: 'Updated Chess Set',
        description: 'Updated description',
        pieces: [{
          type: 'queen' as const,
          color: 'white' as const,
          svgData: generateValidBase64Svg('<svg><rect width="20" height="20"/></svg>')
        }]
      };
      
      const { response, body } = await apiHelper.put(`/api/customizations/${testCustomization.id}`, updateData);
      
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(updateData.name);
      expect(body.data.description).toBe(updateData.description);
      expect(body.data.pieces).toHaveLength(1);
      expect(body.data.pieces[0].type).toBe('queen');
      expect(body.message).toBe('Customization updated successfully');
    });

    it('should return 404 for non-existent customization', async () => {
      const updateData = { name: 'Updated Name' };
      
      const { response, body } = await apiHelper.put('/api/customizations/non-existent-id', updateData);
      
      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Not found');
    });

    it('should return 400 for invalid update data', async () => {
      const testCustomization = await createTestCustomization();
      const invalidUpdateData = { name: '' }; // Empty name
      
      const { response, body } = await apiHelper.put(`/api/customizations/${testCustomization.id}`, invalidUpdateData);
      
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
    });

    it('should return 400 for empty update data', async () => {
      const testCustomization = await createTestCustomization();
      
      const { response, body } = await apiHelper.put(`/api/customizations/${testCustomization.id}`, {});
      
      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.details).toContain('At least one field (name, description, boardSvg, or pieces) must be provided for update');
    });
  });

  describe('DELETE /api/customizations/:id', () => {
    it('should delete an existing customization', async () => {
      const testCustomization = await createTestCustomization();
      
      const { response } = await apiHelper.delete(`/api/customizations/${testCustomization.id}`);
      
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      
      // Verify the customization is actually deleted
      const { response: getResponse } = await apiHelper.get(`/api/customizations/${testCustomization.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent customization', async () => {
      const { response, body } = await apiHelper.delete('/api/customizations/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Not found');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const { response, body } = await apiHelper.get('/health');
      
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Server is healthy');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not found');
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/customizations')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(response.status).toBe(400);
    });

    it('should handle requests with invalid content type', async () => {
      const response = await request(app)
        .post('/api/customizations')
        .set('Content-Type', 'text/plain')
        .send('plain text data');
      
      expect(response.status).toBe(400);
    });
  });
});