/**
 * ============================================================================
 * PRODUCT MODEL (FINAL PRODUCTION BUILD)
 * ============================================================================
 * Features:
 * - 🐌 Auto-Slug Generation (SEO Friendly URLs)
 * - 🖼️ Hybrid Image Support (Matches Admin Panel Uploads)
 * - ⚡ Optimized Indexing (Faster Search)
 * ============================================================================
 */

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // --- 1. Basic Details ---
  name: { 
    type: String, 
    required: [true, 'Please enter product name'], 
    trim: true,
    maxLength: [100, 'Product name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Please enter product description'],
  },
  
  // --- 2. Pricing & Stock ---
  price: {
    type: Number,
    required: [true, 'Please enter product price'],
    max: [99999999, 'Price cannot exceed 8 digits'], 
    default: 0.0
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Please enter product stock'],
    max: [99999, 'Stock cannot exceed 5 digits'], 
    default: 0
  },

  // --- 3. Categorization ---
  category: {
    type: String,
    required: [true, 'Please select category for this product'],
    enum: {
      values: [
        'cakes',
        'cupcakes',
        'cookies',
        'pastries',
        'brownies',
        'custom',
        'bread',     // Added to match Controller
        'seasonal'   // Added to match Controller
      ],
      message: 'Please select correct category for product'
    },
    lowercase: true
  },
  
  // --- 4. Status Flags ---
  isActive: {         // <--- ADDED: Critical for products to show up!
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  ratings: {
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },

  // --- 4.5 Extra Metadata (Matches Controller Logic) ---
  tags: [String],     // <--- ADDED: Required for Search to work
  dietary: {         // <--- ADDED: Required for Filters to work
    isVegetarian: { type: Boolean, default: true },
    isEggless: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false }
  },
  
  // --- 5. Image System (Matches Route Logic) ---
  images: [
    {
      public_id: {
        type: String,
        required: false
      },
      url: {
        type: String,
        required: true
      },
      isPrimary: {
        type: Boolean,
        default: false
      }
    }
  ],
  
  // --- 6. Reviews Array ---
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true
      },
      comment: {
        type: String,
        required: true
      }
    }
  ],
  
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable Virtuals for JSON output
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS ---
// Helper to get the main image easily
productSchema.virtual('primaryImage').get(function() {
  if (this.images && this.images.length > 0) {
    // Return the one marked primary, or the first one
    return this.images.find(img => img.isPrimary) || this.images[0];
  }
  return { url: 'https://placehold.co/600' }; // Fallback
});

// --- MIDDLEWARE ---
// Auto-generate slug before saving
productSchema.pre('save', function(next) {
  // Only generate if name changed or slug is missing
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with dashes
      .replace(/-+/g, '-')        // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '');     // Trim dashes from start/end
  }
  next();
});

// Prevent Model Overwrite Error
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;