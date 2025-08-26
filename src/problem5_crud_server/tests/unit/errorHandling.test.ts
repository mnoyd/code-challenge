import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { ValidationError, NotFoundError } from '../../src/utils/errors';

// Mock Express response object
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Express request object
const mockRequest = (overrides: Partial<Request> = {}) => {
  const req = {
    method: 'GET',
    url: '/test',
    path: '/test',
    ...overrides
  } as Request;
  return req;
};

// Mock next function
const mockNext = jest.fn() as NextFunction;

describe('Error Handling Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle ValidationError with 400 status', () => {
      const req = mockRequest();
      const res = mockResponse();
      const validationError = new ValidationError(['Name is required', 'Invalid email format']);

      errorHandler(validationError, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Invalid request data',
        details: ['Name is required', 'Invalid email format']
      });
    });

    it('should handle NotFoundError with 404 status', () => {
      const req = mockRequest();
      const res = mockResponse();
      const notFoundError = new NotFoundError('Resource');

      errorHandler(notFoundError, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'NotFoundError',
        message: 'Resource not found'
      });
    });

    it('should handle generic Error with 500 status', () => {
      const req = mockRequest();
      const res = mockResponse();
      const genericError = new Error('Something went wrong');

      errorHandler(genericError, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    it('should handle unknown error types with 500 status', () => {
      const req = mockRequest();
      const res = mockResponse();
      const unknownError = 'string error' as any;

      errorHandler(unknownError, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });

    it('should log error details to console', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error');

      errorHandler(error, req, res, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred on GET /test:'),
        error
      );
    });

    it('should handle errors without message property', () => {
      const req = mockRequest();
      const res = mockResponse();
      const errorWithoutMessage = { name: 'CustomError' } as any;

      errorHandler(errorWithoutMessage, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for unmatched routes', () => {
      const req = mockRequest({
        url: '/api/non-existent-endpoint',
        path: '/api/non-existent-endpoint',
        method: 'POST'
      });
      const res = mockResponse();

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
        message: 'Route POST /api/non-existent-endpoint not found'
      });
    });

    it('should log the 404 request', () => {
      const req = mockRequest({
        url: '/missing-route',
        path: '/missing-route',
        method: 'GET'
      });
      const res = mockResponse();
      const consoleSpy = jest.spyOn(console, 'log');

      notFoundHandler(req, res);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('404 - Route not found: GET /missing-route')
      );
    });

    it('should handle requests without URL', () => {
      const req = mockRequest({
        url: undefined as any,
        path: undefined as any,
        method: 'GET'
      });
      const res = mockResponse();

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
        message: 'Route GET undefined not found'
      });
    });

    it('should handle requests without method', () => {
      const req = mockRequest({
        url: '/test',
        path: '/test',
        method: undefined as any
      });
      const res = mockResponse();

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
        message: 'Route undefined /test not found'
      });
    });
  });
});