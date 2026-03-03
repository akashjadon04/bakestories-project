/**
 * Instagram Routes
 * generated: routes/instagram.js — Hero images and logo endpoints
 */

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  getHeroImages,
  getLogo,
  refreshImages,
  getStatus
} from '../controllers/instagramController.js';

const router = express.Router();

// Public routes
router.get('/hero-images', getHeroImages);
router.get('/logo', getLogo);
router.get('/status', getStatus);

// Admin routes
router.post('/refresh', authenticate, requireAdmin, refreshImages);

export default router;
