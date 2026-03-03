/**
 * Coupon Model
 * generated: models/Coupon.js — Discount coupon schema
 */

import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  // Basic Info
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Discount Type
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount cannot be negative']
  },
  
  // Limits
  maxDiscount: {
    type: Number,
    default: null // null means no maximum
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  
  // Usage Limits
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  
  // Validity
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Applicability
  applicableTo: {
    type: String,
    enum: ['all', 'categories', 'products'],
    default: 'all'
  },
  applicableCategories: [{
    type: String,
    enum: ['cakes', 'cupcakes', 'cookies', 'pastries', 'bread', 'brownies', 'custom', 'seasonal']
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Usage Log
  usageLog: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    discountAmount: Number,
    usedAt: { type: Date, default: Date.now }
  }]
  
}, {
  timestamps: true
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ endDate: 1 });

// Virtual for is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual for is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate &&
         (this.usageLimit === null || this.usageCount < this.usageLimit);
});

// Method to check if coupon can be used by a user
couponSchema.methods.canBeUsedBy = function(userId) {
  if (!this.isValid) return false;
  
  // Check per-user limit
  const userUsageCount = this.usageLog.filter(
    log => log.user && log.user.toString() === userId.toString()
  ).length;
  
  return userUsageCount < this.perUserLimit;
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  if (orderAmount < this.minOrderAmount) {
    return 0;
  }
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }
  
  // Apply maximum discount limit if set
  if (this.maxDiscount !== null && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }
  
  return Math.round(discount);
};

// Method to record usage
couponSchema.methods.recordUsage = function(userId, orderId, discountAmount) {
  this.usageCount += 1;
  this.usageLog.push({
    user: userId,
    order: orderId,
    discountAmount
  });
  return this.save();
};

// Static method to find valid coupon by code
couponSchema.statics.findValid = function(code) {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
    ]
  });
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
