import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} resourceType - 'image', 'video', 'raw'
 * @returns {Promise<Object>} - Upload response
 */
export const uploadToCloudinary = async (fileBuffer, fileName, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: `ar-sticker/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        folder: 'ar-sticker',
        overwrite: false,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          return reject(error);
        }
        logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Generate signed URL for secure delivery
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'video'
 * @param {number} expirySeconds - URL expiry time in seconds (default 1 hour)
 * @returns {string} - Signed URL
 */
export const generateSignedUrl = (publicId, resourceType = 'image', expirySeconds = 3600) => {
  try {
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      secure: true,
      type: 'authenticated',
      expiration: Math.floor(Date.now() / 1000) + expirySeconds
    });
    logger.info(`Signed URL generated for ${publicId}`);
    return url;
  } catch (error) {
    logger.error(`Error generating signed URL: ${error.message}`);
    throw error;
  }
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - File metadata
 */
export const getFileInfo = async (publicId) => {
  try {
    const resource = await cloudinary.api.resource(publicId);
    logger.info(`Retrieved file info for ${publicId}`);
    return resource;
  } catch (error) {
    logger.error(`Error getting file info: ${error.message}`);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<Object>} - Delete response
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    logger.info(`File deleted from Cloudinary: ${publicId}`);
    return response;
  } catch (error) {
    logger.error(`Error deleting from Cloudinary: ${error.message}`);
    throw error;
  }
};

/**
 * Upload with retry logic (3 attempts)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} resourceType - 'image', 'video', 'raw'
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - Upload response
 */
export const uploadWithRetry = async (fileBuffer, fileName, resourceType = 'image', maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Upload attempt ${attempt}/${maxRetries} for ${fileName}`);
      const result = await uploadToCloudinary(fileBuffer, fileName, resourceType);
      return result;
    } catch (error) {
      lastError = error;
      logger.warn(`Upload attempt ${attempt} failed: ${error.message}`);
      
      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
};
