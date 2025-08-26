import express from 'express';
import cors from 'cors';
import { customizationRoutes } from './routes';
import { requestLogger, errorHandler, notFoundHandler } from './middleware';
import { initializeStorage } from './storage';
import { DatabaseInitializer, databasePool } from './database';

/**
 * Create and configure Express application
 */
export const createApp = (): express.Application => {
  const app = express();

  // Request logging middleware (should be first)
  app.use(requestLogger);

  // CORS middleware
  app.use(cors());

  // JSON body parser middleware
  app.use(express.json({ limit: '10mb' })); // Increased limit for base64 SVG data

  // URL-encoded body parser middleware
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api/customizations', customizationRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler for unmatched routes (should be after all routes)
  app.use(notFoundHandler);

  // Global error handling middleware (should be last)
  app.use(errorHandler);

  return app;
};

/**
 * Start the server with database initialization
 */
export const startServer = async (port: number = 3000): Promise<void> => {
  try {
    // Initialize database and storage
    if (process.env.NODE_ENV !== 'test') {
      console.log('Initializing database...');
      const dbInitializer = new DatabaseInitializer(databasePool);
      await dbInitializer.initializeDatabase();
      console.log('Database initialized successfully');
    }
    
    await initializeStorage();
    
    const app = createApp();
    
    app.listen(port, () => {
      console.log(`🚀 Chess Customization API server is running on port ${port}`);
      console.log(`📋 Health check available at: http://localhost:${port}/health`);
      console.log(`🎯 API endpoints available at: http://localhost:${port}/api/customizations`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  startServer(port).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}