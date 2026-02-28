import Sticker from '../models/Sticker.js';
import logger from '../utils/logger.js';

/**
 * GET /ar/:id
 * Get sticker data for AR viewer
 */
export const getArData = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.query;

    const sticker = await Sticker.findOne({ id, isActive: true });

    if (!sticker) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STICKER_NOT_FOUND',
          message: 'Sticker not found'
        }
      });
    }

    // Check if expired
    if (sticker.isExpired()) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'STICKER_EXPIRED',
          message: 'This sticker has expired'
        }
      });
    }

    // Check password if protected
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

    logger.info(`AR data retrieved for sticker: ${id}`);

    res.json({
      success: true,
      data: {
        id: sticker.id,
        imageUrl: sticker.imageUrl,
        videoUrl: sticker.videoUrl,
        mindFileUrl: sticker.mindFileUrl,
        options: {
          loop: sticker.options.loop,
          caption: sticker.options.caption
        },
        createdAt: sticker.createdAt,
        expiresAt: sticker.expiresAt
      }
    });
  } catch (error) {
    logger.error(`Get AR data error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

/**
 * GET /ar/:id/metadata
 * Get sticker metadata (without sensitive data)
 */
export const getArMetadata = async (req, res) => {
  try {
    const { id } = req.params;

    const sticker = await Sticker.findOne({ id, isActive: true });

    if (!sticker) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STICKER_NOT_FOUND',
          message: 'Sticker not found'
        }
      });
    }

    // Check if expired
    if (sticker.isExpired()) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'STICKER_EXPIRED',
          message: 'This sticker has expired'
        }
      });
    }

    logger.info(`Metadata retrieved for sticker: ${id}`);

    res.json({
      success: true,
      data: {
        id: sticker.id,
        caption: sticker.options.caption,
        isPasswordProtected: !!sticker.options.password,
        scanCount: sticker.scanCount,
        createdAt: sticker.createdAt,
        expiresAt: sticker.expiresAt,
        daysUntilExpiry: Math.ceil((sticker.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    logger.error(`Get metadata error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

/**
 * DELETE /ar/:id
 * Delete sticker (requires authentication)
 */
export const deleteSticker = async (req, res) => {
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

    // Mark as inactive instead of hard delete (soft delete)
    sticker.isActive = false;
    await sticker.save();

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
};
