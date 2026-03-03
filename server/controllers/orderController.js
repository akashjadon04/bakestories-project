/**
 * Order Controller (HARDENED, LOCAL-COMPATIBLE)
 * controllers/orderController.js — COD + call-to-confirm flow
 *
 * Changes:
 * - REMOVED: Transactions (Fixed "Failed to place order" error on local DB)
 * - ADDED: FormSubmit Email System (No Password Required)
 * - KEPT: All Stock, Coupon, and Validation logic intact
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js'; // Added for Admin Control
import { validateOrderCreate, formatValidationErrors } from '../utils/validate.js';
import {
  notifyBakeryNewOrder,
  notifyCustomerOrderReceived,
  notifyCustomerOrderConfirmed
} from '../config/notifications.js';

const IDEMPOTENCY_TTL_MINUTES = 30;

// ============================================
// EMAIL LOGIC (FORM SUBMIT - NO PASSWORD)
// ============================================
const sendOrderEmail = async (order) => {
  try {
    // 1. Get Admin Email (Dynamic from Settings)
    const settings = await Settings.findOne();
    const adminEmail = settings?.notificationEmail || 'mk074377@gmail.com';

    // 2. Format Items
    const itemsList = order.items.map(item => 
      `- ${item.name} (x${item.quantity}) = ₹${item.price}`
    ).join('\n');

    // 3. Prepare Data
    const emailData = {
      _subject: `🍰 New Order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}`,
      _template: "table", 
      "Customer Name": order.customerName,
      "Phone Number": order.customerPhone,
      "Total Amount": `₹${order.totalAmount}`,
      "Payment Method": order.paymentMethod.toUpperCase(),
      "Address": `${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`,
      "Order Items": itemsList,
      "Admin Link": `http://localhost:3000/admin.html`
    };

    // 4. Send (Using Fetch - Standard in Node v18+)
    await fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
    });

    console.log(`📧 Email sent to ${adminEmail} via FormSubmit`);

  } catch (err) {
    console.error("Email Sending Failed:", err);
  }
};

/**
 * Create new order (COD Flow)
 * POST /api/orders/create
 */
export const createOrder = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'] || null;

  try {
    // Validate input
    const { error } = validateOrderCreate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(error)
      });
    }

    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      alternatePhone,
      deliveryAddress,
      deliveryDate,
      deliveryTime,
      deliveryNotes,
      couponCode,
      paymentMethod = 'cod'
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items required' });
    }

    // Idempotency: if key provided and an order exists with same key, return it (safe retry)
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey }).lean();
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Order already processed (idempotency key)',
          data: { order: existing }
        });
      }
    }

    let subtotal = 0;
    const orderItems = [];
    let appliedCoupon = null;
    let discount = 0;

    // --- LOGIC START (No Transaction Wrapper) ---
    
    // For each item, reserve/decrement stock
    for (const item of items) {
      // Basic item sanity checks
      if (!item.product || !item.quantity || item.quantity <= 0) {
        throw { statusCode: 400, message: 'Invalid cart item format' };
      }

      // Decrement stock only if enough quantity available
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, stockQuantity: { $gte: Number(item.quantity) } },
        { $inc: { stockQuantity: -Number(item.quantity) } },
        { new: true }
      ).lean();

      if (!updatedProduct) {
        throw { statusCode: 400, message: `Insufficient stock for product ${item.product}` };
      }

      // If stock becomes 0, also set inStock = false
      if (updatedProduct.stockQuantity <= 0) {
        await Product.updateOne({ _id: updatedProduct._id }, { $set: { inStock: false } });
      }

      const itemPrice = item.variant?.price || updatedProduct.price || 0;
      const itemTotal = Number(itemPrice) * Number(item.quantity);
      subtotal += itemTotal;

      orderItems.push({
        product: updatedProduct._id,
        name: updatedProduct.name,
        variant: item.variant || null,
        quantity: Number(item.quantity),
        price: Number(itemPrice),
        image: updatedProduct.images?.length ? updatedProduct.images.find(i => i.isPrimary)?.url || updatedProduct.images[0].url : '',
        customization: item.customization || null
      });
    }

    // Validate coupon
    if (couponCode) {
      const coupon = await Coupon.findValid(couponCode);
      if (coupon) {
        if (subtotal >= (coupon.minOrderAmount || 0)) {
          discount = coupon.calculateDiscount(subtotal);
          appliedCoupon = coupon;
          // Reserve coupon usage
          if (coupon.usageLimit) {
            const updated = await Coupon.findOneAndUpdate(
              { _id: coupon._id, uses: { $lt: coupon.usageLimit }, isActive: true },
              { $inc: { uses: 1 } },
              { new: true }
            ).lean();
            if (!updated && coupon.usageLimit) {
              throw { statusCode: 400, message: 'Coupon usage limit reached' };
            }
          } else {
            await Coupon.updateOne({ _id: coupon._id }, { $inc: { uses: 1 } });
          }
        } else {
          appliedCoupon = null;
          discount = 0;
        }
      } else {
        appliedCoupon = null;
        discount = 0;
      }
    }

    // Delivery charge rule
    const deliveryCharge = subtotal >= 500 ? 0 : 50;

    const totalAmount = Number((subtotal + deliveryCharge - discount).toFixed(2));

    // Build order doc
    const orderDoc = {
      user: req.user?._id || null,
      customerName,
      customerEmail: customerEmail || null,
      customerPhone,
      alternatePhone: alternatePhone || null,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      deliveryCharge,
      discount: Number(discount.toFixed(2)),
      couponCode: appliedCoupon?.code || null,
      totalAmount,
      deliveryAddress: deliveryAddress || null,
      deliveryDate: deliveryDate || null,
      deliveryTime: deliveryTime || null,
      deliveryNotes: deliveryNotes || null,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      status: 'pending-confirmation',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      idempotencyKey: idempotencyKey || null,
      notifications: {
        bakerySmsSent: false,
        bakeryEmailSent: false,
        customerSmsSent: false,
        customerEmailSent: false
      }
    };

    // Create order
    const createdOrder = await Order.create(orderDoc);
    
    if (!createdOrder) throw { statusCode: 500, message: 'Failed to create order' };

    // --- NOTIFICATIONS (Non-Blocking) ---
    
    const notificationPromises = [];
    
    // 1. Send Email via FormSubmit
    notificationPromises.push(
        sendOrderEmail(createdOrder).catch(err => console.error("Email fail:", err))
    );

    notificationPromises.push(
      notifyBakeryNewOrder(createdOrder).then(results => {
        Order.updateOne({ _id: createdOrder._id }, {
          $set: {
            'notifications.bakerySmsSent': results.sms?.success || false,
            'notifications.bakeryEmailSent': results.email?.success || false
          }
        }).catch(() => {});
      }).catch(() => {})
    );

    notificationPromises.push(
      notifyCustomerOrderReceived(createdOrder).then(results => {
        Order.updateOne({ _id: createdOrder._id }, {
          $set: {
            'notifications.customerSmsSent': results.sms?.success || false,
            'notifications.customerEmailSent': results.email?.success || false
          }
        }).catch(() => {});
      }).catch(() => {})
    );

    Promise.allSettled(notificationPromises).catch(() => {});

    // Response
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: {
          id: createdOrder._id,
          orderNumber: createdOrder.orderNumber,
          status: createdOrder.status,
          statusDisplay: createdOrder.statusDisplay,
          totalAmount: createdOrder.totalAmount,
          customerPhone: createdOrder.customerPhone,
          deliveryDate: createdOrder.deliveryDate,
          deliveryTime: createdOrder.deliveryTime
        },
        nextSteps: {
          message: 'Our bakery will call you within 24 hours to confirm your order.',
          bakeryPhone: process.env.BAKERY_PHONE,
          canRequestCall: true
        }
      }
    });

  } catch (error) {
    if (error.statusCode && error.message) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate('items.product', 'name slug').lean();

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Authorization: admin OR owner OR matching phone query param
    const isAuthorized =
      req.user?.isAdmin ||
      (req.user && order.user && order.user.toString() === req.user._id.toString()) ||
      (req.query.phone && order.customerPhone === String(req.query.phone));

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

/**
 * Track order by number and phone
 * GET /api/orders/track/:orderNumber
 */
export const trackOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { phone } = req.query;

    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required for tracking' });

    const order = await Order.trackOrder(orderNumber, phone);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found. Please check your order number and phone number.' });

    res.json({
      success: true,
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          statusDisplay: order.statusDisplay,
          timeline: order.timeline,
          totalAmount: order.totalAmount,
          deliveryDate: order.deliveryDate,
          deliveryTime: order.deliveryTime,
          deliveryAddress: order.deliveryAddress,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 * GET /api/orders/user/orders
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('orderNumber status totalAmount createdAt deliveryDate items')
        .lean(),
      Order.countDocuments({ user: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        orders,
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

/**
 * Request call from bakery (customer initiated)
 * POST /api/orders/:id/request-call
 */
export const requestCall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending-confirmation') return res.status(400).json({ success: false, message: 'Call can only be requested for pending orders' });

    await order.requestCall(); // assume method handles timestamping and saving

    // Notify bakery (best effort)
    notifyBakeryNewOrder(order).catch(console.error);

    res.json({ success: true, message: 'Call request sent. Our bakery will contact you shortly.', data: { requestedAt: order.callConfirmation?.callRequestedAt || new Date() } });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order (customer)
 * POST /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Authorization
    const isAuthorized =
      req.user?.isAdmin ||
      (req.user && order.user && order.user.toString() === req.user._id.toString()) ||
      (req.body.phone && order.customerPhone === String(req.body.phone));
    if (!isAuthorized) return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });

    // Only allow cancellation for allowed statuses
    const cancellableStatuses = ['pending-confirmation', 'confirmed', 'preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    await order.cancelOrder(reason || 'Cancelled by customer', 'customer');

    res.json({ success: true, message: 'Order cancelled successfully', data: { order } });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply coupon to cart (validation only)
 * POST /api/orders/validate-coupon
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findValid(code);
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });

    if (Number(cartTotal) < (coupon.minOrderAmount || 0)) {
      return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minOrderAmount} required` });
    }

    const discount = coupon.calculateDiscount(Number(cartTotal));
    res.json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
        newTotal: Number((cartTotal - discount).toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   ADMIN ORDER OPERATIONS
   ========================= */

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: String(search), $options: 'i' } },
        { customerName: { $regex: String(search), $options: 'i' } },
        { customerPhone: { $regex: String(search), $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select('-items.customization').lean(),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, data: { orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
  } catch (error) {
    next(error);
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending-confirmation') return res.status(400).json({ success: false, message: 'Order is not awaiting confirmation' });

    await order.confirmOrder(req.user?.name || 'Admin', notes);

    // best-effort notify customer
    notifyCustomerOrderConfirmed(order).catch(console.error);

    res.json({ success: true, message: 'Order confirmed successfully', data: { order } });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await order.updateStatus(status, note, req.user?.name || 'Admin');
    res.json({ success: true, message: 'Order status updated', data: { order } });
  } catch (error) {
    next(error);
  }
};

export const getPendingConfirmationOrders = async (req, res, next) => {
  try {
    const orders = await Order.getPendingConfirmation();
    res.json({ success: true, data: { orders, count: orders.length } });
  } catch (error) {
    next(error);
  }
};

export const getOrderStatistics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [statusCounts, todayStats, totalRevenueAgg] = await Promise.all([
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { status: { $nin: ['cancelled', 'refunded'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }])
    ]);

    res.json({
      success: true,
      data: {
        statusCounts: statusCounts.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
        today: { orders: todayStats[0]?.count || 0, revenue: todayStats[0]?.revenue || 0 },
        totalRevenue: totalRevenueAgg[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};