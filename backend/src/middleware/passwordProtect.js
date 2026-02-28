import Sticker from '../models/Sticker.js';
import logger from '../utils/logger.js';

/**
 * Middleware to check password protection on sticker
 */
export const passwordProtect = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

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

    // Check if sticker is expired
    if (sticker.isExpired()) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'STICKER_EXPIRED',
          message: 'This sticker has expired'
        }
      });
    }

    // Check if sticker is protected
    if (sticker.options.password) {
      if (!password) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PASSWORD_REQUIRED',
            message: 'This sticker is password protected'
          }
        });
      }

      // Verify password
      const isPasswordValid = await sticker.verifyPassword(password);

      if (!isPasswordValid) {
        logger.warn(`Invalid password attempt for sticker: ${id}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Invalid password'
          }
        });
      }
    }

    req.sticker = sticker;
    next();
  } catch (error) {
    logger.error(`Password protection middleware error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Middleware to check sticker ownership
 * Used in routes like DELETE /api/sticker/:id
 */
export const checkStickerOwnership = async (req, res, next) => {
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

    // Check if user owns this sticker
    if (!sticker.owner || !sticker.owner.equals(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this sticker'
        }
      });
    }

    req.sticker = sticker;
    next();
  } catch (error) {
    logger.error(`Ownership check error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authorization failed'
      }
    });
  }
};
