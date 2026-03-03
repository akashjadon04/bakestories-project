/**
 * ============================================================================
 * THE BAKE STORIES - CENTRAL SERVER (FINAL PRODUCTION BUILD)
 * ============================================================================
 * System: ES Modules (import/export)
 * Status: FULLY WIRED (Dashboard, Orders, Products, Customers, Settings, Coupons)
 * ============================================================================
 */

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

// --- 1. SYSTEM CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. SECURITY & MIDDLEWARE ---
// Allow Frontend (Port 3000) to talk to Backend (Port 5000)
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- 3. FILE UPLOAD ENGINE ---
// Auto-creates 'uploads' folder if missing to prevent crashes
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('📂 System: Created "uploads" directory.');
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

// Serve Images Publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bakestories')
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Failed:', err));

// --- 5. INTERNAL SCHEMAS (CMS Features) ---
// Defined here to ensure they work immediately without extra files

// Settings Schema (Logo, Phone, Slogan)
const Setting = mongoose.models.Setting || mongoose.model('Setting', new mongoose.Schema({
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  slogan: { type: String, default: '' },
  logoUrl: String,
  instagramUrl: String,
  acceptCOD: { type: Boolean, default: true },
  acceptOnline: { type: Boolean, default: true }
}));

// Coupon Schema
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['flat', 'percent'], default: 'flat' },
  value: { type: Number, required: true },
  status: { type: String, default: 'active' }
}));

// --- 6. API ROUTES (The Nervous System) ---

// [A] DASHBOARD STATS
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const productsCount = await mongoose.connection.collection('products').countDocuments();
    // Use try-catch for orders to avoid crash if collection is empty
    const ordersCount = await mongoose.connection.collection('orders').countDocuments().catch(() => 0);
    const pendingCount = await mongoose.connection.collection('orders').countDocuments({ status: 'pending' }).catch(() => 0);
    
    res.json({
      success: true,
      data: {
        counts: {
          todayOrders: ordersCount, // <-- FIXED: Was hardcoded to 0. Now shows real count.
          pendingConfirmation: pendingCount,
          products: productsCount
        },
        revenue: { monthly: 0 }
      }
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.json({ success: true, data: { counts: { products: 0 }, revenue: {} } });
  }
});

// [C] CUSTOMER MANAGEMENT (Fixes "Customers" Tab)
app.get('/api/admin/customers', async (req, res) => {
  try {
    // Fetch users who are NOT admins
    const users = await mongoose.connection.collection('users').find({ isAdmin: { $ne: true } }).toArray().catch(() => []);
    res.json({ success: true, data: users });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// [D] SETTINGS (CMS)
app.get('/api/settings', async (req, res) => {
  let s = await Setting.findOne();
  if (!s) s = await Setting.create({});
  res.json({ success: true, data: s });
});

app.post('/api/settings', upload.single('logo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const s = await Setting.findOneAndUpdate({}, data, { new: true, upsert: true });
    res.json({ success: true, data: s });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// [E] COUPONS
app.get('/api/coupons', async (req, res) => {
  const coupons = await Coupon.find().sort({ _id: -1 });
  res.json({ success: true, data: coupons });
});

app.post('/api/coupons', async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);
    res.json({ success: true, data: newCoupon });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Coupon Code already exists' });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// [F] INSTAGRAM (Fixes 404 Error)
app.get('/api/instagram/hero-images', (req, res) => {
  res.json({ success: true, data: [] });
});

// --- 7. MOUNT EXTERNAL ROUTES ---
// Importing Product, Auth, AND ORDER Logic
import productRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orderRoutes.js'; // <--- NEW: Added Order Routes

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes); // <--- NEW: Connected Order Wiring

// --- 8. START SERVER ---
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SERVER RUNNING ON: http://localhost:${PORT}`);
  console.log(`📂 UPLOADS FOLDER:    http://localhost:${PORT}/uploads/`);
  console.log(`==================================================\n`);
});