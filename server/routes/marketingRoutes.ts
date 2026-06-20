import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  checkoutCalculateDiscounts,
  getSegments,
  createSegment,
  getPersonalizedRecommendations,
  getRelatedFBTRecommendations,
  triggerAbandonedCartCron,
  getCampaigns,
  createCampaign,
  updateConsentPreference,
  getMarketingMetrics,
  trackAttributionEvent,
  getExperiments,
  createExperiment,
  getExperimentAssignment
} from '../controllers/marketingController.js';

const router = express.Router();

// Coupons
router.get('/coupons', requireAuth, getCoupons);
router.post('/coupons', requireAuth, createCoupon);
router.put('/coupons/:id', requireAuth, updateCoupon);
router.delete('/coupons/:id', requireAuth, deleteCoupon);

// Promotions
router.get('/promotions', requireAuth, getPromotions);
router.post('/promotions', requireAuth, createPromotion);
router.put('/promotions/:id', requireAuth, updatePromotion);
router.delete('/promotions/:id', requireAuth, deletePromotion);

// Calculate checkout discounts
router.post('/checkout/calculate', checkoutCalculateDiscounts);

// Segments
router.get('/segments', requireAuth, getSegments);
router.post('/segments', requireAuth, createSegment);

// Recommendations
router.get('/recommendations/personalized', getPersonalizedRecommendations);
router.get('/recommendations/fbt/:productId', getRelatedFBTRecommendations);

// Campaigns & Cron
router.post('/cron/abandoned-cart', triggerAbandonedCartCron);
router.get('/campaigns', requireAuth, getCampaigns);
router.post('/campaigns', requireAuth, createCampaign);

// GDPR preferences & Attribution
router.post('/consent', updateConsentPreference);
router.post('/attribution', trackAttributionEvent);

// Admin Analytics
router.get('/analytics', requireAuth, getMarketingMetrics);

// A/B Testing
router.get('/experiments', getExperiments);
router.post('/experiments/assign', getExperimentAssignment);

export default router;
