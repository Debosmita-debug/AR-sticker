import express from 'express';
import { uploadSticker, getUploadStatus } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { fileValidator, validateOptions } from '../middleware/fileValidator.js';

const router = express.Router();

/**
 * POST /api/upload
 * Upload image + video and create sticker
 * Rate limited: 10 uploads/hour per IP
 */
router.post('/', 
  uploadRateLimiter,
  fileValidator,
  validateOptions,
  uploadSticker
);

/**
 * GET /api/upload/:id/status
 * Check upload status
 */
router.get('/:id/status', getUploadStatus);

export default router;
