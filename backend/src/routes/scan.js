import express from 'express';
import { getUniversalTargets, recordScan, getScanAnalytics, resetScanCount } from '../controllers/scanController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { scanRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/scan/universal
 * Get combined .mind file + target mapping for universal scanner
 * Public endpoint
 */
router.get('/universal', getUniversalTargets);

/**
 * POST /api/scan/:id
 * Record a scan event for a sticker
 * Rate limited: 100 scans/minute per IP
 * Public endpoint
 */
router.post('/:id', scanRateLimiter, recordScan);

/**
 * GET /api/scan/:id/analytics
 * Get scan analytics for a sticker (requires ownership)
 * Protected endpoint
 */
router.get('/:id/analytics', authenticate, getScanAnalytics);

/**
 * POST /api/scan/:id/reset-count
 * Reset scan count (requires ownership)
 * Protected endpoint
 */
router.post('/:id/reset-count', authenticate, resetScanCount);

export default router;
