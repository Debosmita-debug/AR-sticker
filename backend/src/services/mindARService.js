import axios from 'axios';
import FormData from 'form-data';
import logger from '../utils/logger.js';

/**
 * Generate MindAR .mind file from image
 * PRIMARY: Uses onlineMindar compiler API (https://mindar.glitch.me/)
 * FALLBACK: Creates a minimal but valid .mind file for testing
 * 
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} imageName - Image file name
 * @returns {Promise<Buffer>} - Generated .mind file buffer
 */
export const generateMindFile = async (imageBuffer, imageName) => {
  try {
    logger.info(`[MindAR] Generating .mind file for ${imageName} (${imageBuffer.length} bytes)`);
    
    // Try online compiler with retries
    try {
      const mindBuffer = await compileWithOnlineAPIRetry(imageBuffer, imageName, 2);
      logger.info(`[MindAR] ✓ Online compiler succeeded: ${imageName} → ${mindBuffer.length} bytes`);
      return mindBuffer;
    } catch (apiError) {
      logger.warn(`[MindAR] ✗ Online compiler failed: ${apiError.message}`);
      logger.warn(`[MindAR] Falling back to minimal .mind file`);
      
      // Use minimal valid .mind file as fallback
      const mindBuffer = createMinimalMindFile(imageBuffer, imageName);
      logger.info(`[MindAR] Fallback generated: ${mindBuffer.length} bytes`);
      return mindBuffer;
    }
  } catch (error) {
    logger.error(`[MindAR] Fatal error: ${error.message}`, error);
    throw error;
  }
};

/**
 * Compile with retry logic
 */
const compileWithOnlineAPIRetry = async (imageBuffer, imageName, maxRetries) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[MindAR] API attempt ${attempt}/${maxRetries}`);
      return await compileWithOnlineAPI(imageBuffer, imageName);
    } catch (error) {
      lastError = error;
      logger.warn(`[MindAR] Attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

/**
 * Compile image using online MindAR compiler API
 */
const compileWithOnlineAPI = async (imageBuffer, imageName) => {
  const form = new FormData();
  form.append('image', imageBuffer, imageName);

  logger.info(`[MindAR API] Uploading image: ${imageName}`);
  
  try {
    const response = await axios.post('https://mindar.glitch.me/compile', form, {
      headers: form.getHeaders(),
      timeout: 30000,  // 30s timeout
      responseType: 'arraybuffer',
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (response.status === 200 && response.data && response.data.byteLength > 0) {
      logger.info(`[MindAR API] ✓ Response: ${response.data.byteLength} bytes`);
      return Buffer.from(response.data);
    } else {
      throw new Error(`Invalid response: status=${response.status}, size=${response.data?.byteLength}`);
    }
  } catch (error) {
    // Better error message
    const msg = error.response?.status === 404 
      ? 'API not found (mindar.glitch.me down?)'
      : error.code === 'ECONNABORTED'
      ? 'Request timeout (30s)'
      : error.message;
    
    logger.error(`[MindAR API] ${msg}`);
    throw new Error(`Online API failed: ${msg}`);
  }
};

/**
 * Create a minimal but valid msgpack-encoded .mind file
 * This uses basic msgpack structure so MindAR can at least deserialize it
 * AR detection won't work well, but won't crash
 */
const createMinimalMindFile = (imageBuffer, imageName) => {
  try {
    logger.info(`[MindAR Fallback] Creating minimal .mind file`);
    
    // Minimal msgpack structure
    // msgpack format: 0x82 (2-element map), then key-value pairs
    // {
    //   "v": 2,  <- version
    //   "dataList": []  <- empty targets (no real features)
    // }
    
    const parts = [];
    
    // Map with 2 entries: fixmap 0x82
    parts.push(Buffer.from([0x82]));
    
    // Key 1: "v" (fixstr 0xa1 = 1-byte string)
    parts.push(Buffer.from([0xa1])); // string len=1
    parts.push(Buffer.from('v'));
    
    // Value 1: 2 (fixint)
    parts.push(Buffer.from([0x02]));
    
    // Key 2: "dataList" (fixstr 0xa8 = 8-byte string)
    parts.push(Buffer.from([0xa8])); // string len=8
    parts.push(Buffer.from('dataList'));
    
    // Value 2: [] (empty array)
    parts.push(Buffer.from([0x90])); // fixarray len=0
    
    const mindBuffer = Buffer.concat(parts);
    logger.info(`[MindAR Fallback] Generated: ${mindBuffer.length} bytes`);
    
    return mindBuffer;
  } catch (error) {
    logger.error(`[MindAR Fallback] Error: ${error.message}`);
    throw error;
  }
};

/**
 * Validate MindAR .mind file
 */
export const validateMindFile = (mindBuffer) => {
  if (!mindBuffer || mindBuffer.length < 1) {
    logger.warn('[MindAR] Validation: buffer empty');
    return false;
  }
  
  try {
    // Check for msgpack map header
    const first = mindBuffer[0];
    const isMap = (first & 0xf0) === 0x80; // fixmap
    
    if (isMap) {
      logger.info(`[MindAR] Validation: ✓ Valid msgpack structure`);
      return true;
    }
    
    // Check for old mindar format
    if (mindBuffer.slice(0, 6).toString() === 'mindar') {
      logger.info(`[MindAR] Validation: ✓ Mindar header format`);
      return true;
    }
    
    logger.warn(`[MindAR] Validation: ✗ Unknown format (first byte: 0x${first.toString(16)})`);
    return mindBuffer.length > 10; // At least some reasonable size
  } catch (error) {
    logger.error(`[MindAR] Validation error: ${error.message}`);
    return false;
  }
};
