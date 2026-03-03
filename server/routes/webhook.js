/**
 * Webhook Routes
 * generated: routes/webhook.js — External webhook endpoints
 */

import express from 'express';
import {
  twilioSmsStatus,
  handleCallRequest,
  webhookHealth
} from '../controllers/webhookController.js';

const router = express.Router();

// Health check
router.get('/health', webhookHealth);

// Twilio webhooks
router.post('/twilio/sms-status', twilioSmsStatus);

// Call request webhook (can be called from frontend)
router.post('/call-request', handleCallRequest);

export default router;
