import { Router } from 'express';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import {
  checkoutPreview,
  createOrder,
  getMyOrders,
  getMyOrderDetails,
  getAdminOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

// Checkout pre-sale validation queries
router.post('/checkout/preview', requireAuth, checkoutPreview);

// Customer endpoints
router.post('/orders', requireAuth, createOrder);
router.get('/orders', requireAuth, getMyOrders);
router.get('/orders/:id', requireAuth, getMyOrderDetails);

// Admin dashboard endpoints
router.get('/admin/orders', requireAuth, authorize('admin'), getAdminOrders);
router.put('/admin/orders/:id/status', requireAuth, authorize('admin'), updateOrderStatus);

export default router;
