import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Rate limiter for upload endpoint
 * Default: 10 uploads per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_WINDOW_MS) || 1000 * 60 * 60, // 1 hour
  max: parseInt(process.env.UPLOAD_RATE_LIMIT) || 10,
  message: 'Too many uploads from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiter if user is authenticated and has higher tier
    if (req.user && req.user.plan === 'pro') {
      return true;
    }
    return false;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many uploads from this IP, please try again after an hour'
      }
    });
  }
});

/**
 * Rate limiter for scan endpoint
 * Default: 100 scans per minute per IP
 */
export const scanRateLimiter = rateLimit({
  windowMs: parseInt(process.env.SCAN_RATE_WINDOW_MS) || 1000 * 60, // 1 minute
  max: parseInt(process.env.SCAN_RATE_LIMIT) || 100,
  message: 'Too many scans from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Scan rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many scans, please try again after a minute'
      }
    });
  }
});

/**
 * Rate limiter for auth endpoints
 * Default: 5 attempts per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again after 15 minutes'
      }
    });
  }
});

/**
 * General API rate limiter
 * Default: 100 requests per 15 minutes per IP
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});
