import { startServer } from './app';

// Get port from environment or use default
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Start the server
startServer(port).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});