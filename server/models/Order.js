/**
 * Order Model
 * generated: models/Order.js — Order schema with COD + call-to-confirm flow
 */

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  variant: {
    name: String,
    price: Number
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  image: String,
  customization: {
    message: String,
    options: [{
      name: String,
      value: String,
      price: Number
    }]
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true
  },
  
  // User (optional for guest checkout)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Customer Info
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  },
  customerPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  
  // Items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    uppercase: true,
    trim: true
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Delivery Address
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
    instructions: String
  },
  
  // Delivery Schedule
  deliveryDate: {
    type: String,
    required: [true, 'Delivery date is required']
  },
  deliveryTime: {
    type: String,
    required: [true, 'Delivery time is required'],
    enum: {
      values: ['morning', 'afternoon', 'evening', 'anytime'],
      message: 'Please select a valid delivery time slot'
    }
  },
  deliveryNotes: String,
  
  // Payment
  paymentMethod: {
    type: String,
    required: true,
    enum: {
      values: ['cod', 'card', 'upi', 'wallet'],
      message: 'Please select a valid payment method'
    },
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Order Status (COD Flow)
  status: {
    type: String,
    enum: {
      values: [
        'pending-confirmation',  // Initial COD status - awaiting bakery call
        'confirmed',             // Bakery confirmed via call
        'preparing',             // Order being prepared
        'ready',                 // Order ready for delivery/pickup
        'out-for-delivery',      // Out for delivery
        'delivered',             // Successfully delivered
        'cancelled',             // Cancelled by customer or bakery
        'refunded'               // Refunded after cancellation
      ],
      message: 'Please select a valid order status'
    },
    default: 'pending-confirmation'
  },
  
  // Call-to-Confirm Tracking
  callConfirmation: {
    callRequestedAt: Date,
    callCompletedAt: Date,
    calledBy: String, // admin user who made the call
    notes: String,
    customerConfirmed: {
      type: Boolean,
      default: false
    }
  },
  
  // Notifications Sent
  notifications: {
    customerSmsSent: { type: Boolean, default: false },
    customerEmailSent: { type: Boolean, default: false },
    bakerySmsSent: { type: Boolean, default: false },
    bakeryEmailSent: { type: Boolean, default: false }
  },
  
  // Timeline
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: String
  }],
  
  // Cancellation
  cancellation: {
    reason: String,
    cancelledAt: Date,
    cancelledBy: String // 'customer' or 'admin'
  },
  
  // Admin Notes
  adminNotes: String,
  
  // IP Address (for fraud detection)
  ipAddress: String,
  
  // User Agent
  userAgent: String
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ 'customerEmail': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const prefix = 'BS';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `${prefix}${dateStr}${random}`;
  }
  
  // Add initial timeline entry
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order placed successfully'
    });
  }
  
  next();
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for formatted status
orderSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending-confirmation': 'Awaiting Confirmation',
    'confirmed': 'Confirmed',
    'preparing': 'Being Prepared',
    'ready': 'Ready',
    'out-for-delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  };
  return statusMap[this.status] || this.status;
});

// Method to update status with timeline
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = 'system') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Status changed from ${oldStatus} to ${newStatus}`,
    updatedBy
  });
  
  return this.save();
};

// Method to confirm order (after bakery call)
orderSchema.methods.confirmOrder = function(confirmedBy, notes = '') {
  this.status = 'confirmed';
  this.callConfirmation.callCompletedAt = new Date();
  this.callConfirmation.calledBy = confirmedBy;
  this.callConfirmation.notes = notes;
  this.callConfirmation.customerConfirmed = true;
  
  this.timeline.push({
    status: 'confirmed',
    timestamp: new Date(),
    note: `Order confirmed by bakery call. ${notes}`,
    updatedBy: confirmedBy
  });
  
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledAt: new Date(),
    cancelledBy
  };
  
  this.timeline.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: `Order cancelled. Reason: ${reason}`,
    updatedBy: cancelledBy
  });
  
  return this.save();
};

// Method to request call (customer initiated)
orderSchema.methods.requestCall = function() {
  this.callConfirmation.callRequestedAt = new Date();
  
  this.timeline.push({
    status: this.status,
    timestamp: new Date(),
    note: 'Customer requested immediate call',
    updatedBy: 'customer'
  });
  
  return this.save();
};

// Static method to get orders by status
orderSchema.statics.getByStatus = function(status, limit = 50) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('items.product', 'name images');
};

// Static method to get pending confirmation orders
orderSchema.statics.getPendingConfirmation = function() {
  return this.find({ status: 'pending-confirmation' })
    .sort({ createdAt: 1 })
    .populate('items.product', 'name images');
};

// Static method to track order by number and phone
orderSchema.statics.trackOrder = function(orderNumber, phone) {
  return this.findOne({
    orderNumber,
    customerPhone: phone
  }).populate('items.product', 'name images');
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
