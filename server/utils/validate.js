/**
 * Validation Utilities
 * generated: utils/validate.js — Joi validation schemas
 * FIXED: Added .allow(null) for variant and couponCode
 */

import Joi from 'joi';

// Common validation patterns
const patterns = {
  phone: /^\+?[\d\s-]{10,}$/,
  pincode: /^\d{6}$/,
  objectId: /^[0-9a-fA-F]{24}$/
};

// User registration validation
export const validateRegistration = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required'
      }),
    phone: Joi.string().pattern(patterns.phone).required()
      .messages({
        'string.pattern.base': 'Please enter a valid phone number',
        'any.required': 'Phone number is required'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
      })
  });
  
  return schema.validate(data, { abortEarly: false });
};

// User login validation
export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Product validation
export const validateProduct = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    shortDescription: Joi.string().max(200).optional(),
    category: Joi.string().valid('cakes', 'cupcakes', 'cookies', 'pastries', 'bread', 'brownies', 'custom', 'seasonal').required(),
    price: Joi.number().min(0).required(),
    comparePrice: Joi.number().min(0).optional(),
    inStock: Joi.boolean().default(true),
    stockQuantity: Joi.number().min(0).default(0),
    tags: Joi.array().items(Joi.string()).optional(),
    isFeatured: Joi.boolean().default(false),
    isCustomizable: Joi.boolean().default(false),
    dietary: Joi.object({
      isVegetarian: Joi.boolean(),
      isVegan: Joi.boolean(),
      isEggless: Joi.boolean(),
      isGlutenFree: Joi.boolean(),
      isSugarFree: Joi.boolean()
    }).optional()
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Order item validation
const orderItemSchema = Joi.object({
  product: Joi.string().pattern(patterns.objectId).required()
    .messages({
      'string.pattern.base': 'Invalid product ID'
    }),
  name: Joi.string().optional().allow(''), 
  price: Joi.number().min(0).optional(),   
  quantity: Joi.number().integer().min(1).required()
    .messages({
      'number.min': 'Quantity must be at least 1'
    }),
  variant: Joi.object({
    name: Joi.string(),
    price: Joi.number()
  }).optional().allow(null), // <-- FIXED: Now allows null if no variant selected
  customization: Joi.object({
    message: Joi.string().max(200),
    options: Joi.array()
  }).optional().allow(null)
});

// Order creation validation (COD flow)
export const validateOrderCreate = (data) => {
  const schema = Joi.object({
    items: Joi.array().items(orderItemSchema).min(1).required()
      .messages({
        'array.min': 'Order must contain at least one item'
      }),
    customerName: Joi.string().min(2).max(100).required(),
    customerEmail: Joi.string().email().optional().allow('', null),
    customerPhone: Joi.string().pattern(patterns.phone).required(),
    alternatePhone: Joi.string().pattern(patterns.phone).optional().allow('', null),
    deliveryAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string().pattern(patterns.pincode).required()
        .messages({
          'string.pattern.base': 'Please enter a valid 6-digit pincode'
        }),
      landmark: Joi.string().optional().allow('', null),
      instructions: Joi.string().optional().allow('', null)
    }).required(),
    deliveryDate: Joi.string().required()
      .messages({
        'any.required': 'Delivery date is required'
      }),
    deliveryTime: Joi.string().valid('morning', 'afternoon', 'evening', 'anytime').required()
      .messages({
        'any.required': 'Delivery time slot is required'
      }),
    deliveryNotes: Joi.string().optional().allow('', null),
    couponCode: Joi.string().optional().allow('', null), // <-- FIXED: Now allows null if no coupon applied
    paymentMethod: Joi.string().valid('cod', 'card', 'upi', 'wallet').default('cod'),
    totalAmount: Joi.number().min(0).optional() 
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Order status update validation
export const validateOrderStatusUpdate = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid(
      'pending-confirmation',
      'confirmed',
      'preparing',
      'ready',
      'out-for-delivery',
      'delivered',
      'cancelled'
    ).required(),
    note: Joi.string().max(500).optional().allow('', null)
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Coupon validation
export const validateCoupon = (data) => {
  const schema = Joi.object({
    code: Joi.string().min(3).max(20).required(),
    description: Joi.string().max(500).optional().allow('', null),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().min(0).required(),
    maxDiscount: Joi.number().min(0).optional().allow(null),
    minOrderAmount: Joi.number().min(0).default(0),
    usageLimit: Joi.number().integer().min(1).optional().allow(null),
    perUserLimit: Joi.number().integer().min(1).default(1),
    startDate: Joi.date().optional().allow(null),
    endDate: Joi.date().required(),
    applicableTo: Joi.string().valid('all', 'categories', 'products').default('all'),
    applicableCategories: Joi.array().items(Joi.string()).optional().allow(null),
    applicableProducts: Joi.array().items(Joi.string()).optional().allow(null)
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Cart item validation
export const validateCartItem = (data) => {
  const schema = Joi.object({
    productId: Joi.string().pattern(patterns.objectId).required(),
    quantity: Joi.number().integer().min(1).max(99).required(),
    variant: Joi.object().optional().allow(null)
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Format validation errors for response
export const formatValidationErrors = (error) => {
  if (!error || !error.details) {
    return ['Validation failed'];
  }
  
  return error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message
  }));
};

export default {
  validateRegistration,
  validateLogin,
  validateProduct,
  validateOrderCreate,
  validateOrderStatusUpdate,
  validateCoupon,
  validateCartItem,
  formatValidationErrors
};