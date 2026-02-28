import sharp from 'sharp';
import * as msgpack from '@msgpack/msgpack';
import logger from '../utils/logger.js';

/**
 * Node.js-compatible MindAR compiler.
 *
 * The official OfflineCompiler from mind-ar relies on the native `canvas`
 * npm package which often fails to build on Windows.  We sidestep that by
 * sub-classing CompilerBase directly, using `sharp` for image decoding, and
 * providing a tiny Canvas/Context2D shim so the base class can run its
 * `compileImageTargets()` pipeline unchanged.
 */

// ── Imports from mind-ar internals (installed with --ignore-scripts) ───────
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
// Ensure CPU kernels are registered (no WebGL on server)
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

/**
 * Minimal Canvas / Context2D shim used only inside CompilerBase#compileImageTargets.
 * The base class calls:
 *   const canvas  = this.createProcessCanvas(img);
 *   const ctx     = canvas.getContext('2d');
 *   ctx.drawImage(img, 0, 0, w, h);
 *   const idata   = ctx.getImageData(0, 0, w, h);
 *
 * Our "img" objects already carry raw RGBA pixel data (from sharp), so drawImage
 * is a no-op copy and getImageData simply returns that buffer.
 */
class ShimContext2D {
  constructor() {
    this._data = null;
    this._w = 0;
    this._h = 0;
  }
  drawImage(img /*, x, y, w, h */) {
    this._data = img.data;   // Uint8Array / Buffer of RGBA pixels
    this._w = img.width;
    this._h = img.height;
  }
  getImageData(/* x, y, w, h */) {
    return { data: this._data, width: this._w, height: this._h };
  }
}

class ShimCanvas {
  constructor(w, h) {
    this.width = w;
    this.height = h;
  }
  getContext(/* type */) {
    return new ShimContext2D();
  }
}

/**
 * Node-safe compiler that extends CompilerBase with no native canvas dependency.
 */
class NodeCompiler extends CompilerBase {
  createProcessCanvas(img) {
    return new ShimCanvas(img.width, img.height);
  }

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

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a real MindAR .mind file from an image buffer.
 * @param {Buffer} imageBuffer - Image file buffer (JPEG / PNG / WebP …)
 * @param {string} imageName   - Original file name (for logging)
 * @returns {Promise<Buffer>}  - Compiled .mind file buffer
 */
export const generateMindFile = async (imageBuffer, imageName) => {
  logger.info(`Compiling .mind file for ${imageName}`);

  // 1. Decode image to raw RGBA using sharp
  const { data: rgbaData, info } = await sharp(imageBuffer)
    .ensureAlpha()               // guarantee 4 channels
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Build an "image" object the compiler base class expects
  const img = {
    data: new Uint8Array(rgbaData.buffer, rgbaData.byteOffset, rgbaData.byteLength),
    width: info.width,
    height: info.height,
  };

  // 2. Compile
  const compiler = new NodeCompiler();
  await compiler.compileImageTargets([img], (progress) => {
    logger.info(`  .mind compile progress: ${Math.round(progress)}%`);
  });

  // 3. Export msgpack-encoded .mind buffer
  const mindData = compiler.exportData();
  const mindBuffer = Buffer.from(mindData);

  logger.info(`Successfully compiled .mind file for ${imageName} (${(mindBuffer.length / 1024).toFixed(1)} KB)`);
  return mindBuffer;
};

/**
 * Validate a MindAR .mind file by decoding its msgpack envelope.
 * @param {Buffer} mindBuffer
 * @returns {boolean}
 */
export const validateMindFile = (mindBuffer) => {
  try {
    const content = msgpack.decode(new Uint8Array(mindBuffer));
    return content && content.v === 2 && Array.isArray(content.dataList);
  } catch {
    return false;
  }
};
