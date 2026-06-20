import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getWalletDashboard,
  redeemGiftCard,
  getCheckoutAllocationPreview
} from '../controllers/customerWalletController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', getWalletDashboard);
router.post('/redeem', redeemGiftCard);
router.post('/preview-allocations', getCheckoutAllocationPreview);

export default router;
