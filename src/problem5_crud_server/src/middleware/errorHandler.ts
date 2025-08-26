import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../models';
import { ValidationError, AppError } from '../utils';

/**
 * Global error handling middleware
 * This middleware catches all errors and returns consistent error responses
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`Error occurred on ${req.method} ${req.path}:`, error);

  // Handle validation errors
  if (error instanceof ValidationError) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Validation failed',
      message: 'Invalid request data',
      details: error.errors
    };
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: error.name,
      message: error.message
    };
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle JSON parsing errors
  if (error.name === 'SyntaxError' && 'body' in error) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Handle generic errors
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  };

  res.status(500).json(errorResponse);
};

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  };
  
  res.status(404).json(errorResponse);
};