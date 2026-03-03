/**
 * Rate Limiting Middleware (HARDENED)
 * middleware/rateLimiter.js
 */

import rateLimit from 'express-rate-limit';

/* =========================================================
   🌐 GENERAL API LIMITER
   ========================================================= */

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

/* =========================================================
   🔐 AUTH LIMITER
   ========================================================= */

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

/* =========================================================
   🛒 ORDER LIMITER
   ========================================================= */

export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  message: {
    success: false,
    message: 'Order limit reached. Please contact bakery directly.'
  }
});

/* =========================================================
   👑 ADMIN LIMITER
   ========================================================= */

export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  message: {
    success: false,
    message: 'Too many admin actions. Slow down.'
  }
});
