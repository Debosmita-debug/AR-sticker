import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// MUST be first - load environment variables before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envConfig = dotenv.config({ path: path.join(__dirname, '.env') });

// Debug logging
if (envConfig.error) {
  console.warn(`Warning: Could not load .env file: ${envConfig.error.message}`);
} else {
  console.log(`✓ .env file loaded from: ${path.join(__dirname, '.env')}`);
  console.log(`✓ CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME}`);
}

// Wrap in async IIFE to use await import
(async () => {
  const { default: app } = await import('./src/app.js');
  const { default: logger } = await import('./src/utils/logger.js');

  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server terminated');
    });
  });
})();
