import { Router } from 'express';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import {
  getLoyaltyDashboard,
  claimReferralCode,
  previewRedemptionValue,
  adminLoadLoyaltyPoints,
  adminGetLoyaltyUsers,
  adminUpdateLoyaltyTierConfig,
  adminGetLoyaltyAnalytics,
  adminRunReconciliation,
} from '../controllers/loyaltyController.js';

const router = Router();

// --- Customer-Only Loyalty APIs ---
router.get('/dashboard', requireAuth, getLoyaltyDashboard);
router.post('/claim-referral', requireAuth, claimReferralCode);
router.post('/preview-redemption', requireAuth, previewRedemptionValue);

// --- Admin-Only Loyalty APIs ---
router.get('/admin/users', requireAuth, authorize('admin'), adminGetLoyaltyUsers);
router.post('/admin/load', requireAuth, authorize('admin'), adminLoadLoyaltyPoints);
router.put('/admin/tier-config', requireAuth, authorize('admin'), adminUpdateLoyaltyTierConfig);
router.get('/admin/analytics', requireAuth, authorize('admin'), adminGetLoyaltyAnalytics);
router.get('/admin/reconciliation', requireAuth, authorize('admin'), adminRunReconciliation);

export default router;
