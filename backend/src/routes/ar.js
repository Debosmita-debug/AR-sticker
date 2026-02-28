import express from 'express';
import { getArData, getArMetadata, deleteSticker } from '../controllers/arController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { passwordProtect, checkStickerOwnership } from '../middleware/passwordProtect.js';

const router = express.Router();

/**
 * GET /ar/:id
 * Get sticker data for AR viewer
 * Public endpoint, optionally authenticated
 */
router.get('/:id', optionalAuth, getArData);

/**
 * GET /ar/:id/metadata
 * Get sticker metadata
 * Public endpoint
 */
router.get('/:id/metadata', getArMetadata);

/**
 * DELETE /ar/:id
 * Delete sticker (requires authentication and ownership)
 */
router.delete('/:id', authenticate, checkStickerOwnership, deleteSticker);

export default router;
