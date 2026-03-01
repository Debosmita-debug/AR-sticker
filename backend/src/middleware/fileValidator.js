import { fileTypeFromBuffer } from 'file-type';
import logger from '../utils/logger.js';

const MAX_IMAGE_SIZE = (process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024; // bytes
const MAX_VIDEO_SIZE = (process.env.MAX_VIDEO_SIZE_MB || 50) * 1024 * 1024; // bytes

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

/**
 * Validate file MIME type using magic bytes (not just extension)
 */
export const validateFileMimeType = async (fileBuffer, expectedTypes) => {
  try {
    const type = await fileTypeFromBuffer(fileBuffer);

    if (!type) {
      logger.warn('File type could not be determined');
      return false;
    }

    const isValid = expectedTypes.includes(type.mime);
    
    if (!isValid) {
      logger.warn(`Invalid MIME type: ${type.mime}, expected: ${expectedTypes.join(', ')}`);
    }

    return isValid;
  } catch (error) {
    logger.error(`Error validating MIME type: ${error.message}`);
    return false;
  }
};

/**
 * Middleware to validate uploaded files
 */
export const fileValidator = (req, res, next) => {
  try {
    if (!req.files || !req.files.image || !req.files.video) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILES',
          message: 'Both image and video files are required'
        }
      });
    }

    const imageFile = req.files.image;
    const videoFile = req.files.video;

    // Validate image
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: `Image must be less than ${process.env.MAX_IMAGE_SIZE_MB || 5}MB`
        }
      });
    }

    // Validate video
    if (videoFile.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VIDEO_TOO_LARGE',
          message: `Video must be less than ${process.env.MAX_VIDEO_SIZE_MB || 50}MB (will be compressed)`
        }
      });
    }

    // Validate image MIME type (magic bytes)
    validateFileMimeType(imageFile.data, ALLOWED_IMAGE_TYPES)
      .then((isValid) => {
        if (!isValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_IMAGE_TYPE',
              message: 'Image must be JPG or PNG format'
            }
          });
        }

        // Validate video MIME type (magic bytes)
        return validateFileMimeType(videoFile.data, ALLOWED_VIDEO_TYPES);
      })
      .then((isValid) => {
        if (!isValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_VIDEO_TYPE',
              message: 'Video must be MP4 or WebM format'
            }
          });
        }

        logger.info(`File validation passed for upload`);
        next();
      });
  } catch (error) {
    logger.error(`File validation error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'File validation failed'
      }
    });
  }
};

/**
 * Middleware to validate request body options
 */
export const validateOptions = (req, res, next) => {
  try {
    // Support options sent as JSON string from FormData
    let rawOptions = req.body.options || {};
    if (typeof rawOptions === 'string') {
      try {
        rawOptions = JSON.parse(rawOptions);
      } catch {
        rawOptions = {};
      }
      req.body.options = rawOptions;
    }
    const options = rawOptions;

    // Validate expiryDays
    if (options.expiryDays !== undefined) {
      if (!Number.isInteger(options.expiryDays) || options.expiryDays < 1 || options.expiryDays > 365) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EXPIRY',
            message: 'expiryDays must be between 1 and 365'
          }
        });
      }
    }

    // Validate loop
    if (options.loop !== undefined && typeof options.loop !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LOOP',
          message: 'loop must be a boolean'
        }
      });
    }

    // Validate caption (sanitize)
    if (options.caption !== undefined && typeof options.caption !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CAPTION',
          message: 'caption must be a string'
        }
      });
    }

    // Password is optional, will be hashed in model
    if (options.password !== undefined && typeof options.password !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'password must be a string'
        }
      });
    }

    logger.info('Options validation passed');
    next();
  } catch (error) {
    logger.error(`Options validation error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Options validation failed'
      }
    });
  }
};
