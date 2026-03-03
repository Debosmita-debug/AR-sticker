import Sticker from '../models/Sticker.js';
import logger from '../utils/logger.js';

/**
 * Invalidate universal cache when a new sticker is uploaded
 * With online MINDAR API, we don't need complex caching
 */
export const invalidateUniversalCache = () => {
  logger.info('Universal cache invalidated (no-op with online compiler)');
};

/**
 * Get scanner data for multiple stickers (universal scanner)
 * 
 * Note: With the online compiler approach, we use per-sticker .mind files
 * The universal scanner could download multiple .mind files, but for now
 * we recommend using the sticker-specific scanner for better UX
 */
export const getUniversalScannerData = async () => {
  try {
    logger.info('Universal scanner requested (per-sticker .mind files recommended)');
    return {
      mindFileUrl: null,
      targets: [],
      message: 'Universal scanner not implemented with online compiler. Use sticker-specific scanner instead.',
      recommendation: 'Share the link: /scanner/STICKER_ID'
    };
  } catch (error) {
    logger.error(`Error getting universal scanner data: ${error.message}`);
    throw error;
  }
};
