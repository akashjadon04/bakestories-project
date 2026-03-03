/**
 * ========================================
 * 🔐 Admin Routes (PRODUCTION HARDENED)
 * routes/admin.js — Admin dashboard endpoints
 *
 * Security:
 * - All routes protected via authenticate + requireAdmin
 * - asyncHandler wrapper for safe error forwarding
 * - Ready for rate limiting & scaling
 * ========================================
 */

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

import {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  toggleUserStatus,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleFeatured,
  updateStock,
  getSettings
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * 🔧 Safe async wrapper
 * Prevents unhandled promise rejections
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * ==================================================
 * 🔐 GLOBAL ADMIN PROTECTION
 * Everything below requires:
 *   ✅ Logged in
 *   ✅ Admin role
 * ==================================================
 */
router.use(authenticate, requireAdmin);

/**
 * =============================
 * 📊 Dashboard
 * =============================
 */
router.get('/dashboard', asyncHandler(getDashboardStats));
router.get('/settings', asyncHandler(getSettings));

/**
 * =============================
 * 👥 Users Management
 * =============================
 */
router.get('/users', asyncHandler(getUsers));
router.get('/users/:id', asyncHandler(getUser));
router.put('/users/:id', asyncHandler(updateUser));
router.patch('/users/:id/toggle-status', asyncHandler(toggleUserStatus));

/**
 * =============================
 * 🎟️ Coupons CRUD
 * =============================
 */
router.get('/coupons', asyncHandler(getCoupons));
router.post('/coupons', asyncHandler(createCoupon));
router.put('/coupons/:id', asyncHandler(updateCoupon));
router.delete('/coupons/:id', asyncHandler(deleteCoupon));

/**
 * =============================
 * 📦 Product Admin Actions
 * =============================
 */
router.patch('/products/:id/toggle-featured', asyncHandler(toggleFeatured));
router.patch('/products/:id/stock', asyncHandler(updateStock));

/**
 * =============================
 * ❤️ Health Check
 * Used for uptime monitoring
 * =============================
 */
router.get('/_health/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'admin ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * 🚀 Future Improvements (optional)
 * - Add rate limiter middleware
 * - Add audit logging
 * - Add admin activity logs
 */

export default router;
