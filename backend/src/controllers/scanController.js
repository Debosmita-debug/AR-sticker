import Sticker from '../models/Sticker.js';
import logger from '../utils/logger.js';

/**
 * POST /api/scan/:id
 * Record a scan event for a sticker
 */
export const recordScan = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

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
        logger.warn(`Invalid password attempt for scan: ${id}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Invalid password'
          }
        });
      }
    }

    // Record scan with metadata
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.connection.remoteAddress;
    const country = req.headers['cf-ipcountry'] || 'unknown'; // Cloudflare header (optional)

    sticker.recordScan(userAgent, ip, country);
    await sticker.save();

    logger.info(`Scan recorded for sticker ${id}. Total scans: ${sticker.scanCount}`);

    res.json({
      success: true,
      data: {
        id: sticker.id,
        scanCount: sticker.scanCount,
        lastScannedAt: sticker.lastScannedAt
      }
    });
  } catch (error) {
    logger.error(`Record scan error: ${error.message}`);
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
 * GET /api/scan/:id/analytics
 * Get scan analytics for a sticker (if owner)
 */
export const getScanAnalytics = async (req, res) => {
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
          message: 'You do not have permission to access these analytics'
        }
      });
    }

    // Aggregate scan data
    const countryStats = {};
    sticker.scanHistory.forEach((scan) => {
      countryStats[scan.country] = (countryStats[scan.country] || 0) + 1;
    });

    // Calculate daily scans
    const dailyScans = {};
    sticker.scanHistory.forEach((scan) => {
      const date = scan.timestamp.toISOString().split('T')[0];
      dailyScans[date] = (dailyScans[date] || 0) + 1;
    });

    logger.info(`Analytics retrieved for sticker: ${id}`);

    res.json({
      success: true,
      data: {
        id: sticker.id,
        totalScans: sticker.scanCount,
        lastScannedAt: sticker.lastScannedAt,
        createdAt: sticker.createdAt,
        countryStats: countryStats,
        dailyScans: dailyScans,
        recentScans: sticker.scanHistory.slice(-10).reverse()
      }
    });
  } catch (error) {
    logger.error(`Get scan analytics error: ${error.message}`);
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
 * POST /api/scan/:id/reset-count
 * Reset scan count for a sticker (if owner)
 */
export const resetScanCount = async (req, res) => {
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
          message: 'You do not have permission to reset this sticker'
        }
      });
    }

    sticker.scanCount = 0;
    sticker.scanHistory = [];
    await sticker.save();

    logger.info(`Scan count reset for sticker: ${id}`);

    res.json({
      success: true,
      message: 'Scan count reset successfully',
      data: {
        id: sticker.id,
        scanCount: 0
      }
    });
  } catch (error) {
    logger.error(`Reset scan count error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};
