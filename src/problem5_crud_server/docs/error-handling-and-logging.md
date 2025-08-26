# Error Handling and Logging

This document describes the error handling and logging implementation for the Chess Customization API.

## Error Handling

### Error Middleware

The API uses centralized error handling through middleware:

- **`errorHandler`**: Global error handling middleware that catches all errors and returns consistent error responses
- **`notFoundHandler`**: Handles 404 errors for unmatched routes

### Error Types

The API handles several types of errors:

1. **Validation Errors** (400): Invalid request data, missing required fields, invalid base64 format
2. **Not Found Errors** (404): Resource not found, invalid IDs
3. **JSON Parsing Errors** (400): Invalid JSON in request body
4. **Internal Server Errors** (500): Unexpected server errors

### Error Response Format

All errors return a consistent JSON format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": ["Additional error details (for validation errors)"]
}
```

### Custom Error Classes

- **`AppError`**: Base class for application errors with status codes
- **`ValidationError`**: Specific error for validation failures
- **`NotFoundError`**: Specific error for resource not found
- **`BadRequestError`**: Specific error for bad requests

## Logging

### Request Logging

The `requestLogger` middleware logs:

- Timestamp
- HTTP method and path
- Client IP address
- Request body (with SVG data truncated for readability)
- Response status code and duration

### Error Logging

The `logError` utility provides structured error logging:

- Timestamp
- Context (which function/operation)
- Error message and stack trace
- Additional contextual information

### Success Logging

The `logSuccess` utility logs successful operations:

- Timestamp
- Context
- Success message
- Relevant data (IDs, names, etc.)

## Usage Examples

### In Controllers

```typescript
import { logError, logSuccess } from '../middleware';
import { ValidationError } from '../utils';

export const createCustomization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validation
    const validation = validateCreateCustomization(req.body);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // Business logic
    const customization = chessCustomizationStorage.create(req.body);
    
    // Success logging
    logSuccess('createCustomization', `Created customization with ID: ${customization.id}`, {
      id: customization.id,
      name: customization.name
    });

    res.status(201).json({ success: true, data: customization });
  } catch (error) {
    // Error logging
    logError('createCustomization', error as Error, { body: req.body });
    next(error); // Pass to error middleware
  }
};
```

### In Express App

```typescript
import { requestLogger, errorHandler, notFoundHandler } from './middleware';

const app = express();

// Request logging (first middleware)
app.use(requestLogger);

// ... other middleware and routes ...

// 404 handler (after all routes)
app.use(notFoundHandler);

// Error handler (last middleware)
app.use(errorHandler);
```

## Log Output Examples

### Request Log
```
[2024-01-15T10:30:00.000Z] POST /api/customizations - IP: 127.0.0.1
[2024-01-15T10:30:00.000Z] Request body: {
  "name": "My Custom Board",
  "pieces": [
    {
      "type": "pawn",
      "color": "white",
      "svgData": "[SVG data - 1024 chars]"
    }
  ]
}
[2024-01-15T10:30:00.123Z] POST /api/customizations - 201 SUCCESS - 123ms
```

### Success Log
```
[2024-01-15T10:30:00.100Z] SUCCESS in createCustomization: Created customization with ID: abc123
  Data: { id: "abc123", name: "My Custom Board" }
```

### Error Log
```
[2024-01-15T10:30:00.100Z] ERROR in createCustomization:
  Message: Validation failed: Name is required and must be a non-empty string
  Stack: ValidationError: Validation failed: Name is required and must be a non-empty string
    at validateCreateCustomization (/src/utils/validation.ts:45:11)
    ...
  Additional info: { body: { invalid: "data" } }
```

## Configuration

### Log Levels

Currently using console logging. In production, consider:

- Using a proper logging library (Winston, Pino)
- Configuring log levels (DEBUG, INFO, WARN, ERROR)
- Log rotation and archiving
- Structured logging (JSON format)

### Error Reporting

For production environments, consider:

- Error tracking services (Sentry, Bugsnag)
- Alerting for critical errors
- Error metrics and monitoring
- Log aggregation (ELK stack, Splunk)