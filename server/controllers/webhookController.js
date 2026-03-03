/**
 * Webhook Controller
 * generated: controllers/webhookController.js — Handles external webhooks
 * 
 * Currently supports:
 * - Twilio SMS status callbacks
 * - Call request notifications
 */

import Order from '../models/Order.js';

/**
 * Twilio SMS status callback
 * POST /api/webhook/twilio/sms-status
 */
export const twilioSmsStatus = async (req, res, next) => {
  try {
    const { MessageSid, MessageStatus, To } = req.body;
    
    console.log('Twilio SMS Status:', {
      sid: MessageSid,
      status: MessageStatus,
      to: To,
      timestamp: new Date().toISOString()
    });
    
    // Log the status for debugging
    // In production, you might want to update order notification status
    
    res.status(200).send('OK');
    
  } catch (error) {
    // Always return 200 to Twilio to prevent retries
    console.error('Twilio webhook error:', error);
    res.status(200).send('OK');
  }
};

/**
 * Handle call request from customer
 * POST /api/webhook/call-request
 */
export const handleCallRequest = async (req, res, next) => {
  try {
    const { orderId, phone, urgent } = req.body;
    
    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and phone number required'
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Verify phone matches
    if (order.customerPhone !== phone) {
      return res.status(403).json({
        success: false,
        message: 'Phone number does not match order'
      });
    }
    
    // Update order with call request
    await order.requestCall();
    
    // Log for admin notification
    console.log('🔔 CALL REQUEST:', {
      orderId: order.orderNumber,
      customer: order.customerName,
      phone: order.customerPhone,
      urgent: urgent || false,
      timestamp: new Date().toISOString()
    });
    
    // If Twilio is configured, could send SMS to bakery here
    // notifyBakeryNewOrder(order).catch(console.error);
    
    res.json({
      success: true,
      message: urgent 
        ? 'Urgent call request sent. We will call you within 30 minutes.'
        : 'Call request sent. We will call you soon.',
      data: {
        requestedAt: order.callConfirmation.callRequestedAt
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Health check for webhooks
 * GET /api/webhook/health
 */
export const webhookHealth = async (req, res, next) => {
  res.json({
    success: true,
    data: {
      status: 'active',
      endpoints: [
        '/api/webhook/twilio/sms-status',
        '/api/webhook/call-request'
      ]
    }
  });
};
