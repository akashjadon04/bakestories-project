/**
 * Authentication Controller (PRODUCTION HARDENED)
 * controllers/authController.js
 */

import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import {
  validateRegistration,
  validateLogin,
  formatValidationErrors
} from '../utils/validate.js';

/* =========================================================
   📝 REGISTER
   ========================================================= */

export const register = async (req, res, next) => {
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(error)
      });
    }

    const { name, email, phone, password } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === normalizedEmail
            ? 'Email already registered'
            : 'Phone number already registered'
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   🔐 LOGIN
   ========================================================= */

export const login = async (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(error)
      });
    }

    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login safely (non-blocking)
    user.updateLastLogin().catch(() => {});

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   👤 GET PROFILE
   ========================================================= */

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
          avatar: user.avatar,
          addresses: user.addresses,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ✏️ UPDATE PROFILE
   ========================================================= */

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'preferences'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   🏠 ADD ADDRESS
   ========================================================= */

export const addAddress = async (req, res, next) => {
  try {
    const { label, street, city, state, pincode, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({
      label,
      street,
      city,
      state,
      pincode,
      isDefault: !!isDefault
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { addresses: user.addresses }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   🗑 DELETE ADDRESS
   ========================================================= */

export const deleteAddress = async (req, res, next) => {
  try {
    const index = Number(req.params.index);

    const user = await User.findById(req.user._id);

    if (Number.isNaN(index) || index < 0 || index >= user.addresses.length) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    user.addresses.splice(index, 1);
    await user.save();

    return res.json({
      success: true,
      message: 'Address deleted successfully',
      data: { addresses: user.addresses }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   🔑 CHANGE PASSWORD
   ========================================================= */

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id)
      .select('+password');

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   👑 CREATE ADMIN (seed helper)
   ========================================================= */

export const createAdminUser = async (
  email,
  password,
  name = 'Admin'
) => {
  try {
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) return existingAdmin;

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      phone: '+910000000000',
      password,
      isAdmin: true
    });

    console.log('✅ Default admin created:', email);
    return admin;
  } catch (error) {
    console.error('❌ Admin creation failed:', error.message);
    return null;
  }
};
