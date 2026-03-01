import Sticker from '../models/Sticker.js';
import { generatePublicUrl, uploadWithRetry } from './cloudinaryService.js';
import { deleteFromCloudinary } from './cloudinaryService.js';
import sharp from 'sharp';
import logger from '../utils/logger.js';

// ── Imports from mind-ar internals ─────────────────────────────────────────
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

// ── Canvas shim (same as mindARService.js) ─────────────────────────────────

class ShimContext2D {
  constructor() { this._data = null; this._w = 0; this._h = 0; }
  drawImage(img) { this._data = img.data; this._w = img.width; this._h = img.height; }
  getImageData() { return { data: this._data, width: this._w, height: this._h }; }
}

class ShimCanvas {
  constructor(w, h) { this.width = w; this.height = h; }
  getContext() { return new ShimContext2D(); }
}

class NodeCompiler extends CompilerBase {
  createProcessCanvas(img) { return new ShimCanvas(img.width, img.height); }
  compileTrack({ progressCallback, targetImages, basePercent }) {
    return new Promise((resolve) => {
      const percentPerImage = (100 - basePercent) / targetImages.length;
      let percent = 0;
      const list = [];
      for (let i = 0; i < targetImages.length; i++) {
        const imageList = buildTrackingImageList(targetImages[i]);
        const percentPerAction = percentPerImage / imageList.length;
        const trackingData = extractTrackingFeatures(imageList, () => {
          percent += percentPerAction;
          progressCallback(basePercent + percent);
        });
        list.push(trackingData);
      }
      resolve(list);
    });
  }
}

// ── In-memory cache ────────────────────────────────────────────────────────

let cachedResult = null;       // { mindFileUrl, cloudinaryId, targets, stickerHash }
let buildInProgress = null;    // Promise if a build is currently running

/**
 * Compute a simple hash of active sticker IDs to detect changes.
 */
function computeHash(stickers) {
  return stickers.map(s => s.id).sort().join(',');
}

/**
 * Invalidate the universal .mind cache.
 * Call this after sticker creation or deletion.
 */
export const invalidateUniversalCache = () => {
  logger.info('Universal .mind cache invalidated');
  cachedResult = null;
};

// ── Max targets ────────────────────────────────────────────────────────────
const MAX_TARGETS = 30;

/**
 * Download an image buffer from a URL.
 */
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Build (or return cached) universal scanner data.
 *
 * Returns: {
 *   mindFileUrl: string,
 *   targets: Array<{
 *     targetIndex: number,
 *     stickerId: string,
 *     videoUrl: string,
 *     imageUrl: string,
 *     options: { loop: boolean, caption: string }
 *   }>
 * }
 */
export const getUniversalScannerData = async () => {
  // 1. Fetch all active, non-expired, non-password-protected stickers
  const now = new Date();
  const stickers = await Sticker.find({
    isActive: true,
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null }
    ],
    'options.password': { $in: [null, '', undefined] }
  })
    .sort({ createdAt: -1 })
    .limit(MAX_TARGETS)
    .lean();

  if (stickers.length === 0) {
    return { mindFileUrl: null, targets: [] };
  }

  // 2. Check cache validity
  const hash = computeHash(stickers);
  if (cachedResult && cachedResult.stickerHash === hash) {
    logger.info('Universal .mind cache HIT');
    return {
      mindFileUrl: cachedResult.mindFileUrl,
      targets: cachedResult.targets
    };
  }

  // 3. If a build is already in progress, wait for it
  if (buildInProgress) {
    logger.info('Universal .mind build already in progress – waiting');
    return buildInProgress;
  }

  // 4. Build a new combined .mind file
  logger.info(`Building universal .mind file for ${stickers.length} stickers…`);
  buildInProgress = buildCombinedMind(stickers, hash);

  try {
    const result = await buildInProgress;
    return result;
  } finally {
    buildInProgress = null;
  }
};

/**
 * Internal: compile all sticker images into one .mind file.
 */
async function buildCombinedMind(stickers, hash) {
  const targets = [];
  const images = [];

  for (let i = 0; i < stickers.length; i++) {
    const s = stickers[i];

    // Regenerate fresh Cloudinary URLs
    const imageUrl = s.cloudinaryImageId
      ? generatePublicUrl(s.cloudinaryImageId, 'image')
      : s.imageUrl;
    const videoUrl = s.cloudinaryVideoId
      ? generatePublicUrl(s.cloudinaryVideoId, 'video')
      : s.videoUrl;

    try {
      logger.info(`  Downloading image for sticker ${s.id} (${i + 1}/${stickers.length})…`);
      const imgBuffer = await downloadImage(imageUrl);

      // Decode to RGBA pixels
      const { data: rgbaData, info } = await sharp(imgBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      images.push({
        data: new Uint8Array(rgbaData.buffer, rgbaData.byteOffset, rgbaData.byteLength),
        width: info.width,
        height: info.height
      });

      targets.push({
        targetIndex: images.length - 1,
        stickerId: s.id,
        videoUrl,
        imageUrl,
        options: {
          loop: s.options?.loop ?? true,
          caption: s.options?.caption || ''
        }
      });
    } catch (err) {
      logger.warn(`  Skipping sticker ${s.id}: ${err.message}`);
      // Skip this sticker but continue with others
    }
  }

  if (images.length === 0) {
    return { mindFileUrl: null, targets: [] };
  }

  // Compile all images into one .mind file
  logger.info(`Compiling combined .mind with ${images.length} targets…`);
  const compiler = new NodeCompiler();
  await compiler.compileImageTargets(images, (progress) => {
    if (Math.round(progress) % 20 === 0) {
      logger.info(`  Combined .mind compile progress: ${Math.round(progress)}%`);
    }
  });

  const mindData = compiler.exportData();
  const mindBuffer = Buffer.from(mindData);
  logger.info(`Combined .mind file compiled: ${(mindBuffer.length / 1024).toFixed(1)} KB`);

  // Upload to Cloudinary
  const mindResult = await uploadWithRetry(mindBuffer, 'universal-scanner.mind', 'raw');
  const mindFileUrl = generatePublicUrl(mindResult.public_id, 'raw');

  // Delete old cached Cloudinary file if it exists
  if (cachedResult?.cloudinaryId) {
    try {
      await deleteFromCloudinary(cachedResult.cloudinaryId, 'raw');
    } catch (e) {
      logger.warn(`Failed to delete old universal .mind from Cloudinary: ${e.message}`);
    }
  }

  // Update cache
  cachedResult = {
    mindFileUrl,
    cloudinaryId: mindResult.public_id,
    targets,
    stickerHash: hash
  };

  logger.info(`Universal scanner ready: ${targets.length} targets, .mind URL: ${mindFileUrl}`);

  return {
    mindFileUrl: cachedResult.mindFileUrl,
    targets: cachedResult.targets
  };
}
