/**
 * Authentication Middleware (PRODUCTION HARDENED)
 * middleware/authMiddleware.js
 *
 * Features:
 * - Strong JWT verification
 * - Safe header parsing
 * - Graceful failure handling
 * - Optional auth support
 * - Future refresh-token ready
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/* =========================================================
   🔐 HELPERS
   ========================================================= */

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const parts = authHeader.split(' ');

  if (parts.length !== 2) return null;
  if (parts[0] !== 'Bearer') return null;

  return parts[1];
};

/* =========================================================
   🛡 REQUIRED AUTH
   ========================================================= */

export const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication token missing.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] }
      );
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please login again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }

    // Fetch fresh user (important for role changes)
    const user = await User.findById(decoded.id)
      .select('-password')
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    req.user = user;
    req.userId = user._id;

    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authentication failed due to server error.'
    });
  }
};

/* =========================================================
   🧩 OPTIONAL AUTH (for public pages)
   ========================================================= */

export const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] }
      );

      const user = await User.findById(decoded.id)
        .select('-password')
        .lean();

      req.user = user || null;
      req.userId = user?._id || null;

    } catch {
      req.user = null;
      req.userId = null;
    }

    next();

  } catch (error) {
    req.user = null;
    req.userId = null;
    next();
  }
};

/* =========================================================
   🎟 TOKEN GENERATOR
   ========================================================= */

export const generateToken = (userId, options = {}) => {
  return jwt.sign(
    {
      id: userId,
      type: 'access'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: options.expiresIn || '7d',
      issuer: 'thebakestories',
      audience: 'thebakestories-users'
    }
  );
};

/* =========================================================
   🔄 FUTURE: REFRESH TOKEN (not used yet)
   ========================================================= */

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
      issuer: 'thebakestories'
    }
  );
};
