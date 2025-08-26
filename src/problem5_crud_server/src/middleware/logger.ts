import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * Logs incoming requests with timestamp, method, path, and IP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
  
  // Log request body for POST/PUT requests (but not sensitive data)
  if ((method === 'POST' || method === 'PUT') && req.body) {
    const bodyLog = { ...req.body };
    // Remove or truncate large SVG data for cleaner logs
    if (bodyLog.boardSvg) {
      bodyLog.boardSvg = `[SVG data - ${bodyLog.boardSvg.length} chars]`;
    }
    if (bodyLog.pieces && Array.isArray(bodyLog.pieces)) {
      bodyLog.pieces = bodyLog.pieces.map((piece: any) => ({
        ...piece,
        svgData: piece.svgData ? `[SVG data - ${piece.svgData.length} chars]` : piece.svgData
      }));
    }
    console.log(`[${timestamp}] Request body:`, JSON.stringify(bodyLog, null, 2));
  }
  
  // Log response time
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusText = statusCode >= 400 ? 'ERROR' : 'SUCCESS';
    
    console.log(`[${timestamp}] ${method} ${path} - ${statusCode} ${statusText} - ${duration}ms`);
  });
  
  next();
};

/**
 * Error logging utility
 * Provides consistent error logging format
 */
export const logError = (context: string, error: Error, additionalInfo?: any): void => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR in ${context}:`);
  console.error(`  Message: ${error.message}`);
  console.error(`  Stack: ${error.stack}`);
  
  if (additionalInfo) {
    console.error(`  Additional info:`, additionalInfo);
  }
};

/**
 * Success logging utility
 * Provides consistent success logging format
 */
export const logSuccess = (context: string, message: string, data?: any): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] SUCCESS in ${context}: ${message}`);
  
  if (data) {
    console.log(`  Data:`, data);
  }
};