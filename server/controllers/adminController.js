/**
 * Admin Controller (HARDENED)
 * controllers/adminController.js — Admin dashboard operations
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { validateCoupon, formatValidationErrors } from '../utils/validate.js';

/* =========================================================
   DASHBOARD
   ========================================================= */

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      todayOrders,
      pendingConfirmationCount,
      monthlyRevenueAgg,
      lowStockProducts
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'pending-confirmation' }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thisMonth },
            status: { $nin: ['cancelled', 'refunded'] }
          }
        },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
      ]),
      Product.find({ stockQuantity: { $lt: 10 }, isActive: true })
        .select('name stockQuantity')
        .limit(10)
        .lean()
    ]);

    const monthlyRevenue = Array.isArray(monthlyRevenueAgg) && monthlyRevenueAgg[0] ? Number(monthlyRevenueAgg[0].total || 0) : 0;

    const orderStatusBreakdownArr = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const orderStatus = orderStatusBreakdownArr.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        counts: {
          users: Number(totalUsers || 0),
          products: Number(totalProducts || 0),
          orders: Number(totalOrders || 0),
          todayOrders: Number(todayOrders || 0),
          pendingConfirmation: Number(pendingConfirmationCount || 0)
        },
        revenue: {
          monthly: monthlyRevenue
        },
        orderStatus,
        lowStock: lowStockProducts,
        alerts: {
          pendingConfirmation: pendingConfirmationCount > 0 ? `You have ${pendingConfirmationCount} orders awaiting confirmation` : null,
          lowStock: (lowStockProducts && lowStockProducts.length > 0) ? `${lowStockProducts.length} products are running low on stock` : null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   USERS
   ========================================================= */

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search), $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-password')
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate({ path: 'orders', select: 'orderNumber status totalAmount createdAt', options: { sort: { createdAt: -1 } } })
      .lean();

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowed = ['name', 'email', 'phone', 'isActive', 'isAdmin'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.email) updates.email = String(updates.email).toLowerCase().trim();

    // Prevent accidentally removing all admins: if demoting admin, ensure another admin remains
    if (updates.isAdmin === false) {
      const targetUser = await User.findById(id).select('isAdmin');
      if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

      if (targetUser.isAdmin) {
        const otherActiveAdminCount = await User.countDocuments({ _id: { $ne: id }, isAdmin: true, isActive: true });
        if (otherActiveAdminCount === 0) {
          return res.status(400).json({ success: false, message: 'Cannot demote the last active admin' });
        }
      }
    }

    // Enforce unique email if changed
    if (updates.email) {
      const conflicting = await User.findOne({ email: updates.email, _id: { $ne: id } }).lean();
      if (conflicting) {
        return res.status(409).json({ success: false, message: 'Email already used by another account' });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User updated successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If disabling an admin, ensure not last admin
    if (user.isAdmin && user.isActive) {
      const otherActiveAdminCount = await User.countDocuments({ _id: { $ne: id }, isAdmin: true, isActive: true });
      if (otherActiveAdminCount === 0) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last active admin' });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   COUPONS
   ========================================================= */

export const getCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, active } = req.query;
    const query = {};

    if (active === 'true') {
      query.isActive = true;
      query.endDate = { $gte: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Coupon.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { error } = validateCoupon(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: formatValidationErrors(error) });
    }

    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created successfully', data: { coupon } });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon updated successfully', data: { coupon } });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id).lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   PRODUCT ADMIN ACTIONS
   ========================================================= */

export const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isFeatured ? 'marked as featured' : 'removed from featured'}`,
      data: { isFeatured: product.isFeatured }
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, inStock } = req.body;
    const update = {};

    if (quantity !== undefined) update.stockQuantity = Number(quantity);
    if (inStock !== undefined) update.inStock = !!inStock;

    const product = await Product.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { stockQuantity: product.stockQuantity, inStock: product.inStock }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SETTINGS
   ========================================================= */

export const getSettings = async (req, res, next) => {
  try {
    const settings = {
      bakery: {
        name: process.env.BAKERY_NAME || 'The Bake Stories',
        phone: process.env.BAKERY_PHONE || null,
        email: process.env.BAKERY_EMAIL || null
      },
      features: {
        smsEnabled: !!process.env.TWILIO_SID,
        emailEnabled: !!process.env.SENDGRID_API_KEY,
        instagramEnabled: !!process.env.IG_ACCESS_TOKEN
      },
      orderSettings: {
        callConfirmHours: Number(process.env.CALL_CONFIRM_HOURS || 24),
        freeDeliveryThreshold: Number(process.env.FREE_DELIVERY_THRESHOLD || 500)
      }
    };

    res.json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
};
