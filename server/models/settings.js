/**
 * ============================================================================
 * SETTINGS MODEL (THE ADMIN CONTROL CENTER)
 * ============================================================================
 * This is the brain of your website. It controls:
 * 1. 🔔 Notifications (Where order emails go)
 * 2. 💳 Payment Gateways (Toggle COD/QR instantly)
 * 3. 🎨 Branding (Logo, Name, Colors)
 * 4. 🎟️ Features (Enable/Disable Coupons, Reviews)
 * ============================================================================
 */

import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // --- 1. NOTIFICATION CENTER ---
  // This is the "Master Email" where all order details are sent.
  notificationEmail: {
    type: String,
    required: [true, 'Admin notification email is required'],
    default: 'mk074377@gmail.com', // Your default fallback
    trim: true,
    lowercase: true
  },

  // --- 2. PAYMENT CONTROLS ---
  // You can turn these on/off from the Admin Panel instantly.
  payment: {
    cod: {
      enabled: { type: Boolean, default: true },
      label: { type: String, default: 'Cash on Delivery' }
    },
    upiQr: {
      enabled: { type: Boolean, default: true },
      qrImage: { type: String, default: '' }, // URL to your QR Code image
      upiId: { type: String, default: '' },   // e.g., your-shop@upi
      instructions: { type: String, default: 'Scan to pay via GPay / PhonePe / Paytm' }
    }
  },

  // --- 3. BRANDING & APPEARANCE ---
  // Control your site's identity without touching code.
  branding: {
    siteName: { type: String, default: 'The Bake Stories' },
    logoUrl: { type: String, default: '' }, // Admin can upload a new logo here
    faviconUrl: { type: String, default: '' },
    footerText: { type: String, default: 'Crafting moments of sweetness, one bake at a time.' }
  },

  // --- 4. STORE FEATURES ---
  // Toggle features on/off.
  features: {
    enableCoupons: { type: Boolean, default: true }, // Master switch for coupons
    enableReviews: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 5 } // Triggers the "Only X Left!" badge
  },

  // --- 5. SOCIAL MEDIA (For Footer & Contact) ---
  socials: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    whatsapp: { type: String, default: '' } // For the WhatsApp button on product page
  },

  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // Automatically tracks createdAt and updatedAt
});

// Singleton Helper: We usually only want ONE settings document for the whole site.
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings;