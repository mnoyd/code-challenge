import { Application } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { ChessCustomization, CreateChessCustomizationRequest } from '../../src/models';
import { getTestDatabaseManager } from './testDatabase';
import { PostgreSQLChessCustomizationStorage } from '../../src/storage/PostgreSQLChessCustomizationStorage';

/**
 * Create a test Express application instance
 */
export function createTestApp(): Application {
  return createApp();
}

/**
 * Generate a valid base64 SVG string for testing
 */
export function generateValidBase64Svg(content: string = '<svg></svg>'): string {
  return Buffer.from(content).toString('base64');
}

/**
 * Generate a large base64 SVG string that exceeds size limits
 */
export function generateLargeBase64Svg(): string {
  // Create a string larger than 100KB
  const largeContent = '<svg>' + 'x'.repeat(150 * 1024) + '</svg>';
  return Buffer.from(largeContent).toString('base64');
}

/**
 * Generate invalid base64 string
 */
export function generateInvalidBase64(): string {
  return 'invalid-base64-string!@#$%';
}

/**
 * Create a valid chess customization request object
 */
export function createValidCustomizationRequest(): CreateChessCustomizationRequest {
  return {
    name: 'Test Chess Set',
    description: 'A test chess customization',
    boardSvg: generateValidBase64Svg('<svg><rect width="100" height="100"/></svg>'),
    pieces: [
      {
        type: 'pawn',
        color: 'white',
        svgData: generateValidBase64Svg('<svg><circle r="10"/></svg>')
      },
      {
        type: 'king',
        color: 'black',
        svgData: generateValidBase64Svg('<svg><polygon points="0,0 10,10 20,0"/></svg>')
      }
    ]
  };
}

/**
 * Create a minimal valid chess customization request
 */
export function createMinimalCustomizationRequest(): CreateChessCustomizationRequest {
  return {
    name: 'Minimal Chess Set',
    pieces: [
      {
        type: 'pawn',
        color: 'white',
        svgData: generateValidBase64Svg('<svg><circle r="5"/></svg>')
      }
    ]
  };
}

/**
 * Create an invalid chess customization request (missing required fields)
 */
export function createInvalidCustomizationRequest(): any {
  return {
    // Missing name
    description: 'Invalid request',
    pieces: [] // Empty pieces array
  };
}

/**
 * Helper to make API requests and return parsed JSON response
 */
export class ApiTestHelper {
  constructor(private app: Application) {}

  async post(url: string, data: any) {
    const response = await request(this.app)
      .post(url)
      .send(data)
      .expect('Content-Type', /json/);
    return { response, body: response.body };
  }

  async get(url: string) {
    const response = await request(this.app)
      .get(url)
      .expect('Content-Type', /json/);
    return { response, body: response.body };
  }

  async put(url: string, data: any) {
    const response = await request(this.app)
      .put(url)
      .send(data)
      .expect('Content-Type', /json/);
    return { response, body: response.body };
  }

  async delete(url: string) {
    const response = await request(this.app)
      .delete(url);
    return { response, body: response.body };
  }
}

/**
 * Clear all data from storage (useful for test cleanup)
 */
export async function clearTestData(): Promise<void> {
  // Always use PostgreSQL for tests
  const testDbManager = getTestDatabaseManager();
  await testDbManager.clearAllData();
}

/**
 * Create a test customization directly in storage
 */
export async function createTestCustomization(data?: Partial<CreateChessCustomizationRequest>): Promise<ChessCustomization> {
  const customizationData = {
    ...createValidCustomizationRequest(),
    ...data
  };
  
  // Always use PostgreSQL for tests
  const testDbManager = getTestDatabaseManager();
  const storage = new PostgreSQLChessCustomizationStorage(testDbManager.getPool());
  return await storage.create(customizationData);
}