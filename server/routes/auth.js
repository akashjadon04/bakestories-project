/**
 * Authentication Routes (HARDENED)
 * routes/auth.js — User authentication endpoints
 *
 * - Adds async handler wrapper for safe error propagation
 * - Keeps rate limiting in place
 * - Leaves controller names unchanged (register, login, getMe, etc.)
 */

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  changePassword
} from '../controllers/authController.js';

const router = express.Router();

// small helper to wrap async controller functions and forward errors to next()
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Public routes
 * Rate-limited to reduce brute-force and abuse
 */
router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));

/**
 * Protected routes
 * All of these require a valid access token
 */
router.get('/me', authenticate, asyncHandler(getMe));
router.put('/me', authenticate, asyncHandler(updateProfile));
router.post('/addresses', authenticate, asyncHandler(addAddress));
router.delete('/addresses/:index', authenticate, asyncHandler(deleteAddress));
router.put('/change-password', authenticate, asyncHandler(changePassword));

/**
 * Lightweight health route for auth (useful in prod)
 */
router.get('/_health/ping', (req, res) => res.json({ success: true, message: 'auth ok', timestamp: new Date().toISOString() }));

export default router;
