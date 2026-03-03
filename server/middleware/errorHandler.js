/**
 * Global Error Handler Middleware (IMPROVED)
 * middleware/errorHandler.js — Centralized error handling
 *
 * Changes:
 * - Adds requestId for easier tracing
 * - Keeps existing Mongoose/JWT checks
 * - Avoids leaking internals in production
 * - Provides consistent JSON response shapes
 */

import crypto from 'crypto';

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper - catches errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomBytes(8).toString('hex');

  // Build log object
  const logObj = {
    requestId,
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Log to console (replace with Sentry/logging in future)
  console.error('Error:', JSON.stringify(logObj, null, 2));

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      requestId,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      requestId,
      message: `${field} already exists.`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      requestId,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, requestId, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, requestId, message: 'Token expired.' });
  }

  // Custom APIError
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      requestId,
      message: err.message,
      code: err.code || null
    });
  }

  // Fallback
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message;

  res.status(statusCode).json({
    success: false,
    requestId,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
