/**
 * Notification Service Configuration
 * generated: config/notifications.js — Twilio & SendGrid wrappers
 * 
 * This module provides unified notification capabilities:
 * - SMS via Twilio
 * - WhatsApp via Twilio
 * - Email via SendGrid
 * 
 * All notifications are optional - the app works without them.
 */

import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

// ============================================
// TWILIO CONFIGURATION
// ============================================

let twilioClient = null;
let twilioConfigured = false;

const configureTwilio = () => {
  const sid = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phone = process.env.TWILIO_PHONE;
  
  if (sid && authToken && phone) {
    try {
      twilioClient = twilio(sid, authToken);
      twilioConfigured = true;
      console.log('✅ Twilio configured for SMS/WhatsApp');
      return true;
    } catch (error) {
      console.error('❌ Twilio configuration error:', error.message);
      return false;
    }
  } else {
    console.warn('⚠️  Twilio not configured. SMS/WhatsApp notifications disabled.');
    console.warn('   Set TWILIO_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE in .env');
    return false;
  }
};

// ============================================
// SENDGRID CONFIGURATION
// ============================================

let sendgridConfigured = false;

const configureSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (apiKey) {
    try {
      sgMail.setApiKey(apiKey);
      sendgridConfigured = true;
      console.log('✅ SendGrid configured for email');
      return true;
    } catch (error) {
      console.error('❌ SendGrid configuration error:', error.message);
      return false;
    }
  } else {
    console.warn('⚠️  SendGrid not configured. Email notifications disabled.');
    console.warn('   Set SENDGRID_API_KEY in .env');
    return false;
  }
};

// ============================================
// SMS NOTIFICATIONS
// ============================================

/**
 * Send SMS to a phone number
 * @param {string} to - Phone number in E.164 format (+1234567890)
 * @param {string} body - Message body
 * @returns {Promise<Object>} - Result of the send operation
 */
export const sendSMS = async (to, body) => {
  if (!twilioConfigured || !twilioClient) {
    return {
      success: false,
      error: 'Twilio not configured',
      simulated: true
    };
  }
  
  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE,
      to
    });
    
    return {
      success: true,
      sid: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send WhatsApp message
 * @param {string} to - Phone number in E.164 format
 * @param {string} body - Message body
 * @returns {Promise<Object>} - Result of the send operation
 */
export const sendWhatsApp = async (to, body) => {
  if (!twilioConfigured || !twilioClient) {
    return {
      success: false,
      error: 'Twilio not configured',
      simulated: true
    };
  }
  
  try {
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE;
    const message = await twilioClient.messages.create({
      body,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${to}`
    });
    
    return {
      success: true,
      sid: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

/**
 * Send email via SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise<Object>} - Result of the send operation
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (!sendgridConfigured) {
    return {
      success: false,
      error: 'SendGrid not configured',
      simulated: true
    };
  }
  
  try {
    const msg = {
      to,
      from: {
        email: process.env.EMAIL_FROM || 'orders@thebakestories.example',
        name: process.env.EMAIL_FROM_NAME || 'The Bake Stories'
      },
      subject,
      text,
      html: html || text
    };
    
    await sgMail.send(msg);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// ORDER-SPECIFIC NOTIFICATIONS
// ============================================

/**
 * Send "Call to Confirm" notification to bakery
 * @param {Object} order - Order object
 * @returns {Promise<Object>} - Results of all notification attempts
 */
export const notifyBakeryNewOrder = async (order) => {
  const bakeryPhone = process.env.BAKERY_PHONE;
  const bakeryEmail = process.env.BAKERY_EMAIL;
  
  const results = {
    sms: null,
    whatsapp: null,
    email: null
  };
  
  // Prepare message
  const message = `🧁 NEW ORDER #${order._id.toString().slice(-6).toUpperCase()}\n` +
    `Customer: ${order.customerName}\n` +
    `Phone: ${order.customerPhone}\n` +
    `Total: ₹${order.totalAmount}\n` +
    `Delivery: ${order.deliveryDate} ${order.deliveryTime}\n\n` +
    `CALL TO CONFIRM: Please call customer to confirm order.`;
  
  // Send SMS to bakery
  if (bakeryPhone) {
    results.sms = await sendSMS(bakeryPhone, message);
  }
  
  // Send WhatsApp to bakery
  if (bakeryPhone) {
    results.whatsapp = await sendWhatsApp(bakeryPhone, message);
  }
  
  // Send email to bakery
  if (bakeryEmail) {
    results.email = await sendEmail({
      to: bakeryEmail,
      subject: `New Order #${order._id.toString().slice(-6).toUpperCase()} - Call to Confirm`,
      text: message,
      html: `
        <h2>🧁 New Order Received</h2>
        <p><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>
        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
        <p><strong>Delivery:</strong> ${order.deliveryDate} ${order.deliveryTime}</p>
        <hr>
        <p style="color: #ff7aa2; font-weight: bold;">CALL TO CONFIRM</p>
        <p>Please call the customer to confirm this order.</p>
      `
    });
  }
  
  return results;
};

/**
 * Send order confirmation to customer
 * @param {Object} order - Order object
 * @returns {Promise<Object>} - Results of notification attempts
 */
export const notifyCustomerOrderReceived = async (order) => {
  const results = {
    sms: null,
    email: null
  };
  
  const message = `🧁 Hi ${order.customerName}! Your order #${order._id.toString().slice(-6).toUpperCase()} ` +
    `for ₹${order.totalAmount} has been received. ` +
    `We'll call you within ${process.env.CALL_CONFIRM_HOURS || 24} hours to confirm. ` +
    `Thank you for choosing The Bake Stories!`;
  
  // Send SMS to customer
  if (order.customerPhone) {
    results.sms = await sendSMS(order.customerPhone, message);
  }
  
  // Send email to customer
  if (order.customerEmail) {
    results.email = await sendEmail({
      to: order.customerEmail,
      subject: `Order Received - #${order._id.toString().slice(-6).toUpperCase()}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff7aa2;">🧁 Order Received!</h2>
          <p>Hi ${order.customerName},</p>
          <p>Thank you for your order! We've received it and will call you within ${process.env.CALL_CONFIRM_HOURS || 24} hours to confirm.</p>
          <div style="background: #fff5f8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
            <p><strong>Total:</strong> ₹${order.totalAmount}</p>
            <p><strong>Delivery Date:</strong> ${order.deliveryDate}</p>
            <p><strong>Delivery Time:</strong> ${order.deliveryTime}</p>
          </div>
          <p>Questions? Call us at ${process.env.BAKERY_PHONE || 'our store'}.</p>
          <p style="color: #ff7aa2;">With love,<br>The Bake Stories Team</p>
        </div>
      `
    });
  }
  
  return results;
};

/**
 * Send order confirmed notification to customer
 * @param {Object} order - Order object
 * @returns {Promise<Object>} - Results of notification attempts
 */
export const notifyCustomerOrderConfirmed = async (order) => {
  const results = {
    sms: null,
    email: null
  };
  
  const message = `🧁 Great news ${order.customerName}! Your order #${order._id.toString().slice(-6).toUpperCase()} ` +
    `has been confirmed and is being prepared. ` +
    `Delivery scheduled for ${order.deliveryDate} ${order.deliveryTime}. ` +
    `Thank you for choosing The Bake Stories!`;
  
  // Send SMS to customer
  if (order.customerPhone) {
    results.sms = await sendSMS(order.customerPhone, message);
  }
  
  // Send email to customer
  if (order.customerEmail) {
    results.email = await sendEmail({
      to: order.customerEmail,
      subject: `Order Confirmed - #${order._id.toString().slice(-6).toUpperCase()}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff7aa2;">🧁 Order Confirmed!</h2>
          <p>Hi ${order.customerName},</p>
          <p>Great news! Your order has been confirmed and our bakers are getting started.</p>
          <div style="background: #fff5f8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
            <p><strong>Status:</strong> Confirmed ✓</p>
            <p><strong>Delivery:</strong> ${order.deliveryDate} ${order.deliveryTime}</p>
          </div>
          <p>We'll notify you when your order is out for delivery.</p>
          <p style="color: #ff7aa2;">Baking with love,<br>The Bake Stories Team</p>
        </div>
      `
    });
  }
  
  return results;
};

// ============================================
// INITIALIZATION
// ============================================

const twilioReady = configureTwilio();
const sendgridReady = configureSendGrid();

export const notificationStatus = {
  twilio: twilioReady,
  sendgrid: sendgridReady,
  smsEnabled: twilioReady,
  emailEnabled: sendgridReady
};

export default {
  sendSMS,
  sendWhatsApp,
  sendEmail,
  notifyBakeryNewOrder,
  notifyCustomerOrderReceived,
  notifyCustomerOrderConfirmed,
  notificationStatus
};
