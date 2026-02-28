import express from 'express';
import User from '../models/User.js';
import Sticker from '../models/Sticker.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters'
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password,
      plan: 'free'
    });

    await user.save();

    logger.info(`New user registered: ${email}`);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    // Find user and include password hash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for: ${email}`);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${email}`);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', verifyRefreshToken, (req, res) => {
  try {
    const accessToken = generateAccessToken(req.userId);

    res.json({
      success: true,
      data: {
        accessToken: accessToken
      }
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/auth/dashboard
 * Get user's dashboard with all stickers
 * Protected endpoint
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).populate('stickers');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Filter out expired and inactive stickers
    const activeStickers = user.stickers.filter((sticker) => {
      return sticker.isActive && !sticker.isExpired();
    });

    logger.info(`Dashboard accessed by user: ${userId}`);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        stickers: activeStickers,
        totalStickers: activeStickers.length,
        plan: user.plan
      }
    });
  } catch (error) {
    logger.error(`Dashboard error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/dashboard/stats
 * Get user stats
 * Protected endpoint
 */
router.get('/dashboard/stats', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const stickers = await Sticker.find({ owner: userId, isActive: true });

    const totalScans = stickers.reduce((sum, sticker) => sum + sticker.scanCount, 0);
    const totalStickers = stickers.length;

    // Calculate storage (estimate)
    const totalSize = stickers.reduce((sum, sticker) => sum + 10, 0); // 10MB average per sticker

    logger.info(`Stats retrieved for user: ${userId}`);

    res.json({
      success: true,
      data: {
        totalStickers: totalStickers,
        totalScans: totalScans,
        estimatedStorage: `${totalSize}MB`,
        recentStickers: stickers.slice(-5).reverse()
      }
    });
  } catch (error) {
    logger.error(`Stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/sticker/:id
 * Delete a sticker
 * Protected endpoint
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sticker = await Sticker.findOne({ id });

    if (!sticker) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STICKER_NOT_FOUND',
          message: 'Sticker not found'
        }
      });
    }

    // Check ownership
    if (!sticker.owner || !sticker.owner.equals(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this sticker'
        }
      });
    }

    // Soft delete
    sticker.isActive = false;
    await sticker.save();

    // Remove from user's stickers
    await User.findByIdAndUpdate(userId, {
      $pull: { stickers: sticker._id }
    });

    logger.info(`Sticker deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Sticker deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete sticker error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
});

export default router;
