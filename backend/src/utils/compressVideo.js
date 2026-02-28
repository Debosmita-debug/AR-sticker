import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

// Set FFmpeg path if provided in env
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

const MAX_VIDEO_SIZE = (process.env.MAX_VIDEO_SIZE_MB || 15) * 1024 * 1024; // bytes

/**
 * Compress video file to fit within size limit
 * @param {string} inputPath - Path to input video file
 * @param {string} outputPath - Path to save compressed video
 * @returns {Promise<boolean>} - True if compression was successful
 */
export const compressVideo = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    // Get input file size
    fs.stat(inputPath, (err, stats) => {
      if (err) {
        logger.error(`Error reading input file: ${err.message}`);
        return reject(err);
      }

      // If already under limit, just copy
      if (stats.size <= MAX_VIDEO_SIZE) {
        fs.copyFile(inputPath, outputPath, (err) => {
          if (err) {
            logger.error(`Error copying file: ${err.message}`);
            return reject(err);
          }
          logger.info(`Video already within size limit: ${stats.size / (1024 * 1024)}MB`);
          resolve(true);
        });
        return;
      }

      logger.info(`Compressing video from ${stats.size / (1024 * 1024)}MB...`);

      // Compress with quality degradation
      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions([
          '-crf 28',
          '-preset fast',
          '-vcodec libx264',
          '-acodec aac',
          '-b:a 64k'
        ])
        .on('end', () => {
          logger.info(`Video compression completed: ${outputPath}`);
          resolve(true);
        })
        .on('error', (err) => {
          logger.error(`FFmpeg error: ${err.message}`);
          reject(err);
        })
        .run();
    });
  });
};

/**
 * Get video duration in seconds
 * @param {string} filePath - Path to video file
 * @returns {Promise<number>} - Duration in seconds
 */
export const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.error(`Error getting video metadata: ${err.message}`);
        return reject(err);
      }
      const duration = metadata.format.duration;
      resolve(duration);
    });
  });
};
