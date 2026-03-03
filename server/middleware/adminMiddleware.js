/**
 * Admin Authorization Middleware (PRODUCTION READY)
 * middleware/adminMiddleware.js
 *
 * Features:
 * - Strong admin guard
 * - Owner fallback
 * - Future role support
 * - Clean security responses
 */

/* =========================================================
   👑 REQUIRE ADMIN
   ========================================================= */

export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required.'
      });
    }

    next();

  } catch (error) {
    console.error('❌ requireAdmin error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authorization check failed.'
    });
  }
};

/* =========================================================
   👤 ADMIN OR OWNER
   ========================================================= */

export const requireAdminOrOwner = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admin always allowed
    if (req.user.isAdmin) {
      return next();
    }

    // Owner check
    const resourceUserId =
      req.params.userId ||
      req.body.userId ||
      req.params.id;

    if (
      resourceUserId &&
      resourceUserId.toString() === req.user._id.toString()
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });

  } catch (error) {
    console.error('❌ requireAdminOrOwner error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authorization check failed.'
    });
  }
};

/* =========================================================
   🚀 FUTURE ROLE GUARD (not used yet)
   ========================================================= */

export const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const userRole = req.user.role || (req.user.isAdmin ? 'admin' : 'user');

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions.'
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Role check failed.'
      });
    }
  };
};
