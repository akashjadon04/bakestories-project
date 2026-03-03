import express from 'express';
import { createOrder, getAllOrders } from '../controllers/orderController.js';

const router = express.Router();

// Route: POST /api/orders/create
router.post('/create', createOrder);

// Route: GET /api/orders/admin/all (NEW: Specifically for the Admin Dashboard)
router.get('/admin/all', getAllOrders);

// Route: GET /api/orders (For General Admin)
router.get('/', getAllOrders);

export default router;