import {
  isValidBase64,
  isValidSvgSize,
  validateCreateCustomization,
  validateUpdateCustomization
} from '../../src/utils/validation';
import {
  generateValidBase64Svg,
  generateLargeBase64Svg,
  generateInvalidBase64,
  createValidCustomizationRequest,
  createInvalidCustomizationRequest
} from '../utils/testHelpers';

describe('Validation Utils', () => {
  describe('isValidBase64', () => {
    it('should return true for valid base64 strings', () => {
      const validBase64 = generateValidBase64Svg();
      expect(isValidBase64(validBase64)).toBe(true);
    });

    it('should return true for valid base64 with data URL prefix', () => {
      const base64Data = generateValidBase64Svg();
      const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
      expect(isValidBase64(dataUrl)).toBe(true);
    });

    it('should return false for invalid base64 strings', () => {
      expect(isValidBase64(generateInvalidBase64())).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isValidBase64('')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidBase64(null as any)).toBe(false);
      expect(isValidBase64(undefined as any)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidBase64(123 as any)).toBe(false);
      expect(isValidBase64({} as any)).toBe(false);
      expect(isValidBase64([] as any)).toBe(false);
    });

    it('should return false for base64 with invalid length', () => {
      expect(isValidBase64('abc')).toBe(false); // Length not multiple of 4
    });
  });

  describe('isValidSvgSize', () => {
    it('should return true for small SVG files', () => {
      const smallSvg = generateValidBase64Svg('<svg><circle r="10"/></svg>');
      expect(isValidSvgSize(smallSvg)).toBe(true);
    });

    it('should return false for large SVG files exceeding 100KB', () => {
      const largeSvg = generateLargeBase64Svg();
      expect(isValidSvgSize(largeSvg)).toBe(false);
    });

    it('should return true for SVG with data URL prefix', () => {
      const base64Data = generateValidBase64Svg();
      const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
      expect(isValidSvgSize(dataUrl)).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isValidSvgSize('')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidSvgSize(null as any)).toBe(false);
      expect(isValidSvgSize(undefined as any)).toBe(false);
    });
  });

  describe('validateCreateCustomization', () => {
    it('should validate a correct customization request', () => {
      const validRequest = createValidCustomizationRequest();
      const result = validateCreateCustomization(validRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require name field', () => {
      const invalidRequest = { ...createValidCustomizationRequest() };
      delete (invalidRequest as any).name;
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required and must be a non-empty string');
    });

    it('should reject empty name', () => {
      const invalidRequest = { ...createValidCustomizationRequest(), name: '' };
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required and must be a non-empty string');
    });

    it('should require pieces array', () => {
      const invalidRequest = { ...createValidCustomizationRequest() };
      delete (invalidRequest as any).pieces;
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pieces must be an array');
    });

    it('should reject empty pieces array', () => {
      const invalidRequest = { ...createValidCustomizationRequest(), pieces: [] };
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one chess piece is required');
    });

    it('should validate piece types', () => {
      const invalidRequest = {
        ...createValidCustomizationRequest(),
        pieces: [{
          type: 'invalid-piece' as any,
          color: 'white',
          svgData: generateValidBase64Svg()
        }]
      };
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('type must be one of'))).toBe(true);
    });

    it('should validate piece colors', () => {
      const invalidRequest = {
        ...createValidCustomizationRequest(),
        pieces: [{
          type: 'pawn',
          color: 'red' as any,
          svgData: generateValidBase64Svg()
        }]
      };
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('color must be one of'))).toBe(true);
    });

    it('should validate piece SVG data', () => {
      const invalidRequest = {
        ...createValidCustomizationRequest(),
        pieces: [{
          type: 'pawn',
          color: 'white',
          svgData: generateInvalidBase64()
        }]
      };
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('svgData must be valid base64 format'))).toBe(true);
    });

    it('should validate board SVG if provided', () => {
      const invalidRequest = {
        ...createValidCustomizationRequest(),
        boardSvg: generateInvalidBase64()
      };
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Board SVG must be valid base64 format');
    });

    it('should reject large SVG files', () => {
      const invalidRequest = {
        ...createValidCustomizationRequest(),
        boardSvg: generateLargeBase64Svg()
      };
      
      const result = validateCreateCustomization(invalidRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Board SVG exceeds maximum size limit of 100KB');
    });

    it('should handle null or undefined request body', () => {
      const result1 = validateCreateCustomization(null);
      const result2 = validateCreateCustomization(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Request body is required');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Request body is required');
    });
  });

  describe('validateUpdateCustomization', () => {
    it('should validate a correct update request', () => {
      const validUpdate = {
        name: 'Updated Chess Set',
        description: 'Updated description'
      };
      
      const result = validateUpdateCustomization(validUpdate);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require at least one field for update', () => {
      const emptyUpdate = {};
      
      const result = validateUpdateCustomization(emptyUpdate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one field (name, description, boardSvg, or pieces) must be provided for update');
    });

    it('should validate name if provided', () => {
      const invalidUpdate = { name: '' };
      
      const result = validateUpdateCustomization(invalidUpdate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be a non-empty string if provided');
    });

    it('should validate pieces if provided', () => {
      const invalidUpdate = { pieces: [] };
      
      const result = validateUpdateCustomization(invalidUpdate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one chess piece is required if pieces array is provided');
    });

    it('should validate board SVG if provided', () => {
      const invalidUpdate = { boardSvg: generateInvalidBase64() };
      
      const result = validateUpdateCustomization(invalidUpdate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Board SVG must be valid base64 format');
    });

    it('should handle null or undefined request body', () => {
      const result1 = validateUpdateCustomization(null);
      const result2 = validateUpdateCustomization(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Request body is required');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Request body is required');
    });
  });
});