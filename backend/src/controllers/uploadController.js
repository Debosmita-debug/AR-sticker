import Sticker from '../models/Sticker.js';
import User from '../models/User.js';
import { uploadWithRetry, generateSignedUrl } from '../services/cloudinaryService.js';
import { generateMindFile } from '../services/mindARService.js';
import { compressVideo } from '../utils/compressVideo.js';
import { generateStickerId } from '../utils/generateId.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * POST /api/upload
 * Upload image + video and create sticker
 */
export const uploadSticker = async (req, res) => {
  let tempImagePath = null;
  let tempVideoPath = null;
  let tempCompressedPath = null;

  try {
    const { image, video } = req.files;
    const options = req.body.options || {};
    const userId = req.userId || null;

    // Validate options
    if (options.expiryDays && (options.expiryDays < 1 || options.expiryDays > 365)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EXPIRY',
          message: 'expiryDays must be between 1 and 365'
        }
      });
    }

    logger.info('Starting sticker upload process');

    // Generate unique sticker ID
    const stickerId = generateStickerId();

    // Create temporary files for processing
    const tempDir = os.tmpdir();
    tempImagePath = path.join(tempDir, `${stickerId}-image`);
    tempVideoPath = path.join(tempDir, `${stickerId}-video`);
    tempCompressedPath = path.join(tempDir, `${stickerId}-compressed.mp4`);

    // Save files temporarily
    fs.writeFileSync(tempImagePath, image.data);
    fs.writeFileSync(tempVideoPath, video.data);

    logger.info(`Temporary files created for sticker ${stickerId}`);

    // Compress video if needed
    const videoBuffer = video.size > 15 * 1024 * 1024 
      ? await compressVideo(tempVideoPath, tempCompressedPath).then(() => fs.readFileSync(tempCompressedPath))
      : video.data;

    logger.info(`Video processing completed for sticker ${stickerId}`);

    // Generate .mind file from image
    const mindBuffer = await generateMindFile(image.data, image.name);

    logger.info(`MindAR file generated for sticker ${stickerId}`);

    // Upload image to Cloudinary
    const imageResult = await uploadWithRetry(image.data, image.name, 'image');
    const imageUrl = generateSignedUrl(imageResult.public_id, 'image', 3600);

    // Upload video to Cloudinary
    const videoResult = await uploadWithRetry(videoBuffer, video.name, 'video');
    const videoUrl = generateSignedUrl(videoResult.public_id, 'video', 3600);

    // Upload .mind file to Cloudinary
    const mindResult = await uploadWithRetry(mindBuffer, `${stickerId}.mind`, 'raw');
    const mindUrl = generateSignedUrl(mindResult.public_id, 'raw', 3600);

    logger.info(`All files uploaded to Cloudinary for sticker ${stickerId}`);

    // Calculate expiry date
    const expiryDays = options.expiryDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create sticker record in database
    const stickerData = {
      id: stickerId,
      owner: userId,
      imageUrl: imageUrl,
      videoUrl: videoUrl,
      mindFileUrl: mindUrl,
      cloudinaryImageId: imageResult.public_id,
      cloudinaryVideoId: videoResult.public_id,
      cloudinaryMindId: mindResult.public_id,
      options: {
        loop: options.loop !== undefined ? options.loop : true,
        caption: options.caption || '',
        password: options.password || null,
        expiryDays: expiryDays
      },
      expiresAt: expiresAt,
      scanCount: 0
    };

    const sticker = await Sticker.create(stickerData);

    // Add sticker to user's stickers list if authenticated
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $push: { stickers: sticker._id }
      });
    }

    logger.info(`Sticker created successfully: ${stickerId}`);

    // Generate URLs for response
    const arPageUrl = `${process.env.FRONTEND_URL}/ar/${stickerId}`;
    const scanPageUrl = `${process.env.FRONTEND_URL}/scan/${stickerId}`;

    res.status(201).json({
      success: true,
      data: {
        id: stickerId,
        arPageUrl: arPageUrl,
        scanPageUrl: scanPageUrl,
        expiresAt: expiresAt,
        createdAt: sticker.createdAt
      }
    });
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || 'Unknown upload error';
    logger.error(`Upload error: ${errorMessage}`);
    
    // Log stack trace for debugging
    if (error?.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: errorMessage
      }
    });
  } finally {
    // Cleanup temporary files
    try {
      if (tempImagePath && fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
      if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (tempCompressedPath && fs.existsSync(tempCompressedPath)) fs.unlinkSync(tempCompressedPath);
    } catch (cleanupError) {
      logger.warn(`Cleanup error: ${cleanupError.message}`);
    }
  }
};

/**
 * GET /api/upload/:id/status
 * Check upload status
 */
export const getUploadStatus = async (req, res) => {
  try {
    const { id } = req.params;

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

    res.json({
      success: true,
      data: {
        id: sticker.id,
        status: 'completed',
        createdAt: sticker.createdAt,
        expiresAt: sticker.expiresAt,
        scanCount: sticker.scanCount
      }
    });
  } catch (error) {
    logger.error(`Get upload status error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};
