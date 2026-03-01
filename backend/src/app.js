import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import DOMPurify from 'isomorphic-dompurify';
import fileUpload from 'express-fileupload';
import logger from './utils/logger.js';

// Import routes
import uploadRoutes from './routes/upload.js';
import arRoutes from './routes/ar.js';
import scanRoutes from './routes/scan.js';
import userRoutes from './routes/user.js';

// Import middleware
import { generalApiRateLimiter } from './middleware/rateLimiter.js';
import { auth0OptionalMiddleware } from './middleware/auth0.js';

const app = express();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ar-sticker-db');
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true
  })
);

// Rate limiting
app.use(generalApiRateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  abortOnLimit: true
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Optional Auth0 JWT middleware - extracts user info if token is valid
app.use(auth0OptionalMiddleware);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AR Sticker Platform API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/ar', arRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/auth', userRoutes);

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AR Sticker Platform API',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/upload',
      ar: 'GET /ar/:id',
      scan: 'POST /api/scan/:id',
      auth: 'POST /api/auth/register | login | refresh',
      dashboard: 'GET /api/auth/dashboard'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  logger.error(err.stack);

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: isDevelopment ? err.message : 'Internal server error',
      ...(isDevelopment && { stack: err.stack })
    }
  });
});

export default app;
