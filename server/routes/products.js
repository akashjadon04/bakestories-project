/**
 * ============================================================================
 * PRODUCT ROUTES (FINAL PRODUCTION BUILD)
 * ============================================================================
 * Features:
 * - 📸 Multer Image Engine: Saves images to 'server/uploads'
 * - 🧠 Hybrid Middleware: Handles both File Uploads AND Image URLs
 * - 🛡️ Security: Protected by Auth & Admin Middleware
 * - ⚡ Optimized: ES Modules Syntax
 * ============================================================================
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// --- IMPORT CONTROLLERS & MIDDLEWARE ---
// Note: We use 'import * as' to ensure we get all functions even if they are named exports
import * as productController from '../controllers/productController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// --- 1. SETUP FILE UPLOADS (Multer) ---
// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to 'server/uploads/' (one level up from routes)
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    // Unique ID + Clean Filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

// Filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// --- 2. HYBRID IMAGE HANDLER (The Magic Middleware) ---
// This function checks if you sent a File or a URL and normalizes it
const handleImageUpload = (req, res, next) => {
  // Scenario A: User uploaded a file (Drag & Drop)
  if (req.file) {
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Inject into body so Controller sees it as a simple string
    req.body.image = fullUrl;
    req.body.primaryImage = { url: fullUrl };
    
    // Ensure 'images' array exists
    if (!req.body.images) req.body.images = [];
    req.body.images.push({ url: fullUrl });
  } 
  // Scenario B: User pasted a URL
  else if (req.body.image) {
    req.body.primaryImage = { url: req.body.image };
    if (!req.body.images) req.body.images = [];
    req.body.images.push({ url: req.body.image });
  }
  
  next();
};

// --- 3. PUBLIC ROUTES (Everyone can see these) ---
// GET /api/products
router.get('/', productController.getProducts);

// GET /api/products/featured/list
router.get('/featured/list', productController.getFeaturedProducts);

// GET /api/products/slug/:slug
router.get('/slug/:slug', productController.getProductBySlug);

// GET /api/products/:id
router.get('/:id', productController.getProduct);


// --- 4. ADMIN ROUTES (Protected) ---
// These require a valid Token + Admin Role

// POST /api/products (Create New)
router.post('/', 
  authenticate, 
  requireAdmin, 
  upload.single('image'), // 1. Catch file
  handleImageUpload,      // 2. Process file/url
  productController.createProduct // 3. Save to DB
);

// PUT /api/products/:id (Update)
router.put('/:id', 
  authenticate, 
  requireAdmin, 
  upload.single('image'), 
  handleImageUpload,
  productController.updateProduct
);

// DELETE /api/products/:id (Remove)
router.delete('/:id', 
  authenticate, 
  requireAdmin, 
  productController.deleteProduct
);

// POST /api/products/:id/reviews (Authenticated Users)
router.post('/:id/reviews', authenticate, productController.addReview);

export default router;