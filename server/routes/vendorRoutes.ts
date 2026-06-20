import express from 'express';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import {
  getMyVendorProfile,
  updateMyVendorProfile,
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorOrders,
  getVendorPayouts,
  getVendorAnalytics,
  adminGetAllVendors,
  adminUpdateVendorStatus
} from '../controllers/vendorController.js';

const router = express.Router();

// Vendor endpoints
router.get('/profile', requireAuth, authorize('vendor'), getMyVendorProfile);
router.put('/profile', requireAuth, authorize('vendor'), updateMyVendorProfile);
router.get('/products', requireAuth, authorize('vendor'), getVendorProducts);
router.post('/products', requireAuth, authorize('vendor'), createVendorProduct);
router.put('/products/:id', requireAuth, authorize('vendor'), updateVendorProduct);
router.delete('/products/:id', requireAuth, authorize('vendor'), deleteVendorProduct);
router.get('/orders', requireAuth, authorize('vendor'), getVendorOrders);
router.get('/payouts', requireAuth, authorize('vendor'), getVendorPayouts);
router.get('/analytics', requireAuth, authorize('vendor'), getVendorAnalytics);

// Admin endpoints bridging
router.get('/admin/all', requireAuth, authorize('admin'), adminGetAllVendors);
router.put('/admin/:id/status', requireAuth, authorize('admin'), adminUpdateVendorStatus);

export default router;
