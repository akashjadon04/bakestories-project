/**
 * Order Routes (HARDENED)
 * routes/orders.js — Order endpoints with COD flow
 */

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { orderLimiter } from '../middleware/rateLimiter.js';
import {
  createOrder,
  getOrder,
  trackOrder,
  getUserOrders,
  requestCall,
  cancelOrder,
  validateCoupon,
  // Admin
  getAllOrders,
  confirmOrder,
  updateOrderStatus,
  getPendingConfirmationOrders,
  getOrderStatistics
} from '../controllers/orderController.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* =========================================================
   PUBLIC ROUTES
   ========================================================= */
router.post('/create', orderLimiter, asyncHandler(createOrder));
router.get('/track/:orderNumber', asyncHandler(trackOrder));
router.post('/validate-coupon', asyncHandler(validateCoupon));

/* =========================================================
   AUTHENTICATED USER ROUTES
   ========================================================= */
router.get('/user/orders', authenticate, asyncHandler(getUserOrders));
router.get('/:id', authenticate, asyncHandler(getOrder));
router.post('/:id/request-call', authenticate, asyncHandler(requestCall));
router.post('/:id/cancel', authenticate, asyncHandler(cancelOrder));

/* =========================================================
   ADMIN ROUTES (declare BEFORE generic param routes to avoid collisions)
   ========================================================= */
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(getAllOrders));
router.get('/admin/pending-confirmation', authenticate, requireAdmin, asyncHandler(getPendingConfirmationOrders));
router.get('/admin/statistics', authenticate, requireAdmin, asyncHandler(getOrderStatistics));
router.post('/admin/:id/confirm', authenticate, requireAdmin, asyncHandler(confirmOrder));
router.put('/admin/:id/status', authenticate, requireAdmin, asyncHandler(updateOrderStatus));

export default router;
